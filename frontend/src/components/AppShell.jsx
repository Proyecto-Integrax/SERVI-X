import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const NAV_BY_ROL = {
  Cliente: [
    { to: '/cliente/radicar', label: 'Radicar PQRS' },
    { to: '/cliente/mis-solicitudes', label: 'Mis Solicitudes' },
    { to: '/cliente/historial', label: 'Historial' },
  ],
  Agente: [
    { to: '/agente/panel', label: 'Panel de Control' },
    { to: '/agente/casos', label: 'PQR' },
    { to: '/agente/historial', label: 'Historial' },
    { to: '/agente/reportes', label: 'Informes' },
  ],
  Administrador: [
    { to: '/agente/panel', label: 'Panel de Control' },
    { to: '/agente/casos', label: 'PQR' },
    { to: '/agente/historial', label: 'Historial' },
    { to: '/agente/reportes', label: 'Informes' },
    { to: '/admin/responsables', label: 'Responsables' },
  ],
}

export function AppShell({ children }) {
  const { session, logout } = useAuth()
  const items = (session && NAV_BY_ROL[session.rol]) || []

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">SERVI-X</div>
        <nav>
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-col">
        <div className="topbar">
          <span>{session ? `${session.nombre} · ${session.rol}` : ''}</span>
          <button className="btn btn-danger" onClick={logout}>Cerrar Sesion</button>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
