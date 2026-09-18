import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api'
import { AppShell } from '../../components/AppShell'
import { EstadoBadge } from '../../components/EstadoBadge'

const ACCION_LABEL = {
  Creacion: 'Solicitud Radicada',
  Asignacion: 'Asignada a un Agente',
  CambioEstado: 'Estado Actualizado',
  RespuestaOficial: 'Respuesta Oficial',
  Cierre: 'Caso Cerrado',
}

export function DetalleSolicitudPage() {
  const { casoId } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.obtenerCaso(casoId).then(setData)
  }, [casoId])

  if (!data) return <AppShell><p>Cargando...</p></AppShell>

  const { caso, historial } = data
  const respuesta = [...historial].reverse().find((h) => h.accion === 'RespuestaOficial')

  return (
    <AppShell>
      <p><Link to="/cliente/mis-solicitudes">&larr; Volver a Mis Solicitudes</Link></p>
      <h1>Solicitud {caso.casoId}</h1>
      <div className="grid-2">
        <div className="panel">
          <p><strong>Tipo:</strong> {caso.tipoSolicitud}</p>
          <p><strong>Estado:</strong> <EstadoBadge estado={caso.estadoAtencion} /></p>
          <p><strong>Descripcion:</strong> {caso.descripcion}</p>

          <h3>Respuesta oficial</h3>
          {respuesta ? (
            <p>{respuesta.observacion}</p>
          ) : (
            <p className="hint-banner">Tu caso aun esta en gestion. Aqui veras la respuesta oficial cuando este disponible.</p>
          )}
        </div>

        <div className="panel">
          <h3>Historial</h3>
          <ul className="timeline">
            {historial.map((h) => (
              <li key={h.historialId}>
                <div className="titulo">{ACCION_LABEL[h.accion] || h.accion}</div>
                <div className="meta">{new Date(h.fechaRegistro).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
