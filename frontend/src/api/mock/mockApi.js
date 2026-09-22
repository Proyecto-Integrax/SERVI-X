import {
  TIPOS_SOLICITUD, ESTADOS, responsables as seedResponsables, clientes as seedClientes,
  casos as seedCasos, historial as seedHistorial, pedidosExternos, despachosExternos,
  genCasoId, genHistorialId,
} from './fixtures'

const STORAGE_KEY = 'servix_mock_db_v1'

function loadDb() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* fall through to reseed */ }
  }
  const db = {
    responsables: seedResponsables,
    clientes: seedClientes,
    casos: seedCasos,
    historial: seedHistorial,
  }
  saveDb(db)
  return db
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function nowIso() {
  return new Date().toISOString()
}

export const mockApi = {
  TIPOS_SOLICITUD,
  ESTADOS,

  // ---- Auth / Registro (RF 1.0 y 2.0) ----
  async registrarCliente({ nombre, tipoDocumento, numeroDocumento, email, password }) {
    await delay()
    const db = loadDb()
    if (db.clientes.some((c) => c.email === email)) {
      throw new ApiError(400, 'Ya existe un cliente registrado con ese email.')
    }
    const clienteId = `c-${String(db.clientes.length + 1).padStart(4, '0')}`
    const cliente = { clienteId, nombreCompleto: nombre, tipoDocumento, numeroDocumento, email, telefono: '' }
    db.clientes.push(cliente)
    saveDb(db)
    return { usuarioId: clienteId, rol: 'Cliente', nombre, email }
  },

  async login({ email, password }) {
    await delay()
    const db = loadDb()
    const responsable = db.responsables.find((r) => r.email === email && r.activo)
    if (responsable) {
      return { usuarioId: responsable.responsableId, rol: responsable.rol, nombre: responsable.nombre, email }
    }
    const cliente = db.clientes.find((c) => c.email === email)
    if (cliente) {
      return { usuarioId: cliente.clienteId, rol: 'Cliente', nombre: cliente.nombreCompleto, email }
    }
    throw new ApiError(401, 'Credenciales invalidas.')
  },

  // ---- Casos (RF 5.0 radicar, 3.0/4.0 consultar) ----
  async crearCaso({ tipoSolicitud, descripcion, pedidoId, despachoId }, actor) {
    await delay()
    const db = loadDb()
    const casoId = genCasoId()
    const caso = {
      casoId,
      clienteId: actor.rol === 'Cliente' ? actor.usuarioId : null,
      pedidoId: pedidoId || null,
      despachoId: despachoId || null,
      tipoSolicitud,
      descripcion,
      estadoAtencion: 'Radicado',
      responsableId: null,
      fechaCreacion: nowIso(),
    }
    db.casos.unshift(caso)
    // RN-04: todo caso nuevo genera automaticamente su primer registro de auditoria
    db.historial.unshift({
      historialId: genHistorialId(),
      casoId,
      accion: 'Creacion',
      estadoNuevo: 'Radicado',
      observacion: 'Caso radicado.',
      usuarioId: actor.usuarioId,
      fechaRegistro: nowIso(),
    })
    saveDb(db)
    return caso
  },

  async listarCasos({ clienteId, estado, tipoSolicitud, texto, fecha } = {}) {
    await delay()
    const db = loadDb()
    return db.casos
      .filter((c) => !clienteId || c.clienteId === clienteId)
      .filter((c) => !estado || c.estadoAtencion === estado)
      .filter((c) => !tipoSolicitud || c.tipoSolicitud === tipoSolicitud)
      .filter((c) => !fecha || c.fechaCreacion.slice(0, 10) === fecha)
      .filter((c) => !texto || c.casoId.toLowerCase().includes(texto.toLowerCase()))
      .map((c) => {
        const cliente = db.clientes.find((cl) => cl.clienteId === c.clienteId)
        return { ...c, clienteNombre: cliente ? cliente.nombreCompleto : '—' }
      })
      .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
  },

  async listarClientes() {
    await delay()
    const db = loadDb()
    return db.clientes
  },

  // ---- Historial global (RF 4.0, caso de uso independiente de 3.0) ----
  async listarHistorial({ clienteId, fecha, estado, tipoSolicitud, texto } = {}) {
    await delay()
    const db = loadDb()
    const porCaso = new Map()
    for (const h of [...db.historial].sort((a, b) => new Date(a.fechaRegistro) - new Date(b.fechaRegistro))) {
      const anterior = porCaso.get(h.casoId) || 'Radicado'
      porCaso.set(h.casoId, h.estadoNuevo)
      h._estadoAnterior = anterior
    }
    return db.historial
      .map((h) => {
        const caso = db.casos.find((c) => c.casoId === h.casoId)
        const responsable = db.responsables.find((r) => r.responsableId === h.usuarioId)
        return {
          ...h,
          estadoAnterior: h._estadoAnterior,
          tipoSolicitud: caso ? caso.tipoSolicitud : '',
          casoClienteId: caso ? caso.clienteId : null,
          responsableNombre: responsable ? responsable.nombre : (h.usuarioId.startsWith('c-') ? 'Cliente' : h.usuarioId),
        }
      })
      .filter((h) => !clienteId || h.casoClienteId === clienteId)
      .filter((h) => !fecha || h.fechaRegistro.slice(0, 10) === fecha)
      .filter((h) => !estado || h.estadoNuevo === estado)
      .filter((h) => !tipoSolicitud || h.tipoSolicitud === tipoSolicitud)
      .filter((h) => !texto || h.casoId.toLowerCase().includes(texto.toLowerCase()))
      .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
  },

  async obtenerCaso(casoId) {
    await delay()
    const db = loadDb()
    const caso = db.casos.find((c) => c.casoId === casoId)
    if (!caso) throw new ApiError(404, 'Caso no encontrado.')
    const cliente = db.clientes.find((c) => c.clienteId === caso.clienteId) || null
    const responsable = db.responsables.find((r) => r.responsableId === caso.responsableId) || null
    const pedido = caso.pedidoId ? pedidosExternos[caso.pedidoId] || null : null
    const despacho = caso.despachoId ? despachosExternos[caso.despachoId] || null : null
    const eventos = db.historial
      .filter((h) => h.casoId === casoId)
      .sort((a, b) => new Date(a.fechaRegistro) - new Date(b.fechaRegistro))
    return { caso, cliente, responsable, pedido, despacho, historial: eventos }
  },

  async listarResponsables() {
    await delay()
    const db = loadDb()
    return db.responsables.filter((r) => r.activo)
  },

  async crearResponsable({ nombre, email, rol, password }) {
    await delay()
    const db = loadDb()
    if (db.responsables.some((r) => r.email === email)) {
      throw new ApiError(400, 'Ya existe un responsable con ese email.')
    }
    const responsableId = `r-${rol.toLowerCase()}-${db.responsables.length + 1}`
    const responsable = { responsableId, nombre, email, rol, activo: true }
    db.responsables.push(responsable)
    saveDb(db)
    return responsable
  },

  // ---- Gestion operativa (RF 6.0/7.0/9.0/10.0) ----
  async asignarResponsable(casoId, responsableId, actor) {
    await delay()
    const db = loadDb()
    const caso = db.casos.find((c) => c.casoId === casoId)
    if (!caso) throw new ApiError(404, 'Caso no encontrado.')
    if (caso.estadoAtencion === 'Cerrado') throw new ApiError(400, 'El caso esta cerrado, no admite cambios.')
    const responsable = db.responsables.find((r) => r.responsableId === responsableId)
    caso.responsableId = responsableId
    db.historial.unshift({
      historialId: genHistorialId(),
      casoId,
      accion: 'Asignacion',
      estadoNuevo: caso.estadoAtencion,
      observacion: `Asignado a ${responsable ? responsable.nombre : responsableId}.`,
      usuarioId: actor.usuarioId,
      fechaRegistro: nowIso(),
    })
    saveDb(db)
    return caso
  },

  async actualizarEstado(casoId, estadoAtencion, observacion, actor) {
    await delay()
    const db = loadDb()
    const caso = db.casos.find((c) => c.casoId === casoId)
    if (!caso) throw new ApiError(404, 'Caso no encontrado.')
    if (caso.estadoAtencion === 'Cerrado') throw new ApiError(400, 'El caso esta cerrado, no admite cambios.')
    if (!observacion || !observacion.trim()) throw new ApiError(400, 'La observacion es obligatoria para cambiar de estado.')
    caso.estadoAtencion = estadoAtencion
    db.historial.unshift({
      historialId: genHistorialId(),
      casoId,
      accion: 'CambioEstado',
      estadoNuevo: estadoAtencion,
      observacion,
      usuarioId: actor.usuarioId,
      fechaRegistro: nowIso(),
    })
    saveDb(db)
    return caso
  },

  async registrarRespuesta(casoId, texto, actor) {
    await delay()
    const db = loadDb()
    const caso = db.casos.find((c) => c.casoId === casoId)
    if (!caso) throw new ApiError(404, 'Caso no encontrado.')
    if (caso.estadoAtencion === 'Cerrado') throw new ApiError(400, 'El caso esta cerrado, no admite cambios.')
    if (!texto || !texto.trim()) throw new ApiError(400, 'La respuesta no puede estar vacia.')
    db.historial.unshift({
      historialId: genHistorialId(),
      casoId,
      accion: 'RespuestaOficial',
      estadoNuevo: caso.estadoAtencion,
      observacion: texto,
      usuarioId: actor.usuarioId,
      fechaRegistro: nowIso(),
    })
    saveDb(db)
    return caso
  },

  // RN-03: no se puede cerrar sin respuesta oficial previa
  async cerrarCaso(casoId, actor) {
    await delay()
    const db = loadDb()
    const caso = db.casos.find((c) => c.casoId === casoId)
    if (!caso) throw new ApiError(404, 'Caso no encontrado.')
    if (caso.estadoAtencion === 'Cerrado') throw new ApiError(400, 'El caso ya esta cerrado.')
    const tieneRespuesta = db.historial.some((h) => h.casoId === casoId && h.accion === 'RespuestaOficial')
    if (!tieneRespuesta) {
      throw new ApiError(400, 'No se puede cerrar un caso sin emitir una respuesta oficial.')
    }
    caso.estadoAtencion = 'Cerrado'
    db.historial.unshift({
      historialId: genHistorialId(),
      casoId,
      accion: 'Cierre',
      estadoNuevo: 'Cerrado',
      observacion: 'Caso cerrado.',
      usuarioId: actor.usuarioId,
      fechaRegistro: nowIso(),
    })
    saveDb(db)
    return caso
  },

  // ---- Reportes (RF 8.0) ----
  async reportesResumen({ desde, hasta } = {}) {
    await delay()
    const db = loadDb()
    const casosFiltrados = db.casos.filter((c) => {
      const fecha = c.fechaCreacion.slice(0, 10)
      if (desde && fecha < desde) return false
      if (hasta && fecha > hasta) return false
      return true
    })
    const porTipo = {}
    const porEstado = {}
    for (const c of casosFiltrados) {
      porTipo[c.tipoSolicitud] = (porTipo[c.tipoSolicitud] || 0) + 1
      porEstado[c.estadoAtencion] = (porEstado[c.estadoAtencion] || 0) + 1
    }
    return { total: casosFiltrados.length, porTipo, porEstado }
  },
}

export { ApiError }
