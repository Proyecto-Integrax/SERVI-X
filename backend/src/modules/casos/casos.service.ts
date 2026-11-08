import { prisma } from '../../config/prisma'
import { ApiError } from '../../common/ApiError'
import { AuthUser } from '../../middlewares/auth.jwt'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// casoId es columna uuid: Prisma rechaza con un 500 si se intenta filtrar con
// texto que no sea un UUID valido. Para busqueda libre, solo se filtra por
// casoId cuando el texto es un UUID completo; si no, se busca por cliente/descripcion.
function textoCasoWhere(texto: string) {
  const t = texto.trim()
  if (!t) return undefined
  const or: any[] = [
    { descripcion: { contains: t, mode: 'insensitive' } },
    { cliente: { nombreCompleto: { contains: t, mode: 'insensitive' } } },
  ]
  if (UUID_RE.test(t)) or.unshift({ casoId: { equals: t } })
  return { OR: or }
}

function serializeCaso(caso: any) {
  return {
    casoId: caso.casoId,
    clienteId: caso.clienteId,
    clienteNombre: caso.cliente?.nombreCompleto,
    pedidoId: caso.pedidoId,
    despachoId: caso.despachoId,
    tipoSolicitud: caso.tipoSolicitud,
    descripcion: caso.descripcion,
    estadoAtencion: caso.estadoAtencion,
    responsableId: caso.responsableId,
    fechaCreacion: caso.fechaCreacion,
    fechaCierre: caso.fechaCierre,
  }
}

function serializeHistorial(h: any) {
  return {
    historialId: h.historialId,
    casoId: h.casoId,
    accion: h.accion,
    estadoAnterior: h.estadoAnterior,
    estadoNuevo: h.estadoNuevo,
    observacion: h.accionRealizada,
    usuarioId: h.usuarioAccionId,
    fechaRegistro: h.fechaRegistro,
  }
}

// RF-05 / UC-05. RN-04: inserta caso + primer historial en una transaccion.
export async function crearCaso(
  { tipoSolicitud, descripcion, pedidoId, despachoId }: any,
  actor: AuthUser,
) {
  if (!tipoSolicitud || !descripcion) throw new ApiError(400, 'tipoSolicitud y descripcion son obligatorios.')
  if (actor.rol !== 'Cliente') throw new ApiError(400, 'Solo un Cliente puede radicar PQRS en este endpoint.')

  const caso = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.caso.create({
      data: { clienteId: actor.usuarioId, pedidoId: pedidoId || null, despachoId: despachoId || null, tipoSolicitud, descripcion },
    })
    await tx.historialAtencion.create({
      data: {
        casoId: nuevo.casoId, estadoAnterior: null, estadoNuevo: 'Radicado',
        accionRealizada: 'Caso radicado.', usuarioAccionId: actor.usuarioId, accion: 'Creacion',
      },
    })
    return nuevo
  })
  return serializeCaso(caso)
}

// RF-03 / UC-03
export async function listarCasos(filtros: any, actor: AuthUser) {
  const where: any = {}
  if (actor.rol === 'Cliente') where.clienteId = actor.usuarioId
  if (filtros.estado) where.estadoAtencion = filtros.estado
  if (filtros.tipoSolicitud) where.tipoSolicitud = filtros.tipoSolicitud
  if (filtros.texto) Object.assign(where, textoCasoWhere(filtros.texto))
  if (filtros.fecha) {
    const start = new Date(`${filtros.fecha}T00:00:00.000Z`)
    const end = new Date(`${filtros.fecha}T23:59:59.999Z`)
    where.fechaCreacion = { gte: start, lte: end }
  }
  const casos = await prisma.caso.findMany({ where, include: { cliente: true }, orderBy: { fechaCreacion: 'desc' } })
  return casos.map(serializeCaso)
}

// RF-04 / UC-04
export async function obtenerCaso(casoId: string, actor: AuthUser) {
  const caso = await prisma.caso.findUnique({ where: { casoId }, include: { cliente: true, responsable: true } })
  if (!caso) throw new ApiError(404, 'Caso no encontrado.')
  if (actor.rol === 'Cliente' && caso.clienteId !== actor.usuarioId) {
    throw new ApiError(403, 'No tiene acceso a este caso.')
  }
  const historial = await prisma.historialAtencion.findMany({ where: { casoId }, orderBy: { fechaRegistro: 'asc' } })
  return {
    caso: serializeCaso(caso),
    cliente: { clienteId: caso.cliente.clienteId, nombreCompleto: caso.cliente.nombreCompleto, email: caso.cliente.email },
    responsable: caso.responsable ? { responsableId: caso.responsable.responsableId, nombre: caso.responsable.nombreCompleto } : null,
    pedido: null,
    despacho: null,
    historial: historial.map(serializeHistorial),
  }
}

async function requireCasoAbierto(casoId: string) {
  const caso = await prisma.caso.findUnique({ where: { casoId } })
  if (!caso) throw new ApiError(404, 'Caso no encontrado.')
  if (caso.estadoAtencion === 'Cerrado') throw new ApiError(400, 'El caso esta cerrado, no admite cambios.')
  return caso
}

