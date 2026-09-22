import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { AppShell } from '../../components/AppShell'
import { EstadoBadge } from '../../components/EstadoBadge'

export function MisSolicitudesPage() {
  const { session } = useAuth()
  const [casos, setCasos] = useState([])
  const [texto, setTexto] = useState('')
  const [fecha, setFecha] = useState('')
  const [estado, setEstado] = useState('')
  const [tipoSolicitud, setTipoSolicitud] = useState('')
  const [loading, setLoading] = useState(true)

  async function cargar() {
    setLoading(true)
    const data = await api.listarCasos({ clienteId: session.usuarioId, texto, fecha, estado, tipoSolicitud })
    setCasos(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell>
      <h1>Mis Solicitudes</h1>
      <div className="panel">
        <div className="toolbar">
          <input type="text" placeholder="Buscar por numero de solicitud" value={texto} onChange={(e) => setTexto(e.target.value)} />
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
              <tr><th>ID Solicitud</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {casos.map((c) => (
                <tr key={c.casoId}>
                  <td>{c.casoId}</td>
                  <td>{c.tipoSolicitud}</td>
                  <td>{c.fechaCreacion.slice(0, 10)}</td>
                  <td><EstadoBadge estado={c.estadoAtencion} /></td>
                  <td><Link className="btn btn-outline" to={`/cliente/solicitudes/${c.casoId}`}>Ver Detalles</Link></td>
                </tr>
              ))}
              {casos.length === 0 && <tr><td colSpan={5}>No tienes solicitudes registradas todavia.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  )
}
