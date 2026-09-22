import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { AppShell } from '../../components/AppShell'
import { EstadoBadge } from '../../components/EstadoBadge'

export function CasosPage() {
  const [casos, setCasos] = useState([])
  const [texto, setTexto] = useState('')
  const [fecha, setFecha] = useState('')
  const [estado, setEstado] = useState('')
  const [tipoSolicitud, setTipoSolicitud] = useState('')
  const [loading, setLoading] = useState(true)

  async function cargar() {
    setLoading(true)
    const data = await api.listarCasos({ texto, fecha, estado, tipoSolicitud })
    setCasos(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell>
      <h1>Lista de PQR</h1>
      <div className="panel">
        <div className="toolbar">
          <input type="text" placeholder="Buscar PQR por numero o cliente" value={texto} onChange={(e) => setTexto(e.target.value)} />
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
          <Link className="btn btn-outline" to="/cliente/radicar" style={{ marginLeft: 'auto' }}>Radicar en nombre del cliente</Link>
        </div>

        {loading ? <p>Cargando...</p> : (
          <table>
            <thead>
              <tr><th>ID de PQR</th><th>Cliente</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {casos.map((c) => (
                <tr key={c.casoId}>
                  <td>{c.casoId}</td>
                  <td>{c.clienteNombre}</td>
                  <td>{c.tipoSolicitud}</td>
                  <td>{c.fechaCreacion.slice(0, 10)}</td>
                  <td><EstadoBadge estado={c.estadoAtencion} /></td>
                  <td><Link className="btn btn-outline" to={`/agente/casos/${c.casoId}`}>Ver Detalles</Link></td>
                </tr>
              ))}
              {casos.length === 0 && <tr><td colSpan={6}>No hay casos que coincidan con el filtro.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  )
}
