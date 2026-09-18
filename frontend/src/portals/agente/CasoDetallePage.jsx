import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { AppShell } from '../../components/AppShell'
import { EstadoBadge } from '../../components/EstadoBadge'

const ACCION_LABEL = {
  Creacion: 'PQR Creada',
  Asignacion: 'Responsable Asignado',
  CambioEstado: 'Estado Actualizado',
  RespuestaOficial: 'Respuesta Oficial Registrada',
  Cierre: 'Caso Cerrado',
}

export function CasoDetallePage() {
  const { casoId } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [responsables, setResponsables] = useState([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [responsableId, setResponsableId] = useState('')
  const [estadoNuevo, setEstadoNuevo] = useState('')
  const [observacion, setObservacion] = useState('')
  const [respuesta, setRespuesta] = useState('')

  async function cargar() {
    const detalle = await api.obtenerCaso(casoId)
    setData(detalle)
    setResponsableId(detalle.caso.responsableId || '')
    setEstadoNuevo(detalle.caso.estadoAtencion)
  }

  useEffect(() => {
    cargar()
    api.listarResponsables().then(setResponsables)
  }, [casoId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return <AppShell><p>Cargando...</p></AppShell>

  const { caso, cliente, pedido, despacho, historial } = data
  const cerrado = caso.estadoAtencion === 'Cerrado'
  const tieneRespuesta = historial.some((h) => h.accion === 'RespuestaOficial')

  async function runAction(fn) {
    setError('')
    setOk('')
    try {
      await fn()
      await cargar()
    } catch (err) {
      setError(err.message || 'Ocurrio un error.')
    }
  }

  return (
    <AppShell>
      <p><Link to="/agente/casos">&larr; Volver a la lista de PQR</Link></p>
      <h1>Detalle de PQR — {caso.casoId}</h1>
      {error && <div className="error-banner">{error}</div>}
      {ok && <div className="hint-banner">{ok}</div>}

      <div className="grid-2">
        <div className="panel">
          <p><strong>Estado actual:</strong> <EstadoBadge estado={caso.estadoAtencion} /></p>
          <p><strong>Tipo:</strong> {caso.tipoSolicitud}</p>
          <p><strong>Descripcion del caso:</strong> {caso.descripcion}</p>

          <h3>Datos del Cliente (via CRM-X)</h3>
          <input className="readonly-field" disabled value={cliente ? `${cliente.nombreCompleto} · ${cliente.email}` : 'Sin datos'} style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #d7d7e0', borderRadius: 6 }} />

          <h3># de Pedido (via SALES-X)</h3>
          <input className="readonly-field" disabled value={pedido ? `${pedido.pedidoId} · ${pedido.estadoPago} · $${pedido.montoTotal}` : caso.pedidoId || 'No asociado'} style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #d7d7e0', borderRadius: 6 }} />

          <h3># de Despacho (via LOGISTI-X)</h3>
          <input className="readonly-field" disabled value={despacho ? `${despacho.despachoId} · ${despacho.estadoEntrega} · ETA ${despacho.fechaEstimada}` : caso.despachoId || 'No asociado'} style={{ width: '100%', padding: 10, border: '1px solid #d7d7e0', borderRadius: 6 }} />

          <h3>Asignar responsable</h3>
          <div className="field">
            <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} disabled={cerrado}>
              <option value="">Seleccione encargado</option>
              {responsables.map((r) => <option key={r.responsableId} value={r.responsableId}>{r.nombre} ({r.rol})</option>)}
            </select>
          </div>
          <button className="btn btn-outline" disabled={cerrado || !responsableId}
            onClick={() => runAction(async () => {
              await api.asignarResponsable(caso.casoId, responsableId, session)
              setOk('Responsable asignado.')
            })}>
            Asignar
          </button>

          <h3 style={{ marginTop: 24 }}>Actualizar estado</h3>
          <div className="field">
            <select value={estadoNuevo} onChange={(e) => setEstadoNuevo(e.target.value)} disabled={cerrado}>
              {api.ESTADOS.filter((e) => e !== 'Cerrado').map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="field">
            <textarea placeholder="Justificacion del cambio de estado (obligatoria)" value={observacion} onChange={(e) => setObservacion(e.target.value)} disabled={cerrado} />
          </div>
          <button className="btn btn-outline" disabled={cerrado}
            onClick={() => runAction(async () => {
              await api.actualizarEstado(caso.casoId, estadoNuevo, observacion, session)
              setObservacion('')
              setOk('Estado actualizado.')
            })}>
            Actualizar
          </button>

          <h3 style={{ marginTop: 24 }}>Redactar Respuesta Oficial</h3>
          <div className="field">
            <textarea placeholder="Ingresar respuesta" value={respuesta} onChange={(e) => setRespuesta(e.target.value)} disabled={cerrado} />
          </div>
          <button className="btn btn-success" disabled={cerrado}
            onClick={() => runAction(async () => {
              await api.registrarRespuesta(caso.casoId, respuesta, session)
              setRespuesta('')
              setOk('Respuesta registrada.')
            })}>
            Registrar respuesta
          </button>

          <h3 style={{ marginTop: 24 }}>Cerrar caso</h3>
          {!tieneRespuesta && !cerrado && (
            <p className="hint-banner">No se puede cerrar un caso sin emitir una respuesta oficial (RN-03).</p>
          )}
          <button className="btn btn-danger" disabled={cerrado || !tieneRespuesta}
            onClick={() => runAction(async () => {
              await api.cerrarCaso(caso.casoId, session)
              setOk('Caso cerrado.')
              setTimeout(() => navigate('/agente/casos'), 700)
            })}>
            Cerrar
          </button>
        </div>

        <div className="panel">
          <h3>Historial de Atencion (Auditoria)</h3>
          <ul className="timeline">
            {historial.map((h) => (
              <li key={h.historialId}>
                <div className="titulo">{ACCION_LABEL[h.accion] || h.accion}</div>
                <div className="meta">{h.observacion}</div>
                <div className="meta">{new Date(h.fechaRegistro).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
