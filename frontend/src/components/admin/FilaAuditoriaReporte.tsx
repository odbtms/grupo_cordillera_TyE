import type { Venta, StockItem } from '../../types';
import { FORMATO_MONEDA } from '../../utils/formatters';

type ReportRowProps = {
  reporte: { id?: number; titulo: string; estado: string };
  isExpandido: boolean;
  onToggle: () => void;
  onEliminar: (id: number) => void;
  ventas: Venta[];
  stock: StockItem[];
  plantillas?: { id?: number; titulo: string; estado: string }[];
};

export default function FilaAuditoriaReporte({
  reporte,
  isExpandido,
  onToggle,
  onEliminar,
  ventas,
  stock,
  plantillas = []
}: ReportRowProps) {
  const sucursalNombre = reporte.titulo.replace('Reporte Sucursal ', '').trim();
  const isISO = reporte.estado.includes('T');
  let fechaReporteDisplay = reporte.estado;

  if (isISO) {
    const d = new Date(reporte.estado);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    fechaReporteDisplay = `${dd}-${mm} ${hh}:${min}`;
  }

  // Find boundaries for this specific report
  const reportesSucursal = plantillas
    .filter(p => p.titulo === reporte.titulo && p.estado.includes('T'))
    .sort((a, b) => new Date(a.estado).getTime() - new Date(b.estado).getTime());
  
  const miIndex = reportesSucursal.findIndex(p => p.id === reporte.id);
  const reporteAnterior = miIndex > 0 ? reportesSucursal[miIndex - 1] : null;

  const fechaInicio = reporteAnterior ? new Date(reporteAnterior.estado).getTime() : 0;
  const fechaFin = isISO ? new Date(reporte.estado).getTime() : Infinity;

  // Normalización de fechas para el filtrado
  const filtrarPorFecha = (fechaISO: any) => {
    if (!fechaISO) return false;
    let date;
    if (Array.isArray(fechaISO) && fechaISO.length >= 3) {
      // Spring Boot LocalDateTime as array: [YYYY, MM, DD, hh, mm, ss]
      date = new Date(fechaISO[0], fechaISO[1] - 1, fechaISO[2], fechaISO[3] || 0, fechaISO[4] || 0, fechaISO[5] || 0);
    } else {
      date = new Date(fechaISO);
    }
    if (isNaN(date.getTime())) return false;
    
    if (isISO) {
      const t = date.getTime();
      return t > fechaInicio && t <= fechaFin;
    } else {
      // Comportamiento legado (comparamos DD-MM)
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      return `${dd}-${mm}` === reporte.estado;
    }
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
        <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{fechaReporteDisplay}</span>
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
          <h4 style={{ marginBottom: '20px' }}>📄 Auditoría Detallada: {sucursalNombre} ({fechaReporteDisplay})</h4>
          
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
                  <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr' }}>
                    <span>Responsable</span>
                    <span>Categoría</span>
                    <span>Producto</span>
                    <span>Stock</span>
                    <span>P. Unit</span>
                  </div>
                  {stockFiltrado.map((s, i) => (
                    <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr' }}>
                      <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{s.vendedor || 'Sistema'}</span>
                      <span>{s.categoria || 'VARIOS'}</span>
                      <span>{s.producto}</span>
                      <strong>{s.cantidad}</strong>
                      <span>{FORMATO_MONEDA.format(s.precioUnitario || 0)}</span>
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
