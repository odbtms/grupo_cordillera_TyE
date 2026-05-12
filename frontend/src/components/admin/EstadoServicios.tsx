type EstadoServicio = {
  nombre: string;
  estado: 'conectado' | 'sin-conexion';
};

type ServiceHealthCheckProps = {
  estadoServicios: EstadoServicio[];
};

export default function EstadoServicios({ estadoServicios }: ServiceHealthCheckProps) {
  return (
    <section className="tarjeta-panel">
      <h3>Estado de Microservicios (Health Check)</h3>
      <p className="mensaje">Conexión en tiempo real con la infraestructura AWS.</p>
      
      <ul className="lista-servicios" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: 0 }}>
        {estadoServicios.map((servicio) => (
          <li key={servicio.nombre} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span
              className={`estado-circulo ${servicio.estado === 'conectado' ? 'ok' : 'error'}`}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: servicio.estado === 'conectado' ? '#10b981' : '#ef4444',
                boxShadow: `0 0 8px ${servicio.estado === 'conectado' ? '#10b981' : '#ef4444'}`
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <strong style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}>{servicio.nombre}</strong>
              <span style={{ fontSize: '0.8rem', color: servicio.estado === 'conectado' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {servicio.estado === 'conectado' ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
