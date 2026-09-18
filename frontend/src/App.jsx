import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { RequireRole } from './auth/RequireRole'
import { LoginPage } from './auth/LoginPage'
import { RegistroPage } from './auth/RegistroPage'
import { RadicarPage } from './portals/cliente/RadicarPage'
import { MisSolicitudesPage } from './portals/cliente/MisSolicitudesPage'
import { DetalleSolicitudPage } from './portals/cliente/DetalleSolicitudPage'
import { DashboardPage } from './portals/agente/DashboardPage'
import { CasosPage } from './portals/agente/CasosPage'
import { CasoDetallePage } from './portals/agente/CasoDetallePage'
import { ReportesPage } from './portals/agente/ReportesPage'
import { ResponsablesPage } from './admin/ResponsablesPage'

function Home() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (session.rol === 'Cliente') return <Navigate to="/cliente/mis-solicitudes" replace />
  return <Navigate to="/agente/panel" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />

        <Route path="/cliente/radicar" element={
          <RequireRole roles={['Cliente', 'Agente', 'Administrador']}><RadicarPage /></RequireRole>
        } />
        <Route path="/cliente/mis-solicitudes" element={
          <RequireRole roles={['Cliente']}><MisSolicitudesPage /></RequireRole>
        } />
        <Route path="/cliente/solicitudes/:casoId" element={
          <RequireRole roles={['Cliente']}><DetalleSolicitudPage /></RequireRole>
        } />

        <Route path="/agente/panel" element={
          <RequireRole roles={['Agente', 'Administrador']}><DashboardPage /></RequireRole>
        } />
        <Route path="/agente/casos" element={
          <RequireRole roles={['Agente', 'Administrador']}><CasosPage /></RequireRole>
        } />
        <Route path="/agente/casos/:casoId" element={
          <RequireRole roles={['Agente', 'Administrador']}><CasoDetallePage /></RequireRole>
        } />
        <Route path="/agente/reportes" element={
          <RequireRole roles={['Agente', 'Administrador']}><ReportesPage /></RequireRole>
        } />

        <Route path="/admin/responsables" element={
          <RequireRole roles={['Administrador']}><ResponsablesPage /></RequireRole>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
