import { FORMATO_MONEDA } from '../../utils/formatters'

type AdminKpiGridProps = {
  ventaTotalGlobal: number
  sucursalTop: { name: string; value: number }
}

export default function GrillaKpiAdmin({ ventaTotalGlobal, sucursalTop }: AdminKpiGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      <article className="tarjeta-resumen" style={{ borderLeft: '5px solid #0f766e' }}>
        <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>VENTA TOTAL RED</span>
        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f766e', margin: '5px 0' }}>
          {FORMATO_MONEDA.format(ventaTotalGlobal)}
        </p>
        <span style={{ fontSize: '0.8rem', color: '#10b981' }}>↑ Rendimiento Global</span>
      </article>

      <article className="tarjeta-resumen" style={{ borderLeft: '5px solid #2563eb' }}>
        <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>SUCURSAL LÍDER</span>
        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2563eb', margin: '5px 0' }}>
          {sucursalTop.name}
        </p>
        <span style={{ fontSize: '0.8rem', color: '#2563eb' }}>{FORMATO_MONEDA.format(sucursalTop.value)} facturados</span>
      </article>

      <article className="tarjeta-resumen" style={{ borderLeft: '5px solid #7c3aed' }}>
        <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>OPERATIVIDAD</span>
        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#7c3aed', margin: '5px 0' }}>
          100%
        </p>
        <span style={{ fontSize: '0.8rem', color: '#7c3aed' }}>Sistema en línea</span>
      </article>
    </div>
  )
}
