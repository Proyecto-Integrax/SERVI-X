import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from './AuthContext'

const HOME_BY_ROL = {
  Cliente: '/cliente/mis-solicitudes',
  Agente: '/agente/panel',
  Administrador: '/agente/panel',
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const usuario = await api.login({ email, password })
      login(usuario)
      navigate(HOME_BY_ROL[usuario.rol] || '/')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card">
        <h2>Iniciar Sesion</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Usuario (email)</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ingrese su usuario" />
          </div>
          <div className="field">
            <label>Contrasena</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingrese su contrasena" />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Ingresando...' : 'Acceder'}</button>
        </form>
        <div className="link-row">
          Eres cliente y no tienes cuenta? <Link to="/registro">Registrate aqui</Link>
        </div>
        <p className="hint-banner" style={{ marginTop: 16 }}>
          Mock demo: prueba con juan.perez@example.com (Cliente), luis.ramirez@servix.local (Agente)
          o carla.mendez@servix.local (Administrador) — cualquier contrasena funciona en esta fase.
        </p>
      </div>
    </div>
  )
}
