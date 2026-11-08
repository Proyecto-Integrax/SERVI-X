import { useEffect, useState } from 'react'
import { api } from '../api'
import { AppShell } from '../components/AppShell'

export function ResponsablesPage() {
  const [responsables, setResponsables] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'Agente', password: '' })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ nombre: '', rol: 'Agente' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  function cargar() {
    api.listarResponsables({ incluirInactivos: true }).then(setResponsables)
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

  function iniciarEdicion(r) {
    setEditId(r.responsableId)
    setEditForm({ nombre: r.nombre, rol: r.rol })
  }

  async function guardarEdicion(responsableId) {
    setError('')
    setOk('')
    try {
      await api.actualizarResponsable(responsableId, editForm)
      setOk('Responsable actualizado.')
      setEditId(null)
      cargar()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el responsable.')
    }
  }

  async function alternarActivo(r) {
    setError('')
    setOk('')
    try {
      if (r.activo) await api.eliminarResponsable(r.responsableId)
      else await api.reactivarResponsable(r.responsableId)
      cargar()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado.')
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
          <h3>Responsables</h3>
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {responsables.map((r) => (
                <tr key={r.responsableId}>
                  {editId === r.responsableId ? (
                    <>
                      <td><input value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} /></td>
                      <td>{r.email}</td>
                      <td>
                        <select value={editForm.rol} onChange={(e) => setEditForm((f) => ({ ...f, rol: e.target.value }))}>
                          <option value="Agente">Agente</option>
                          <option value="Administrador">Administrador</option>
                        </select>
                      </td>
                      <td>{r.activo ? 'Activo' : 'Inactivo'}</td>
                      <td>
                        <button className="btn btn-primary" style={{ width: 'auto', marginRight: 6 }} onClick={() => guardarEdicion(r.responsableId)}>Guardar</button>
                        <button className="btn btn-outline" onClick={() => setEditId(null)}>Cancelar</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{r.nombre}</td>
                      <td>{r.email}</td>
                      <td>{r.rol}</td>
                      <td>{r.activo ? 'Activo' : 'Inactivo'}</td>
                      <td>
                        <button className="btn btn-outline" style={{ marginRight: 6 }} onClick={() => iniciarEdicion(r)}>Editar</button>
                        <button className={r.activo ? 'btn btn-danger' : 'btn btn-success'} onClick={() => alternarActivo(r)}>
                          {r.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