// RF-06 / UC-06
export async function asignarResponsable(casoId: string, responsableId: string, actor: AuthUser) {
  const caso = await requireCasoAbierto(casoId)
  const responsable = await prisma.responsable.findUnique({ where: { responsableId } })
  if (!responsable) throw new ApiError(404, 'Responsable no encontrado.')

  const actualizado = await prisma.$transaction(async (tx) => {
    const c = await tx.caso.update({ where: { casoId }, data: { responsableId } })
    await tx.historialAtencion.create({
      data: {
        casoId, estadoAnterior: caso.estadoAtencion, estadoNuevo: caso.estadoAtencion,
        accionRealizada: `Asignado a ${responsable.nombreCompleto}.`, usuarioAccionId: actor.usuarioId, accion: 'Asignacion',
      },
    })
    return c
  })
  return serializeCaso(actualizado)
}

// RF-07 / UC-07
export async function actualizarEstado(casoId: string, estadoAtencion: string, observacion: string, actor: AuthUser) {
  const caso = await requireCasoAbierto(casoId)
  if (!observacion || !observacion.trim()) throw new ApiError(400, 'La observacion es obligatoria para cambiar de estado.')

  const actualizado = await prisma.$transaction(async (tx) => {
    const c = await tx.caso.update({ where: { casoId }, data: { estadoAtencion } })
    await tx.historialAtencion.create({
      data: {
        casoId, estadoAnterior: caso.estadoAtencion, estadoNuevo: estadoAtencion,
        accionRealizada: observacion, usuarioAccionId: actor.usuarioId, accion: 'CambioEstado',
      },
    })
    return c
  })
  return serializeCaso(actualizado)
}

// RF-10 / UC-10
export async function registrarRespuesta(casoId: string, texto: string, actor: AuthUser) {
  const caso = await requireCasoAbierto(casoId)
  if (!texto || !texto.trim()) throw new ApiError(400, 'La respuesta no puede estar vacia.')

  await prisma.historialAtencion.create({
    data: {
      casoId, estadoAnterior: caso.estadoAtencion, estadoNuevo: caso.estadoAtencion,
      accionRealizada: texto, usuarioAccionId: actor.usuarioId, accion: 'RespuestaOficial',
    },
  })
  return serializeCaso(caso)
}

// RF-09 / UC-09. RN-03: no cerrar sin respuesta oficial previa.
export async function cerrarCaso(casoId: string, actor: AuthUser) {
  const caso = await prisma.caso.findUnique({ where: { casoId } })
  if (!caso) throw new ApiError(404, 'Caso no encontrado.')
  if (caso.estadoAtencion === 'Cerrado') throw new ApiError(400, 'El caso ya esta cerrado.')

  const tieneRespuesta = await prisma.historialAtencion.findFirst({
    where: { casoId, accion: 'RespuestaOficial' },
  })
  if (!tieneRespuesta) throw new ApiError(400, 'No se puede cerrar un caso sin emitir una respuesta oficial.')

  const actualizado = await prisma.$transaction(async (tx) => {
    const c = await tx.caso.update({ where: { casoId }, data: { estadoAtencion: 'Cerrado', fechaCierre: new Date() } })
    await tx.historialAtencion.create({
      data: {
        casoId, estadoAnterior: caso.estadoAtencion, estadoNuevo: 'Cerrado',
        accionRealizada: 'Caso cerrado.', usuarioAccionId: actor.usuarioId, accion: 'Cierre',
      },
    })
    return c
  })
  return serializeCaso(actualizado)
}

// RF-04 / UC-04 (historial global, con filtro opcional por cliente)
export async function listarHistorial(filtros: any, actor: AuthUser) {
  const where: any = {}
  if (actor.rol === 'Cliente') where.caso = { clienteId: actor.usuarioId }
  if (filtros.estado) where.estadoNuevo = filtros.estado
  if (filtros.texto) {
    const t = String(filtros.texto).trim()
    where.OR = UUID_RE.test(t)
      ? [{ casoId: { equals: t } }]
      : [
          { accionRealizada: { contains: t, mode: 'insensitive' } },
          { caso: { descripcion: { contains: t, mode: 'insensitive' } } },
          { caso: { cliente: { nombreCompleto: { contains: t, mode: 'insensitive' } } } },
        ]
  }

  const eventos = await prisma.historialAtencion.findMany({
    where, include: { caso: { include: { responsable: true } } }, orderBy: { fechaRegistro: 'desc' },
  })
  return eventos
    .filter((h) => !filtros.fecha || h.fechaRegistro.toISOString().slice(0, 10) === filtros.fecha)
    .filter((h) => !filtros.tipoSolicitud || h.caso.tipoSolicitud === filtros.tipoSolicitud)
    .map((h) => ({
      ...serializeHistorial(h),
      tipoSolicitud: h.caso.tipoSolicitud,
      responsableNombre: h.caso.responsable?.nombreCompleto || (h.usuarioAccionId === h.caso.clienteId ? 'Cliente' : h.usuarioAccionId),
    }))
}
