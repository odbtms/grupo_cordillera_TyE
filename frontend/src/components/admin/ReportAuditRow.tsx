import type { Venta, StockItem } from '../../types';
import { FORMATO_MONEDA } from '../../utils/formatters';

type ReportRowProps = {
  reporte: { id?: number; titulo: string; estado: string };
  isExpandido: boolean;
  onToggle: () => void;
  onEliminar: (id: number) => void;
  ventas: Venta[];
  stock: StockItem[];
};

export default function ReportAuditRow({
  reporte,
  isExpandido,
  onToggle,
  onEliminar,
  ventas,
  stock
}: ReportRowProps) {
  const sucursalNombre = reporte.titulo.replace('Reporte Sucursal ', '').trim();
  const fechaReporte = reporte.estado; // Formato DD-MM

  // Normalización de fechas para el filtrado: comparamos DD-MM
  const filtrarPorFecha = (fechaISO: string | undefined) => {
    if (!fechaISO) return false;
    const date = new Date(fechaISO);
    if (isNaN(date.getTime())) return false;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}` === fechaReporte;
  };

  const ventasFiltradas = ventas.filter(v => v.sucursal === sucursalNombre && filtrarPorFecha(v.fechaVenta));
  const stockFiltrado = stock.filter(s => s.sucursal === sucursalNombre && filtrarPorFecha(s.fechaRegistro));

  return (
    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
      <div 
        className="fila" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr 1fr', 
          alignItems: 'center', 
          cursor: 'pointer', 
          background: isExpandido ? '#f8fafc' : 'white',
          padding: '12px'
        }}
        onClick={onToggle}
      >
        <span style={{ fontWeight: 'bold' }}>{sucursalNombre}</span>
        <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{fechaReporte}</span>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            className="btn-primario"
            style={{ background: isExpandido ? '#64748b' : '#2563eb', padding: '5px 12px', minWidth: '80px' }}
          >
            {isExpandido ? 'Cerrar' : 'Revisar ↓'}
          </button>
          <button 
            className="btn-peligro"
            style={{ background: '#ef4444', padding: '5px 12px' }}
            onClick={(e) => { e.stopPropagation(); if(reporte.id) onEliminar(reporte.id); }}
          >
            Eliminar
          </button>
        </div>
      </div>

      {isExpandido && (
        <div style={{ padding: '20px', background: '#f8fafc', borderTop: '2px solid #2563eb' }}>
          <h4 style={{ marginBottom: '20px' }}>📄 Auditoría Detallada: {sucursalNombre} ({fechaReporte})</h4>
          
          <div style={{ display: 'grid', gap: '30px' }}>
            <article>
              <h5 style={{ color: '#2563eb', marginBottom: '10px' }}>Ventas del Día</h5>
              {ventasFiltradas.length > 0 ? (
                <div className="tabla-simple">
                  <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
                    <span>Vendedor</span>
                    <span>Categoría</span>
                    <span>Producto</span>
                    <span>Cant.</span>
                    <span>P. Unit</span>
                    <span>Total</span>
                  </div>
                  {ventasFiltradas.map((v, i) => (
                    <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{v.vendedor || 'Admin'}</span>
                      <span>{v.categoria || 'VARIOS'}</span>
                      <span>{v.producto}</span>
                      <strong>{v.cantidad}</strong>
                      <span>{FORMATO_MONEDA.format(v.precioUnitario || 0)}</span>
                      <span style={{ fontWeight: 'bold', color: '#0f766e' }}>{FORMATO_MONEDA.format((v.precioUnitario || 0) * (v.cantidad || 0))}</span>
                    </div>
                  ))}
                </div>
              ) : <p>No se encontraron registros de ventas para esta fecha.</p>}
            </article>

            <article>
              <h5 style={{ color: '#0f766e', marginBottom: '10px' }}>Stock Registrado/Actualizado</h5>
              {stockFiltrado.length > 0 ? (
                <div className="tabla-simple">
                  <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
                    <span>Responsable</span>
                    <span>Categoría</span>
                    <span>Producto</span>
                    <span>Stock</span>
                    <span>P. Unit</span>
                    <span>Valor Est.</span>
                  </div>
                  {stockFiltrado.map((s, i) => (
                    <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
                      <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{s.vendedor || 'Sistema'}</span>
                      <span>{s.categoria || 'VARIOS'}</span>
                      <span>{s.producto}</span>
                      <strong>{s.cantidad}</strong>
                      <span>{FORMATO_MONEDA.format(s.precioUnitario || 0)}</span>
                      <span style={{ fontWeight: 'bold', color: '#0f766e' }}>{FORMATO_MONEDA.format((s.precioUnitario || 0) * (s.cantidad || 0))}</span>
                    </div>
                  ))}
                </div>
              ) : <p>No se encontraron movimientos de stock para esta fecha.</p>}
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
