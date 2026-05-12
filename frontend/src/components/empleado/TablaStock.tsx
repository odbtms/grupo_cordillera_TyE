import type { StockItem } from '../../types'

type TablaStockProps = {
  stock: StockItem[]
}

// Componente para listar el stock actual en formato tabla
export default function TablaStock({ stock }: TablaStockProps) {
  return (
    <section className="tarjeta-panel" style={{ marginTop: '30px' }}>
      <h3>Stock disponible detallado</h3>
      {stock.length === 0 ? (
        <p className="mensaje">No hay stock registrado para esta sucursal.</p>
      ) : (
        <div className="tabla-simple">
          <div className="fila fila-encabezado">
            <span>Categoría</span>
            <span>Producto</span>
            <span>Stock</span>
            <span>Precio Unitario</span>
          </div>
          {stock.map((item) => (
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
