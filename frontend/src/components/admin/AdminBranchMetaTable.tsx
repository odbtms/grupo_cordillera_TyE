type Sucursal = {
  nombre: string;
  metaVenta: number;
};

type AdminBranchMetaTableProps = {
  sucursales: Sucursal[];
  resumenVentas: Map<string, number>;
  actualizarMeta: (index: number, valor: string) => void;
  guardarCambios: () => void;
  mensaje: string;
};

export default function AdminBranchMetaTable({
  sucursales,
  resumenVentas,
  actualizarMeta,
  guardarCambios,
  mensaje,
}: AdminBranchMetaTableProps) {
  return (
    <section className="tarjeta-panel">
      <h3>Metas de Venta por Sucursal</h3>
      <p className="mensaje-demo">Visualización en tiempo real del cumplimiento de objetivos.</p>
      
      <div className="tabla-simple" style={{ display: 'grid', gap: '8px' }}>
        <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', alignItems: 'center' }}>
          <span>Sucursal</span>
          <span>Ventas Actuales</span>
          <span>Meta Mensual</span>
          <span style={{ textAlign: 'right' }}>% Logro</span>
        </div>

        {sucursales.map((sucursal, indice) => {
          const ventasActuales = resumenVentas.get(sucursal.nombre) ?? 0;
          const porcentaje = sucursal.metaVenta > 0 ? (ventasActuales / sucursal.metaVenta) * 100 : 0;
          
          return (
            <div key={sucursal.nombre} className="fila" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', alignItems: 'center' }}>
              <span>{sucursal.nombre}</span>
              <span>${ventasActuales.toLocaleString()}</span>
              <span>
                <input
                  type="number"
                  min={1}
                  style={{ width: '100%', padding: '4px' }}
                  value={sucursal.metaVenta}
                  onChange={(evento) => actualizarMeta(indice, evento.target.value)}
                />
              </span>
              <strong style={{ color: porcentaje >= 100 ? '#4CAF50' : '#FF9800', textAlign: 'right' }}>
                {porcentaje.toFixed(1)}%
              </strong>
            </div>
          );
        })}
        {sucursales.length === 0 && <p style={{ padding: '20px', textAlign: 'center' }}>No hay sucursales registradas.</p>}
      </div>

      <button 
        type="button" 
        onClick={guardarCambios}
        style={{ marginTop: '20px', background: '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
      >
        Guardar Metas en BD
      </button>
      {mensaje && <p style={{ marginTop: '10px', color: '#334155' }}>{mensaje}</p>}
    </section>
  );
}
