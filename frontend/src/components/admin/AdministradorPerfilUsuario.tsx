type UserProfileManagerProps = {
  usuario: string;
  rol: string;
  token: string;
  rolObjetivo: 'ADMIN' | 'EMPLEADO_TIENDA';
  setRolObjetivo: (rol: 'ADMIN' | 'EMPLEADO_TIENDA') => void;
  guardarRol: () => void;
  mensajeRol: string;
  onCerrarSesion: () => void;
};

export default function AdministradorPerfilUsuario({
  usuario,
  rol,
  token,
  rolObjetivo,
  setRolObjetivo,
  guardarRol,
  mensajeRol,
  onCerrarSesion
}: UserProfileManagerProps) {
  return (
    <section className="tarjeta-panel">
      <h3>Perfil de usuario</h3>
      <p>Usuario: <strong>{usuario}</strong></p>
      <p>Rol: <strong>{rol}</strong></p>
      <p>Token activo: {token ? 'Sí' : 'No'}</p>

      <div className="formulario-simple" style={{ marginTop: '15px', display: 'grid', gap: '10px' }}>
        <label>
          Cambiar Mi Rol (Autogestión)
          <select
            value={rolObjetivo}
            onChange={(e) => setRolObjetivo(e.target.value as 'ADMIN' | 'EMPLEADO_TIENDA')}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="EMPLEADO_TIENDA">EMPLEADO_TIENDA</option>
          </select>
        </label>
        <button 
          type="button" 
          onClick={guardarRol}
          style={{ background: '#2563eb', color: 'white', padding: '10px', borderRadius: '4px', border: 'none', fontWeight: 'bold' }}
        >
          Actualizar mi rol
        </button>
      </div>
      {mensajeRol && <p style={{ marginTop: '10px', color: '#2563eb' }}>{mensajeRol}</p>}

      <button 
        type="button" 
        onClick={onCerrarSesion}
        style={{ marginTop: '20px', background: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '4px', border: 'none', fontWeight: 'bold', width: '100%' }}
      >
        Cerrar sesión
      </button>
    </section>
  );
}
