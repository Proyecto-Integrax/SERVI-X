// Fase 1: implementacion real contra el backend Express + PostgreSQL.
// Misma forma (mismos metodos, mismos parametros, mismos objetos de retorno) que ./mock/mockApi.js
// para que ningun componente de pagina tenga que cambiar al pasar de mock a real.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
// Tipologia exacta exigida por UC-05/HU-05 del documento.
const TIPOS_SOLICITUD = ['Peticion', 'Queja', 'Reclamo', 'Solicitud', 'Felicitacion', 'Observacion']
const ESTADOS = ['Radicado', 'En Revision', 'En Proceso', 'Cerrado']

function getToken() {
  const raw = localStorage.getItem('servix_session_v1')
  if (!raw) return null
  try { return JSON.parse(raw).token } catch { return null }
}

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error || 'Error inesperado.')
  return data
}

function qs(params = {}) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

export const httpApi = {
  TIPOS_SOLICITUD,
  ESTADOS,

  async registrarCliente(data) {
    return request('POST', '/usuarios', data)
  },

  async login({ email, password }) {
    return request('POST', '/auth/login', { email, password })
  },

  async crearCaso(data) {
    return request('POST', '/casos', data)
  },

  async listarCasos(filtros = {}) {
    return request('GET', `/casos${qs(filtros)}`)
  },

  async obtenerCaso(casoId) {
    return request('GET', `/casos/${casoId}/historial`)
  },

  async listarResponsables(filtros = {}) {
    return request('GET', `/responsables${qs(filtros)}`)
  },

  async crearResponsable(data) {
    return request('POST', '/responsables', data)
  },

  async actualizarResponsable(responsableId, data) {
    return request('PATCH', `/responsables/${responsableId}`, data)
  },

  async eliminarResponsable(responsableId) {
    return request('DELETE', `/responsables/${responsableId}`)
  },

  async reactivarResponsable(responsableId) {
    return request('PATCH', `/responsables/${responsableId}/reactivar`)
  },

  async asignarResponsable(casoId, responsableId) {
    return request('PATCH', `/casos/${casoId}/asignacion`, { responsableId })
  },

  async actualizarEstado(casoId, estadoAtencion, observacion) {
    return request('PATCH', `/casos/${casoId}/estado`, { estadoAtencion, observacion })
  },

  async registrarRespuesta(casoId, texto) {
    return request('POST', `/casos/${casoId}/respuesta`, { texto })
  },

  async cerrarCaso(casoId) {
    return request('PATCH', `/casos/${casoId}/cierre`)
  },

  async reportesResumen(filtros = {}) {
    return request('GET', `/reportes/resumen${qs(filtros)}`)
  },

  async listarHistorial(filtros = {}) {
    return request('GET', `/historial${qs(filtros)}`)
  },
}

export { ApiError }
