import type { StockItem } from '../../../types';

type AdminDashboardInventarioProps = {
  stock: StockItem[];
  filtroSucursal: string;
};

export default function InventarioDashboardAdmin({ stock, filtroSucursal }: AdminDashboardInventarioProps) {
  const stockFiltrado = stock.filter(item => {
    if (filtroSucursal === 'Todas') return true;
    const normalizar = (t: string) => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizar(item.sucursal) === normalizar(filtroSucursal);
  });

  return (
    <section className="bloque" aria-label="Inventario global">
      <h2>3. Inventario Global y Detallado</h2>
      <div className="tarjeta-resumen tarjeta-ancha">
        <div className="panel-head">
          <h2>Stock Detallado: {filtroSucursal === 'Todas' ? 'Todas las Sucursales' : filtroSucursal}</h2>
          <span>{stockFiltrado.length} ítems encontrados</span>
        </div>
        <div className="branch-table" style={{ display: 'grid', gap: '8px' }}>
          <div className="branch-table-head" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.5fr 1fr', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '4px', fontWeight: 'bold' }}>
            <span>Categoría</span>
            <span>Producto</span>
            <span>Stock</span>
            <span>Precio Unitario</span>
          </div>
          {stockFiltrado.map((item) => (
            <div key={item.id} className="branch-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.5fr 1fr', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
              <span>{item.categoria}</span>
              <span>{item.producto}</span>
              <strong>{item.cantidad}</strong>
              <span style={{ fontWeight: '600', color: '#2563eb' }}>${item.precioUnitario?.toLocaleString() || 0}</span>
            </div>
          ))}
          {stockFiltrado.length === 0 && (
            <p className="empty-state" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No hay información de stock disponible para esta selección.</p>
          )}
        </div>
      </div>
    </section>
  );
}
