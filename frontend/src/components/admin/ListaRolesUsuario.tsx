import type { Usuario } from '../../api';

type UserRoleListProps = {
  usuariosDb: Usuario[];
  cambiarRolUsuarioExterno: (id: number, nuevoRol: string) => void;
};

export default function ListaRolesUsuario({ usuariosDb, cambiarRolUsuarioExterno }: UserRoleListProps) {
  return (
    <section className="tarjeta-panel">
      <h3>Gestión de Usuarios (Control de Acceso)</h3>
      <p className="mensaje">Administra los accesos y roles de la plataforma (ms-auth).</p>
      
      <div className="tabla-simple">
        <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr' }}>
          <span>Usuario</span>
          <span>Email</span>
          <span>Rol Actual</span>
          <span>Actualizar</span>
        </div>
        {usuariosDb.map((u) => (
          <div key={u.id} className="fila" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr', alignItems: 'center' }}>
            <span>{u.username}</span>
            <span>{u.email}</span>
            <strong style={{ color: u.rol === 'ADMIN' ? '#0f766e' : '#64748b' }}>{u.rol}</strong>
            <span>
              <select 
                defaultValue={u.rol}
                onChange={(e) => cambiarRolUsuarioExterno(u.id, e.target.value)}
                style={{ fontSize: '12px', padding: '6px', width: '100%', borderRadius: '4px' }}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="EMPLEADO_TIENDA">EMPLEADO_TIENDA</option>
              </select>
            </span>
          </div>
        ))}
        {usuariosDb.length === 0 && <p style={{ padding: '20px', textAlign: 'center' }}>Cargando lista de usuarios del sistema...</p>}
      </div>
    </section>
  );
}
