type NuevoEmpleadoType = {
  username: string;
  email: string;
  password: string;
  sucursalAsignada: string;
};

type FormularioNuevoEmpleadoProps = {
  nuevoEmpleado: NuevoEmpleadoType;
  setNuevoEmpleado: React.Dispatch<React.SetStateAction<NuevoEmpleadoType>>;
  sucursales: Array<{ nombre: string }>;
  crearEmpleado: () => void;
  mensajeEmpleado: string;
};

export default function FormularioNuevoEmpleado({
  nuevoEmpleado,
  setNuevoEmpleado,
  sucursales,
  crearEmpleado,
  mensajeEmpleado,
}: FormularioNuevoEmpleadoProps) {
  return (
    <section className="tarjeta-panel" style={{ marginTop: '20px' }}>
      <h3>Registrar Nuevo Empleado</h3>
      <p className="mensaje-demo">Crea credenciales de acceso para personal de tienda.</p>
      
      <div className="formulario-simple" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Nombre de usuario (Login)" 
          value={nuevoEmpleado.username}
          onChange={(e) => setNuevoEmpleado(a => ({...a, username: e.target.value}))}
        />
        <input 
          type="email" 
          placeholder="Correo electrónico" 
          value={nuevoEmpleado.email}
          onChange={(e) => setNuevoEmpleado(a => ({...a, email: e.target.value}))}
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={nuevoEmpleado.password}
          onChange={(e) => setNuevoEmpleado(a => ({...a, password: e.target.value}))}
        />
        <select 
          value={nuevoEmpleado.sucursalAsignada}
          onChange={(e) => setNuevoEmpleado(a => ({...a, sucursalAsignada: e.target.value}))}
        >
          <option value="">Asignar Sucursal</option>
          {sucursales.map(s => (
            <option key={s.nombre} value={s.nombre}>{s.nombre}</option>
          ))}
        </select>
        <button 
          onClick={crearEmpleado}
          style={{ gridColumn: 'span 2', background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold' }}
        >
          Guardar Empleado en el Sistema
        </button>
      </div>
      {mensajeEmpleado && <p style={{ marginTop: '10px', color: mensajeEmpleado.includes('éxito') ? 'green' : 'red' }}>{mensajeEmpleado}</p>}
    </section>
  );
}
