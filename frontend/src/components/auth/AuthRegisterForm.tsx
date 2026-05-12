import { useState, type FormEvent } from 'react';
import { registrarUsuario } from '../../api';

type AuthRegisterFormProps = {
  onLoginExitoso: (token: string, rol: string, usuario: string, sucursal: string | null) => void;
  setMensajeError: (mssg: string) => void;
  setMensajeExito: (mssg: string) => void;
};

export default function AuthRegisterForm({ onLoginExitoso, setMensajeError, setMensajeExito }: AuthRegisterFormProps) {
  const [usuarioRegistro, setUsuarioRegistro] = useState('');
  const [correoRegistro, setCorreoRegistro] = useState('');
  const [contrasenaRegistro, setContrasenaRegistro] = useState('');
  const [sucursalRegistro, setSucursalRegistro] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarRegistro(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    if (!usuarioRegistro.trim() || !correoRegistro.trim() || !contrasenaRegistro.trim()) {
      setMensajeError('Completa usuario, correo y contraseña para registrarte.');
      return;
    }

    if (!correoRegistro.includes('@')) {
      setMensajeError('Ingresa un correo válido.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await registrarUsuario({
        username: usuarioRegistro.trim(),
        email: correoRegistro.trim(),
        password: contrasenaRegistro,
        rol: sucursalRegistro.trim() ? 'EMPLEADO_TIENDA' : 'ADMIN',
        sucursal: sucursalRegistro.trim() || undefined
      });

      onLoginExitoso(
        respuesta.token,
        respuesta.rol,
        respuesta.usuario,
        respuesta.sucursal,
      );
    } catch (error) {
      const mensajeGenerico = 'No se pudo registrar. Verifica los datos o intenta luego.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        setMensajeError(String(error.message) || mensajeGenerico);
      } else {
        setMensajeError(mensajeGenerico);
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <article className="auth-formulario auth-register-form">
      <h1>Registro</h1>
      <p>Crea tu cuenta para acceder al panel</p>

      <form onSubmit={manejarRegistro} className="formulario-login auth-form-grid">
        <label>
          Usuario
          <input
            type="text"
            value={usuarioRegistro}
            onChange={(evento) => setUsuarioRegistro(evento.target.value)}
            placeholder="Ej: empleado.cordillera"
          />
        </label>

        <label>
          Correo
          <input
            type="email"
            value={correoRegistro}
            onChange={(evento) => setCorreoRegistro(evento.target.value)}
            placeholder="nombre@cordillera.cl"
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={contrasenaRegistro}
            onChange={(evento) => setContrasenaRegistro(evento.target.value)}
            placeholder="Crea tu contraseña"
          />
        </label>

        <label>
          Sucursal (Opcional - solo empleado)
          <input
            type="text"
            value={sucursalRegistro}
            onChange={(evento) => setSucursalRegistro(evento.target.value)}
            placeholder="Ej: Costanera Center"
          />
        </label>

        <button className="btn-principal" type="submit" disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>
    </article>
  );
}
