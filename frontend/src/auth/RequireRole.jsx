import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireRole({ roles, children }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (roles && !roles.includes(session.rol)) return <Navigate to="/" replace />
  return children
}
