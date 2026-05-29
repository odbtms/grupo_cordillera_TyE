
type StockInputType = {
  sucursal: string;
  categoria: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
};

type AdminStockManagerProps = {
  nuevoStock: StockInputType;
  setNuevoStock: React.Dispatch<React.SetStateAction<StockInputType>>;
  sucursales: Array<{ nombre: string }>;
  guardarStock: () => void;
  mensajeStock: string;
};

export default function GestorInventarioAdmin({
  nuevoStock,
  setNuevoStock,
  sucursales,
  guardarStock,
  mensajeStock,
}: AdminStockManagerProps) {
  return (
    <section className="tarjeta-panel" style={{ marginTop: '20px' }}>
      <h3>Gestión de Inventario</h3>
      <p className="mensaje">Actualiza el stock real disponible por sucursal y categoría.</p>
      
      <div className="formulario-simple" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <label>
          Sucursal
          <select className="input-bonito"
            value={nuevoStock.sucursal}
            onChange={(e) => setNuevoStock((a: StockInputType) => ({ ...a, sucursal: e.target.value }))}
          >
            <option value="">Seleccione Sucursal</option>
            {sucursales.map(s => (
              <option key={s.nombre} value={s.nombre}>{s.nombre}</option>
            ))}
          </select>
        </label>

        <label>
          Categoría
          <select className="input-bonito"
            value={nuevoStock.categoria}
            onChange={(e) => setNuevoStock((a: StockInputType) => ({ ...a, categoria: e.target.value }))}
          >
            <option value="ELECTRONICA">ELECTRONICA</option>
            <option value="HOGAR">HOGAR</option>
          </select>
        </label>

        <label style={{ gridColumn: 'span 2' }}>
          Nombre del Producto
          <input
            className="input-bonito"
            type="text"
            placeholder="Ej: Televisor"
            value={nuevoStock.producto}
            onChange={(e) => setNuevoStock((a: StockInputType) => ({ ...a, producto: e.target.value }))}
          />
        </label>

        <label>
          Cantidad
          <input
            className="input-bonito"
            type="number"
            min={0}
            value={nuevoStock.cantidad}
            onChange={(e) => setNuevoStock((a: StockInputType) => ({ ...a, cantidad: Number(e.target.value) }))}
          />
        </label>

        <label>
          Precio de Venta ($)
          <input
            className="input-bonito"
            type="number"
            min={0}
            value={nuevoStock.precioUnitario}
            onChange={(e) => setNuevoStock((a: StockInputType) => ({ ...a, precioUnitario: Number(e.target.value) }))}
          />
        </label>

        <button 
          onClick={guardarStock}
          style={{ gridColumn: 'span 2', background: '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Actualizar Stock
        </button>
      </div>
      {mensajeStock && <p style={{ marginTop: '10px', color: '#059669' }}>{mensajeStock}</p>}
    </section>
  );
}
