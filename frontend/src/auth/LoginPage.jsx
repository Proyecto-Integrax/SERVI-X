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
        <div className="hint-banner" style={{ marginTop: 16 }}>
          <strong>Credenciales de prueba</strong> (contrasena: <code>Clave123*</code>)
          <table style={{ width: '100%', marginTop: 8, fontSize: 13 }}>
            <tbody>
              {DEMO_USERS.map((u) => (
                <tr key={u.email}>
                  <td style={{ padding: '2px 0' }}>{u.rol}</td>
                  <td style={{ padding: '2px 0' }}>{u.email}</td>
                  <td style={{ padding: '2px 0', textAlign: 'right' }}>
                    <button type="button" className="btn btn-outline" style={{ padding: '2px 8px', fontSize: 12 }}
                      onClick={() => { setEmail(u.email); setPassword('Clave123*') }}>
                      Usar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const DEMO_USERS = [
  { rol: 'Cliente', email: 'juan.perez@example.com' },
  { rol: 'Agente', email: 'luis.ramirez@servix.local' },
  { rol: 'Administrador', email: 'carla.mendez@servix.local' },
]
