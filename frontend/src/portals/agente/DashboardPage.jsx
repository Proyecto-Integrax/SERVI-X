import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { AppShell } from '../../components/AppShell'

export function DashboardPage() {
  const [casos, setCasos] = useState([])

  useEffect(() => { api.listarCasos({}).then(setCasos) }, [])

  const abiertos = casos.filter((c) => c.estadoAtencion !== 'Cerrado')
  const cerrados = casos.filter((c) => c.estadoAtencion === 'Cerrado')
  const porTipo = (tipo) => casos.filter((c) => c.tipoSolicitud === tipo).length
  const sinAsignar = casos.filter((c) => c.estadoAtencion !== 'Cerrado' && !c.responsableId)
  const sinRespuesta = casos.filter((c) => c.estadoAtencion !== 'Cerrado')

  return (
    <AppShell>
      <h1>Panel de Control</h1>
      <div className="grid-2">
        <div className="panel">
          <h3>Resumen del Estado de PQR</h3>
          <div className="grid-2">
            <div><strong>Peticiones:</strong> {porTipo('Peticion')}</div>
            <div><strong>Quejas:</strong> {porTipo('Queja')}</div>
            <div><strong>Reclamos:</strong> {porTipo('Reclamo')}</div>
            <div><strong>Sugerencias:</strong> {porTipo('Sugerencia')}</div>
          </div>
          <p style={{ marginTop: 16 }}>
            <strong>Abiertos:</strong> {abiertos.length} &nbsp;·&nbsp; <strong>Cerrados:</strong> {cerrados.length}
          </p>
        </div>
        <div className="panel">
          <h3>Acciones Pendientes</h3>
          <ul>
            {sinAsignar.slice(0, 5).map((c) => (
              <li key={c.casoId}><Link to={`/agente/casos/${c.casoId}`}>Asignar {c.casoId}</Link></li>
            ))}
            {sinRespuesta.slice(0, 5).map((c) => (
              <li key={`r-${c.casoId}`}><Link to={`/agente/casos/${c.casoId}`}>Revisar {c.casoId}</Link></li>
            ))}
            {casos.length === 0 && <li>Sin pendientes.</li>}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
