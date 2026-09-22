import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { AppShell } from '../../components/AppShell'

export function HistorialPage({ soloPropios = false }) {
  const { session } = useAuth()
  const [eventos, setEventos] = useState([])
  const [texto, setTexto] = useState('')
  const [fecha, setFecha] = useState('')
  const [estado, setEstado] = useState('')
  const [tipoSolicitud, setTipoSolicitud] = useState('')
  const [loading, setLoading] = useState(true)

  const detalleBase = soloPropios ? '/cliente/solicitudes' : '/agente/casos'

  async function cargar() {
    setLoading(true)
    const clienteId = soloPropios ? session.usuarioId : undefined
    const data = await api.listarHistorial({ clienteId, texto, fecha, estado, tipoSolicitud })
    setEventos(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell>
      <h1>Lista de historial</h1>
      <div className="panel">
        <div className="toolbar">
          <input type="text" placeholder="Buscar PQR..." value={texto} onChange={(e) => setTexto(e.target.value)} />
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} title="Filtrar por fecha" />
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Estado: Todos</option>
            {api.ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={tipoSolicitud} onChange={(e) => setTipoSolicitud(e.target.value)}>
            <option value="">Tipo de Solicitud: Todos</option>
            {api.TIPOS_SOLICITUD.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={cargar}>Buscar</button>
        </div>

        {loading ? <p>Cargando...</p> : (
          <table>
            <thead>
              <tr>
                <th>Id registro</th><th>Caso</th><th>Responsable</th><th>Accion</th>
                <th>Estado anterior</th><th>Estado nuevo</th><th>Observacion</th><th>Fecha registro</th><th></th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((h) => (
                <tr key={h.historialId}>
                  <td>{h.historialId}</td>
                  <td>{h.casoId}</td>
                  <td>{h.responsableNombre}</td>
                  <td>{h.accion}</td>
                  <td>{h.estadoAnterior}</td>
                  <td>{h.estadoNuevo}</td>
                  <td>{h.observacion}</td>
                  <td>{new Date(h.fechaRegistro).toLocaleString()}</td>
                  <td><Link className="btn btn-outline" to={`${detalleBase}/${h.casoId}`}>Ver detalles</Link></td>
                </tr>
              ))}
              {eventos.length === 0 && <tr><td colSpan={9}>Sin eventos que coincidan con el filtro.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  )
}
