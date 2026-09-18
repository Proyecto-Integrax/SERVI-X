import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { AppShell } from '../../components/AppShell'

export function RadicarPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ tipoSolicitud: '', descripcion: '', pedidoId: '', despachoId: '' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setOk('')
    setLoading(true)
    try {
      const caso = await api.crearCaso(form, session)
      setOk(`Solicitud ${caso.casoId} radicada correctamente.`)
      setForm({ tipoSolicitud: '', descripcion: '', pedidoId: '', despachoId: '' })
      setTimeout(() => navigate(session.rol === 'Cliente' ? '/cliente/mis-solicitudes' : '/agente/casos'), 900)
    } catch (err) {
      setError(err.message || 'No se pudo radicar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <h1>Radicar nueva solicitud</h1>
      <div className="card" style={{ maxWidth: 480 }}>
        {error && <div className="error-banner">{error}</div>}
        {ok && <div className="hint-banner">{ok}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Tipo de Solicitud</label>
            <select required value={form.tipoSolicitud} onChange={set('tipoSolicitud')}>
              <option value="">Seleccione un tipo</option>
              {api.TIPOS_SOLICITUD.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Descripcion detallada de su caso</label>
            <textarea required value={form.descripcion} onChange={set('descripcion')} placeholder="Describa su caso aqui..." />
          </div>
          <div className="field">
            <label>Numero de Pedido asociado (Opcional)</label>
            <input value={form.pedidoId} onChange={set('pedidoId')} placeholder="Ej: SALES-X-12345" />
          </div>
          <div className="field">
            <label>Numero de Despacho asociado (Opcional)</label>
            <input value={form.despachoId} onChange={set('despachoId')} placeholder="Ej: LOGISTI-X-67890" />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Enviando...' : 'Enviar PQRS'}</button>
        </form>
      </div>
    </AppShell>
  )
}
