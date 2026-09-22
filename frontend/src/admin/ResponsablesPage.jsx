import { useEffect, useState } from 'react'
import { api } from '../api'
import { AppShell } from '../components/AppShell'

export function ResponsablesPage() {
  const [responsables, setResponsables] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'Agente', password: '' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  function cargar() {
    api.listarResponsables().then(setResponsables)
  }

  useEffect(cargar, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setOk('')
    try {
      await api.crearResponsable(form)
      setForm({ nombre: '', email: '', rol: 'Agente', password: '' })
      setOk('Responsable creado correctamente.')
      cargar()
    } catch (err) {
      setError(err.message || 'No se pudo crear el responsable.')
    }
  }

  return (
    <AppShell>
      <h1>Gestion de Responsables</h1>
      <div className="grid-2">
        <div className="panel">
          <h3>Registrar nuevo responsable</h3>
          {error && <div className="error-banner">{error}</div>}
          {ok && <div className="hint-banner">{ok}</div>}
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Nombre</label>
              <input required value={form.nombre} onChange={set('nombre')} />
            </div>
            <div className="field">
              <label>Correo corporativo</label>
              <input type="email" required value={form.email} onChange={set('email')} />
            </div>
            <div className="field">
              <label>Rol</label>
              <select value={form.rol} onChange={set('rol')}>
                <option value="Agente">Agente</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            <div className="field">
              <label>Contrasena</label>
              <input type="password" required value={form.password} onChange={set('password')} />
            </div>
            <button className="btn btn-primary">Crear responsable</button>
          </form>
        </div>

        <div className="panel">
          <h3>Responsables activos</h3>
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th></tr></thead>
            <tbody>
              {responsables.map((r) => (
                <tr key={r.responsableId}><td>{r.nombre}</td><td>{r.email}</td><td>{r.rol}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
