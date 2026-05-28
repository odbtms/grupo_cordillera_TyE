import { useState } from 'react'
import { Trash2, ShieldCheck, ShieldAlert, UserCog } from 'lucide-react'
import type { Usuario } from '../../api';

type UserRoleListProps = {
  usuariosDb: Usuario[];
  cambiarRolUsuarioExterno: (id: number, nuevoRol: string) => void;
  eliminarUsuarioExterno: (id: number, username: string) => void;
};

export default function ListaRolesUsuario({ usuariosDb, cambiarRolUsuarioExterno, eliminarUsuarioExterno }: UserRoleListProps) {
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; username: string } | null>(null)

  return (
    <>
      <section className="tarjeta-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <UserCog size={18} color="#0f766e" />
          <h3 style={{ margin: 0 }}>Gestión de Usuarios</h3>
        </div>
        <p className="mensaje" style={{ marginBottom: 12 }}>Administra accesos y roles de la plataforma (ms-auth).</p>

        <div className="tabla-simple">
          <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr 1.4fr 0.6fr' }}>
            <span>Usuario</span>
            <span>Email</span>
            <span>Rol</span>
            <span>Cambiar rol</span>
            <span style={{ textAlign: 'center' }}>Eliminar</span>
          </div>
          {usuariosDb.map((u) => (
            <div key={u.id} className="fila" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr 1.4fr 0.6fr', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#1b4058' }}>{u.username}</span>
              <span style={{ fontSize: '0.88rem', color: '#475569' }}>{u.email}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {u.rol === 'ADMIN' ? <ShieldCheck size={14} color="#0f766e" /> : <ShieldAlert size={14} color="#64748b" />}
                <strong style={{ color: u.rol === 'ADMIN' ? '#0f766e' : '#64748b', fontSize: '0.85rem' }}>{u.rol}</strong>
              </span>
              <span>
                <select
                  defaultValue={u.rol}
                  onChange={(e) => cambiarRolUsuarioExterno(u.id, e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '5px 8px', width: '100%', borderRadius: '6px', border: '1px solid #bdd3e1' }}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EMPLEADO_TIENDA">EMPLEADO_TIENDA</option>
                </select>
              </span>
              <span style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  className="boton-peligro"
                  onClick={() => setConfirmDelete({ id: u.id, username: u.username })}
                  title={`Eliminar ${u.username}`}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          ))}
          {usuariosDb.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Cargando usuarios...</p>}
        </div>
      </section>

      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '32px 28px', borderRadius: '14px', minWidth: '320px', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <Trash2 size={36} color="#dc2626" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h3 style={{ margin: '0 0 12px', color: '#dc2626' }}>Eliminar usuario</h3>
            <p style={{ color: '#334155', marginBottom: 24, lineHeight: 1.5 }}>
              ¿Eliminar a <strong>{confirmDelete.username}</strong> de forma permanente?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '9px 20px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="boton-peligro"
                onClick={() => { eliminarUsuarioExterno(confirmDelete.id, confirmDelete.username); setConfirmDelete(null) }}
                style={{ padding: '9px 20px' }}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
