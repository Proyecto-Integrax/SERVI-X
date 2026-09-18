export function EstadoBadge({ estado }) {
  const cls = `badge badge-${estado.replace(/\s/g, '')}`
  return <span className={cls}>{estado}</span>
}
