type NuevaSucursalType = {
  nombre: string;
  ubicacion: string;
  metaVenta: number;
};

type FormularioNuevaSucursalProps = {
  nuevaSucursal: NuevaSucursalType;
  setNuevaSucursal: (s: NuevaSucursalType) => void;
  crearSucursal: () => void;
  mensajeSucursal: string;
};

export default function FormularioNuevaSucursal({
  nuevaSucursal,
  setNuevaSucursal,
  crearSucursal,
  mensajeSucursal,
}: FormularioNuevaSucursalProps) {
  return (
    <section className="tarjeta-panel" style={{ marginTop: '20px' }}>
      <h3>Alta de Sucursal</h3>
      <div className="formulario-simple" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Nombre Sucursal (Ej: Santiago)" 
          value={nuevaSucursal.nombre}
          onChange={(e) => setNuevaSucursal({...nuevaSucursal, nombre: e.target.value})}
        />
        <input 
          type="text" 
          placeholder="Ubicación / Zona" 
          value={nuevaSucursal.ubicacion}
          onChange={(e) => setNuevaSucursal({...nuevaSucursal, ubicacion: e.target.value})}
        />
        <input 
          type="number" 
          placeholder="Meta de Venta Mensual" 
          value={nuevaSucursal.metaVenta}
          onChange={(e) => setNuevaSucursal({...nuevaSucursal, metaVenta: Number(e.target.value)})}
        />
        <button 
          onClick={crearSucursal}
          style={{ gridColumn: 'span 3', background: '#0f766e', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold' }}
        >
          Registrar Nueva Sucursal
        </button>
      </div>
      {mensajeSucursal && <p style={{ marginTop: '10px', color: mensajeSucursal.includes('éxito') ? 'green' : 'red' }}>{mensajeSucursal}</p>}
    </section>
  );
}
