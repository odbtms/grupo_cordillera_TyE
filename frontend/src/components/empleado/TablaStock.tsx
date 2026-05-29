import { useState } from 'react'
import type { StockItem } from '../../types'

type EditFields = { producto: string; cantidad: number; precioUnitario: number }

type TablaStockProps = {
  stock: StockItem[]
  onEditar?: (item: StockItem, cambios: EditFields) => Promise<void>
}

export default function TablaStock({ stock, onEditar }: TablaStockProps) {
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODOS')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [camposEdicion, setCamposEdicion] = useState<EditFields>({ producto: '', cantidad: 0, precioUnitario: 0 })
  const [guardando, setGuardando] = useState(false)

  const stockFiltrado = categoriaFiltro === 'TODOS'
    ? stock
    : stock.filter(item => (item.categoria || '').toUpperCase() === categoriaFiltro)

  function iniciarEdicion(item: StockItem) {
    setEditandoId(item.id)
    setCamposEdicion({ producto: item.producto, cantidad: item.cantidad, precioUnitario: item.precioUnitario ?? 0 })
  }

  function cancelarEdicion() {
    setEditandoId(null)
  }

  async function confirmarEdicion(item: StockItem) {
    if (!onEditar) return
    setGuardando(true)
    try {
      await onEditar(item, camposEdicion)
      setEditandoId(null)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="tarjeta-panel" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Stock disponible detallado</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          Categoría:
          <select
            className="input-bonito"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            style={{ width: 'auto' }}
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
            {onEditar && <span>Acciones</span>}
          </div>
          {stockFiltrado.map((item) => {
            const enEdicion = editandoId === item.id
            return (
              <div key={item.id} className="fila">
                <span>{item.categoria}</span>

                {enEdicion ? (
                  <>
                    <input
                      className="input-bonito"
                      type="text"
                      value={camposEdicion.producto}
                      onChange={(e) => setCamposEdicion(c => ({ ...c, producto: e.target.value }))}
                      style={{ padding: '4px 6px', width: '100%' }}
                    />
                    <input
                      className="input-bonito"
                      type="number"
                      min={0}
                      value={camposEdicion.cantidad}
                      onChange={(e) => setCamposEdicion(c => ({ ...c, cantidad: Number(e.target.value) }))}
                      style={{ padding: '4px 6px', width: '80px' }}
                    />
                    <input
                      className="input-bonito"
                      type="number"
                      min={0}
                      value={camposEdicion.precioUnitario}
                      onChange={(e) => setCamposEdicion(c => ({ ...c, precioUnitario: Number(e.target.value) }))}
                      style={{ padding: '4px 6px', width: '100px' }}
                    />
                    <span style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={guardando}
                        onClick={() => confirmarEdicion(item)}
                        style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        {guardando ? '...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicion}
                        style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        Cancelar
                      </button>
                    </span>
                  </>
                ) : (
                  <>
                    <span>{item.producto}</span>
                    <span>{item.cantidad}</span>
                    <strong>${item.precioUnitario?.toLocaleString() || 0}</strong>
                    {onEditar && (
                      <span>
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(item)}
                          style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.82rem' }}
                        >
                          Editar
                        </button>
                      </span>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
