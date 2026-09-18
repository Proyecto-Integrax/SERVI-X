// Datos de ejemplo para la Fase 0 (mockups). Nada de esto toca una base de datos real.

let seq = 1
function nextId(prefix) {
  return `${prefix}-${String(seq++).padStart(4, '0')}`
}

export const TIPOS_SOLICITUD = ['Peticion', 'Queja', 'Reclamo', 'Sugerencia', 'Felicitacion']

export const ESTADOS = ['Radicado', 'En Revision', 'En Proceso', 'Cerrado']

export const responsables = [
  { responsableId: 'r-agente-1', nombre: 'Luis Ramirez', email: 'luis.ramirez@servix.local', rol: 'Agente', activo: true },
  { responsableId: 'r-agente-2', nombre: 'Juan Torres', email: 'juan.torres@servix.local', rol: 'Agente', activo: true },
  { responsableId: 'r-admin-1', nombre: 'Carla Mendez', email: 'carla.mendez@servix.local', rol: 'Administrador', activo: true },
]

export const clientes = [
  { clienteId: 'c-0001', nombreCompleto: 'Juan Perez', email: 'juan.perez@example.com', telefono: '3001234567' },
  { clienteId: 'c-0002', nombreCompleto: 'Maria Garcia', email: 'maria.garcia@example.com', telefono: '3007654321' },
  { clienteId: 'c-0003', nombreCompleto: 'Carlos Lopez', email: 'carlos.lopez@example.com', telefono: '3009988776' },
]

// Enriquecimiento simulado de SALES-X / LOGISTI-X (secc. 6 del SDD)
export const pedidosExternos = {
  'SALES-X-12345': { pedidoId: 'SALES-X-12345', fechaCompra: '2026-08-20', montoTotal: 189000, estadoPago: 'Pagado' },
}
export const despachosExternos = {
  'LOGISTI-X-67890': { despachoId: 'LOGISTI-X-67890', transportadora: 'Coordinadora', estadoEntrega: 'En transito', fechaEstimada: '2026-09-22' },
}

export const casos = [
  {
    casoId: 'PQR001',
    clienteId: 'c-0001',
    pedidoId: 'SALES-X-12345',
    despachoId: 'LOGISTI-X-67890',
    tipoSolicitud: 'Reclamo',
    descripcion: 'El cliente reporta que el producto llego danado y solicita un reemplazo.',
    estadoAtencion: 'En Proceso',
    responsableId: 'r-agente-1',
    fechaCreacion: '2026-09-10T10:00:00Z',
  },
  {
    casoId: 'PQR002',
    clienteId: 'c-0002',
    pedidoId: null,
    despachoId: null,
    tipoSolicitud: 'Queja',
    descripcion: 'Demora en la atencion telefonica.',
    estadoAtencion: 'Cerrado',
    responsableId: 'r-agente-2',
    fechaCreacion: '2026-09-05T09:30:00Z',
  },
  {
    casoId: 'PQR003',
    clienteId: 'c-0003',
    pedidoId: null,
    despachoId: null,
    tipoSolicitud: 'Peticion',
    descripcion: 'Solicita copia de la factura del ultimo pedido.',
    estadoAtencion: 'Radicado',
    responsableId: null,
    fechaCreacion: '2026-09-15T14:00:00Z',
  },
]

export const historial = [
  { historialId: nextId('H'), casoId: 'PQR001', accion: 'Creacion', estadoNuevo: 'Radicado', observacion: 'Caso radicado por el cliente.', usuarioId: 'c-0001', fechaRegistro: '2026-09-10T10:00:00Z' },
  { historialId: nextId('H'), casoId: 'PQR001', accion: 'Asignacion', estadoNuevo: 'Radicado', observacion: 'Asignado a Luis Ramirez.', usuarioId: 'r-admin-1', fechaRegistro: '2026-09-10T10:30:00Z' },
  { historialId: nextId('H'), casoId: 'PQR001', accion: 'CambioEstado', estadoNuevo: 'En Proceso', observacion: 'Se inicia revision con el operador logistico.', usuarioId: 'r-agente-1', fechaRegistro: '2026-09-10T11:15:00Z' },
  { historialId: nextId('H'), casoId: 'PQR002', accion: 'Creacion', estadoNuevo: 'Radicado', observacion: 'Caso radicado por el cliente.', usuarioId: 'c-0002', fechaRegistro: '2026-09-05T09:30:00Z' },
  { historialId: nextId('H'), casoId: 'PQR002', accion: 'RespuestaOficial', estadoNuevo: 'En Proceso', observacion: 'Ofrecemos disculpas por la demora, se refuerza el equipo de atencion.', usuarioId: 'r-agente-2', fechaRegistro: '2026-09-06T08:00:00Z' },
  { historialId: nextId('H'), casoId: 'PQR002', accion: 'Cierre', estadoNuevo: 'Cerrado', observacion: 'Caso resuelto y comunicado al cliente.', usuarioId: 'r-agente-2', fechaRegistro: '2026-09-06T08:05:00Z' },
  { historialId: nextId('H'), casoId: 'PQR003', accion: 'Creacion', estadoNuevo: 'Radicado', observacion: 'Caso radicado por el cliente.', usuarioId: 'c-0003', fechaRegistro: '2026-09-15T14:00:00Z' },
]

export function genCasoId() {
  return nextId('PQR')
}
export function genHistorialId() {
  return nextId('H')
}
