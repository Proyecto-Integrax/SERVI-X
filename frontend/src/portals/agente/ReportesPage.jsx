import { useState } from 'react'
import { api } from '../../api'
import { AppShell } from '../../components/AppShell'

export function ReportesPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(false)

  async function generar() {
    setLoading(true)
    const data = await api.reportesResumen({ desde, hasta })
    setResumen(data)
    setLoading(false)
  }

  return (
    <AppShell>
      <h1>Informes</h1>
      <div className="panel" style={{ maxWidth: 480 }}>
        <h3>Generar Nuevo Informe</h3>
        <div className="field">
          <label>Fecha de Inicio</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="field">
          <label>Fecha de Fin</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={generar} disabled={loading}>
          {loading ? 'Generando...' : 'Generar Informe'}
        </button>
      </div>

      {resumen && (
        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="panel">
            <h3>Casos por Tipo de Solicitud</h3>
            <table>
              <tbody>
                {Object.entries(resumen.porTipo).map(([tipo, n]) => (
                  <tr key={tipo}><td>{tipo}</td><td>{n}</td></tr>
                ))}
                {Object.keys(resumen.porTipo).length === 0 && <tr><td>Sin datos en el rango.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <h3>Casos por Estado de Atencion</h3>
            <table>
              <tbody>
                {Object.entries(resumen.porEstado).map(([estado, n]) => (
                  <tr key={estado}><td>{estado}</td><td>{n}</td></tr>
                ))}
                {Object.keys(resumen.porEstado).length === 0 && <tr><td>Sin datos en el rango.</td></tr>}
              </tbody>
            </table>
          </div>
          <p style={{ gridColumn: '1 / -1' }}><strong>Total casos en el rango:</strong> {resumen.total}</p>
        </div>
      )}
    </AppShell>
  )
}
