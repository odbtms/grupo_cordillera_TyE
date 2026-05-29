type NuevoStockType = {
  categoria: string
  producto: string
  cantidad: number
  precioUnitario: number
}

type FormularioStockProps = {
  nuevoStock: NuevoStockType
  setNuevoStock: (stock: NuevoStockType) => void
  manejarRegistroStock: () => void
  mensajeStock: string
}

// Formulario para que el empleado agregue nuevo inventario (Stock) a su sucursal
export default function FormularioStock({
  nuevoStock,
  setNuevoStock,
  manejarRegistroStock,
  mensajeStock,
}: FormularioStockProps) {
  return (
    <section className="tarjeta-panel" style={{ marginTop: '30px' }}>
      <h3>Registrar stock</h3>
      <div className="formulario-simple" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <label>
          Categoría
          <select className="input-bonito"
            value={nuevoStock.categoria}
            onChange={(e) => setNuevoStock({ ...nuevoStock, categoria: e.target.value })}
          >
            <option value="HOGAR">HOGAR</option>
            <option value="ELECTRONICA">ELECTRONICA</option>
          </select>
        </label>
        <label>
          Producto
          <input
            className="input-bonito"
            type="text"
            placeholder="Nombre del producto"
            value={nuevoStock.producto}
            onChange={(e) => setNuevoStock({ ...nuevoStock, producto: e.target.value })}
          />
        </label>
        <label>
          Cantidad a añadir
          <input
            className="input-bonito"
            type="number"
            value={nuevoStock.cantidad}
            onChange={(e) => setNuevoStock({ ...nuevoStock, cantidad: Number(e.target.value) })}
          />
        </label>
        <label>
          Precio Unitario
          <input
            className="input-bonito"
            type="number"
            value={nuevoStock.precioUnitario}
            onChange={(e) => setNuevoStock({ ...nuevoStock, precioUnitario: Number(e.target.value) })}
          />
        </label>
      </div>
      <button 
        type="button" 
        onClick={manejarRegistroStock} 
        style={{ marginTop: '15px', width: '100%', background: '#0f766e', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}
      >
        Confirmar ingreso de stock
      </button>
      {mensajeStock && <p style={{ marginTop: '10px', color: mensajeStock.includes('éxito') ? 'green' : 'red' }}>{mensajeStock}</p>}
    </section>
  )
}
