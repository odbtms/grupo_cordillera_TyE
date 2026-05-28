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

    if (!usuario.trim() && !contrasena.trim()) {
      setMensajeError('Debe completar todos los campos.');
      return;
    }
    if (!usuario.trim()) {
      setMensajeError('El nombre de usuario es obligatorio.');
      return;
    }
    if (!contrasena.trim()) {
      setMensajeError('La contraseña es obligatoria.');
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
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setMensajeError('Usuario o contraseña incorrectos.');
      } else if (error?.response?.status === 404) {
        setMensajeError('El usuario ingresado no existe.');
      } else if (!error?.response) {
        setMensajeError('No se pudo conectar al servidor. Verifique su conexión.');
      } else {
        setMensajeError('Error al iniciar sesión. Inténtelo nuevamente.');
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
