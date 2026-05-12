import { FORMATO_MONEDA } from '../../utils/formatters'

type BranchRankListProps = {
  analiticaSucursales: { name: string; value: number }[]
  sucursalTop: { name: string; value: number }
  colores: string[]
}

export default function ListaRankingSucursales({ analiticaSucursales, sucursalTop, colores }: BranchRankListProps) {
  return (
    <article className="tarjeta-resumen" style={{ background: 'white' }}>
      <h3>Mejor Rendimiento</h3>
      <div style={{ marginTop: '15px' }}>
        {analiticaSucursales.slice(0, 5).map((s, idx) => (
          <div key={s.name} style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{idx + 1}. {s.name}</span>
              <span style={{ fontSize: '0.9rem', color: '#0f766e', fontWeight: 'bold' }}>
                {FORMATO_MONEDA.format(s.value)}
              </span>
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${(s.value / (sucursalTop.value || 1)) * 100}%`, 
                background: colores[idx % colores.length],
                transition: 'width 1s ease-in-out'
              }}></div>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
