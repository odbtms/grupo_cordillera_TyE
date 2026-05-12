import { useState, type FormEvent } from 'react';
import { iniciarSesion } from '../../api';
import type { RespuestaLogin } from '../../types';

type AuthLoginFormProps = {
  onLoginExitoso: (token: string, rol: string, usuario: string, sucursal: string | null) => void;
  setMensajeError: (mssg: string) => void;
  setMensajeExito: (mssg: string) => void;
};

export default function FormularioLogin({ onLoginExitoso, setMensajeError, setMensajeExito }: AuthLoginFormProps) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    if (!usuario.trim() || !contrasena.trim()) {
      setMensajeError('Debe ingresar usuario y contraseña.');
      return;
    }

    setCargando(true);

    try {
      const respuesta: RespuestaLogin = await iniciarSesion({
        username: usuario.trim(),
        password: contrasena,
      });

      onLoginExitoso(
        respuesta.token,
        respuesta.rol,
        respuesta.usuario,
        respuesta.sucursal,
      );
    } catch (error) {
      const mensajeGenerico = 'No se pudo iniciar sesión. Verifique credenciales o conexión con ms-auth.';
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
    <article className="auth-formulario auth-login-form">
      <h1>Login</h1>
      <p>Acceso para empleados y administradores</p>

      <form onSubmit={manejarSubmit} className="formulario-login auth-form-grid">
        <label>
          Usuario
          <input
            type="text"
            value={usuario}
            onChange={(evento) => setUsuario(evento.target.value)}
            placeholder="Ej: admin.cordillera"
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            placeholder="Ingrese su contraseña"
          />
        </label>

        <button className="btn-principal" type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </article>
  );
}
