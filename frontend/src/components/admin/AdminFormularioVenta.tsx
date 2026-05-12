import type { StockItem } from '../../types';

type NuevaVentaType = {
  montoTotal: number;
  sistemaOrigen: string;
  sucursal: string;
  categoria: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
};

type CarritoItem = {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  categoria: string;
};

type AdminFormularioVentaProps = {
  nuevaVenta: NuevaVentaType;
  setNuevaVenta: React.Dispatch<React.SetStateAction<NuevaVentaType>>;
  sucursales: Array<{ nombre: string }>;
  inventarioFull: StockItem[];
  carrito: CarritoItem[];
  setCarrito: React.Dispatch<React.SetStateAction<CarritoItem[]>>;
  agregarAlCarrito: () => void;
  procesarVentaCompleta: () => void;
  mensajeVenta: string;
};

export default function AdminFormularioVenta({
  nuevaVenta,
  setNuevaVenta,
  sucursales,
  inventarioFull,
  carrito,
  setCarrito,
  agregarAlCarrito,
  procesarVentaCompleta,
  mensajeVenta,
}: AdminFormularioVentaProps) {
  return (
    <section className="bloque" style={{ marginTop: '30px' }}>
      <div className="panel-head">
        <h2>Registrar Venta (Admin)</h2>
        <p>Permite ingresar ventas manuales seleccionando sucursal y producto.</p>
      </div>

      <div className="formulario-simple" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <label>
            Sucursal
            <select
              value={nuevaVenta.sucursal}
              onChange={(e) => setNuevaVenta(a => ({ ...a, sucursal: e.target.value, producto: '', precioUnitario: 0 }))}
            >
              <option value="">Seleccione Sucursal</option>
              {sucursales.map(s => (
                <option key={s.nombre} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            Sistema origen
            <select
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
            <select
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
            <select
              value={nuevaVenta.producto}
              disabled={!nuevaVenta.sucursal}
              onChange={(e) => {
                const prod = e.target.value;
                const info = inventarioFull.find(s => s.producto === prod && s.sucursal === nuevaVenta.sucursal);
                const precio = info?.precioUnitario || 0;
                setNuevaVenta(a => ({ ...a, producto: prod, precioUnitario: precio, montoTotal: precio * a.cantidad }));
              }}
            >
              <option value="">Seleccione Producto</option>
              {inventarioFull
                .filter(s => s.sucursal === nuevaVenta.sucursal && (nuevaVenta.categoria === 'TODOS' || s.categoria.toUpperCase() === nuevaVenta.categoria))
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
            <input type="number" value={nuevaVenta.precioUnitario} disabled />
          </label>
          <label>
            Subtotal
            <input type="number" value={nuevaVenta.montoTotal} disabled />
          </label>
        </div>

        <button 
          type="button" 
          onClick={agregarAlCarrito}
          style={{ width: '100%', marginTop: '15px', background: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Añadir al carrito
        </button>
      </div>

      {carrito.length > 0 && (
        <div className="tabla-simple" style={{ marginTop: '20px', border: '1px solid #cbd5e1' }}>
          <div className="panel-head" style={{ padding: '10px', background: '#f1f5f9' }}>
            <h4 style={{ margin: 0 }}>Ventas pendientes</h4>
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
            <span>TOTAL CARRITO</span>
            <span>-</span>
            <span>${carrito.reduce((acc, curr) => acc + curr.subtotal, 0).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={procesarVentaCompleta}
              style={{ flex: 2, marginTop: '15px', background: '#3b82f6', color: 'white', padding: '15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              Confirmar y Guardar Venta
            </button>
            <button 
              type="button" 
              onClick={() => setCarrito([])}
              style={{ flex: 1, marginTop: '15px', background: '#ef4444', color: 'white', padding: '15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Vaciar
            </button>
          </div>
        </div>
      )}
      
      {mensajeVenta && <p style={{ marginTop: '10px', color: mensajeVenta.includes('éxito') ? 'green' : 'red' }}>{mensajeVenta}</p>}
    </section>
  );
}
