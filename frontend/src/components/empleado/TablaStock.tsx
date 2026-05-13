import { useState } from 'react'
import type { StockItem } from '../../types'

type TablaStockProps = {
  stock: StockItem[]
}

// Componente para listar el stock actual en formato tabla con filtro por categoría
export default function TablaStock({ stock }: TablaStockProps) {
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODOS')

  const stockFiltrado = categoriaFiltro === 'TODOS'
    ? stock
    : stock.filter(item => (item.categoria || '').toUpperCase() === categoriaFiltro)

  return (
    <section className="tarjeta-panel" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Stock disponible detallado</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          Categoría:
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
          >
            <option value="TODOS">Todos</option>
            <option value="HOGAR">Hogar</option>
            <option value="ELECTRONICA">Electrónica</option>
          </select>
        </label>
      </div>

      {stockFiltrado.length === 0 ? (
        <p className="mensaje">No hay stock registrado para esta categoría.</p>
      ) : (
        <div className="tabla-simple">
          <div className="fila fila-encabezado">
            <span>Categoría</span>
            <span>Producto</span>
            <span>Stock</span>
            <span>Precio Unitario</span>
          </div>
          {stockFiltrado.map((item) => (
            <div key={item.id} className="fila">
              <span>{item.categoria}</span>
              <span>{item.producto}</span>
              <span>{item.cantidad}</span>
              <strong>${item.precioUnitario?.toLocaleString() || 0}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
