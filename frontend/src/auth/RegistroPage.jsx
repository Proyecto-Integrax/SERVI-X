import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from './AuthContext'

const TIPOS_DOCUMENTO = ['Cedula de Ciudadania', 'Cedula de Extranjeria', 'Pasaporte', 'NIT']

export function RegistroPage() {
  const [form, setForm] = useState({ nombre: '', tipoDocumento: '', numeroDocumento: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const usuario = await api.registrarCliente(form)
      login(usuario)
      navigate('/cliente/mis-solicitudes')
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card">
        <h2>Registrarse</h2>
        <p className="hint-banner">El autorregistro es solo para Clientes. Las cuentas de Agente y Administrador las crea el Administrador.</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Nombre</label>
            <input required value={form.nombre} onChange={set('nombre')} placeholder="Ingrese su nombre" />
          </div>
          <div className="field">
            <label>Seleccionar tipo de documento</label>
            <select required value={form.tipoDocumento} onChange={set('tipoDocumento')}>
              <option value="">Seleccionar</option>
              {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Numero de documento</label>
            <input required value={form.numeroDocumento} onChange={set('numeroDocumento')} placeholder="Ingrese su numero de documento" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={set('email')} placeholder="Ingrese su email" />
          </div>
          <div className="field">
            <label>Contrasena</label>
            <input type="password" required value={form.password} onChange={set('password')} placeholder="Ingrese su contrasena" />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Creando cuenta...' : 'Acceder'}</button>
        </form>
        <div className="link-row">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </div>
      </div>
    </div>
  )
}
