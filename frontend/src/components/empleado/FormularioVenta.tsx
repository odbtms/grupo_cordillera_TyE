import type { StockItem } from '../../types'

type NuevaVentaType = {
  montoTotal: number
  sistemaOrigen: string
  categoria: string
  producto: string
  cantidad: number
  precioUnitario: number
}

type CarritoItem = {
  producto: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  categoria: string
}

type FormularioVentaProps = {
  sucursalAsignada: string
  nuevaVenta: NuevaVentaType
  setNuevaVenta: React.Dispatch<React.SetStateAction<NuevaVentaType>>
  stock: StockItem[]
  carrito: CarritoItem[]
  setCarrito: React.Dispatch<React.SetStateAction<CarritoItem[]>>
  mensajeVenta: string
  agregarAlVenta: () => void
  procesarVentaCompleta: () => void
}

// Formulario para que el empleado agregue una venta al carrito y la mande al backend
export default function FormularioVenta({
  sucursalAsignada,
  nuevaVenta,
  setNuevaVenta,
  stock,
  carrito,
  setCarrito,
  mensajeVenta,
  agregarAlVenta,
  procesarVentaCompleta,
}: FormularioVentaProps) {
  return (
    <section className="bloque" style={{ marginTop: '30px' }}>
      <div className="panel-head">
        <h2>Registrar Venta</h2>
        <span>Sucursal actual: {sucursalAsignada}</span>
      </div>
      
      <div className="formulario-simple" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <label>
            Sistema origen
            <select className="input-bonito"
              value={nuevaVenta.sistemaOrigen}
              onChange={(e) => setNuevaVenta(a => ({ ...a, sistemaOrigen: e.target.value }))}
            >
              <option value="POS">POS</option>
              <option value="WEB">WEB</option>
              <option value="APP">APP</option>
            </select>
          </label>

          <label>
            Filtrar Categoría
            <select className="input-bonito"
              value={nuevaVenta.categoria}
              onChange={(e) => setNuevaVenta(a => ({ ...a, categoria: e.target.value, producto: '', precioUnitario: 0 }))}
            >
              <option value="TODOS">TODOS</option>
              <option value="ELECTRONICA">ELECTRÓNICA</option>
              <option value="HOGAR">HOGAR</option>
            </select>
          </label>

          <label>
            Producto
            <select className="input-bonito"
              value={nuevaVenta.producto}
              onChange={(e) => {
                const prod = e.target.value;
                const info = stock.find(s => s.producto === prod);
                const precio = info?.precioUnitario || 0;
                setNuevaVenta(a => ({ ...a, producto: prod, precioUnitario: precio, montoTotal: precio * a.cantidad }));
              }}
            >
              <option value="">Seleccione Producto</option>
              {stock
                .filter(s => nuevaVenta.categoria === 'TODOS' || s.categoria.toUpperCase() === nuevaVenta.categoria)
                .map(s => (
                  <option key={s.id} value={s.producto}>{s.producto} (Stock: {s.cantidad})</option>
                ))
              }
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
          <label>
            Cantidad
            <input
              className="input-bonito"
              type="number"
              min={1}
              value={nuevaVenta.cantidad}
              onChange={(e) => {
                const cant = Number(e.target.value);
                setNuevaVenta(a => ({ ...a, cantidad: cant, montoTotal: cant * a.precioUnitario }));
              }}
            />
          </label>
          <label>
            Precio Unitario
            <input className="input-bonito" type="number" value={nuevaVenta.precioUnitario} disabled />
          </label>
          <label>
            Subtotal
            <input className="input-bonito" type="number" value={nuevaVenta.montoTotal} disabled />
          </label>
        </div>

        <button 
          type="button" 
          onClick={agregarAlVenta}
          style={{ width: '100%', marginTop: '15px', background: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Añadir a venta
        </button>
      </div>

      {carrito.length > 0 && (
        <div className="tabla-simple" style={{ marginTop: '20px', border: '1px solid #cbd5e1' }}>
          <div className="panel-head" style={{ padding: '10px', background: '#f1f5f9' }}>
            <h4 style={{ margin: 0 }}>Ventas en total</h4>
          </div>
          <div className="fila fila-encabezado">
            <span>Producto</span>
            <span>Cant</span>
            <span>Subtotal</span>
          </div>
          {carrito.map((item, idx) => (
            <div key={idx} className="fila">
              <span>{item.producto}</span>
              <span>{item.cantidad}</span>
              <span>${item.subtotal.toLocaleString()}</span>
            </div>
          ))}
          <div className="fila" style={{ fontWeight: 'bold', background: '#f8fafc' }}>
            <span>TOTAL</span>
            <span>-</span>
            <span>${carrito.reduce((acc, i) => acc + i.subtotal, 0).toLocaleString()}</span>
          </div>
          <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
            <button onClick={procesarVentaCompleta} style={{ flex: 2, background: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
              Confirmar Venta
            </button>
            <button onClick={() => setCarrito([])} style={{ flex: 1, background: '#64748b', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mensajeVenta && <p style={{ color: mensajeVenta.includes('éxito') ? 'green' : 'red', marginTop: '10px' }}>{mensajeVenta}</p>}
    </section>
  )
}
