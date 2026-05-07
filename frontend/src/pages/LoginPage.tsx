import { useState } from 'react'
import type { FormEvent } from 'react'
<<<<<<< HEAD
import { iniciarSesion, registrarUsuario } from '../api'
=======
import { iniciarSesion } from '../api'
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
import type { LoginResponse } from '../types'

type LoginPageProps = {
  onLoginExitoso: (
    token: string,
    rol: string,
    usuario: string,
    sucursal: string | null,
  ) => void
}

function LoginPage({ onLoginExitoso }: LoginPageProps) {
  const [modo, setModo] = useState<'login' | 'register'>('login')
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [usuarioRegistro, setUsuarioRegistro] = useState('')
  const [correoRegistro, setCorreoRegistro] = useState('')
  const [contrasenaRegistro, setContrasenaRegistro] = useState('')
<<<<<<< HEAD
  const [sucursalRegistro, setSucursalRegistro] = useState('')
=======
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
  const [cargando, setCargando] = useState(false)
  const [mensajeError, setMensajeError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

<<<<<<< HEAD
=======
  function entrarComoInvitado() {
    onLoginExitoso('demo-token', 'EJECUTIVO', 'Invitado', null)
  }

>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
  async function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setMensajeError('')
    setMensajeExito('')

<<<<<<< HEAD
    if (!usuario.trim() || !contrasena.trim()) {
      setMensajeError('Debe ingresar usuario y contraseña.')
=======
    if (!usuario.trim() && !contrasena.trim()) {
      entrarComoInvitado()
      return
    }

    if (!usuario.trim() || !contrasena.trim()) {
      setMensajeError('Debe ingresar usuario y contraseña, o dejar ambos vacíos para modo demo.')
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
      return
    }

    setCargando(true)

    try {
<<<<<<< HEAD
=======
      const dbStr = localStorage.getItem('cordillera_mock_users')
      const db = dbStr ? JSON.parse(dbStr) : []
      const usuarioLocal = db.find((u: any) => u.username === usuario.trim() && u.password === contrasena)

      if (usuarioLocal) {
        onLoginExitoso(
          'local-mock-token',
          usuarioLocal.rol,
          usuarioLocal.username,
          usuarioLocal.sucursalAsignada,
        )
        return
      }

>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
      const respuesta: LoginResponse = await iniciarSesion({
        username: usuario.trim(),
        password: contrasena,
      })

      onLoginExitoso(
        respuesta.token,
        respuesta.rol,
        respuesta.usuario,
        respuesta.sucursal,
      )
    } catch (error) {
      const mensajeGenerico =
        'No se pudo iniciar sesión. Verifique credenciales o conexión con ms-auth.'

      if (typeof error === 'object' && error !== null && 'message' in error) {
        setMensajeError(String(error.message) || mensajeGenerico)
      } else {
        setMensajeError(mensajeGenerico)
      }
    } finally {
      setCargando(false)
    }
  }

<<<<<<< HEAD
  async function manejarRegistro(evento: FormEvent<HTMLFormElement>) {
=======
  function manejarRegistro(evento: FormEvent<HTMLFormElement>) {
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
    evento.preventDefault()
    setMensajeError('')
    setMensajeExito('')

    if (!usuarioRegistro.trim() || !correoRegistro.trim() || !contrasenaRegistro.trim()) {
      setMensajeError('Completa usuario, correo y contraseña para registrarte.')
      return
    }

    if (!correoRegistro.includes('@')) {
      setMensajeError('Ingresa un correo válido.')
      return
    }

<<<<<<< HEAD
    setCargando(true)

    try {
      const respuesta = await registrarUsuario({
        username: usuarioRegistro.trim(),
        email: correoRegistro.trim(),
        password: contrasenaRegistro,
        rol: sucursalRegistro.trim() ? 'EMPLEADO_TIENDA' : 'ADMIN',
        sucursal: sucursalRegistro.trim() || undefined
      })

      onLoginExitoso(
        respuesta.token,
        respuesta.rol,
        respuesta.usuario,
        respuesta.sucursal,
      )
    } catch (error) {
      const mensajeGenerico = 'No se pudo registrar. Verifica los datos o intenta luego.'

      if (typeof error === 'object' && error !== null && 'message' in error) {
        setMensajeError(String(error.message) || mensajeGenerico)
      } else {
        setMensajeError(mensajeGenerico)
      }
    } finally {
      setCargando(false)
    }
=======
    setUsuario(usuarioRegistro.trim())
    setContrasena('')
    setMensajeExito('Cuenta creada en modo demo. Ahora inicia sesión con tu usuario.')
    setModo('login')
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
  }

  return (
    <main className="pagina-login">
      <section className={`auth-contenedor ${modo === 'register' ? 'modo-register' : ''}`}>
        <div className="auth-panel-base">
          <article className="auth-formulario auth-login-form">
            <h1>Login</h1>
            <p>Acceso para ejecutivos y administradores</p>

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

<<<<<<< HEAD
=======
              <button className="btn-secundario" type="button" onClick={entrarComoInvitado}>
                Entrar sin credenciales
              </button>
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
            </form>
          </article>

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
                  placeholder="Ej: ejecutivo.cordillera"
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

<<<<<<< HEAD
              <label>
                Sucursal (Opcional - solo empleado)
                <input
                  type="text"
                  value={sucursalRegistro}
                  onChange={(evento) => setSucursalRegistro(evento.target.value)}
                  placeholder="Ej: Costanera Center"
                />
              </label>

=======
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
              <button className="btn-principal" type="submit">
                Registrarme
              </button>
            </form>
          </article>

          <aside className="auth-overlay">
            <div className="auth-overlay-track">
              <section className="auth-overlay-panel auth-overlay-left">
                <h2>¡Bienvenido!</h2>
                <p>¿Ya tienes cuenta? Ingresa con tu usuario.</p>
                <button className="btn-overlay" type="button" onClick={() => setModo('login')}>
<<<<<<< HEAD
                  inicia sesion
=======
                  Login
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
                </button>
              </section>

              <section className="auth-overlay-panel auth-overlay-right">
                <h2>Crear cuenta</h2>
                <p>Si eres nuevo en la plataforma, regístrate aquí.</p>
                <button
                  className="btn-overlay"
                  type="button"
                  onClick={() => setModo('register')}
                >
<<<<<<< HEAD
                  Registrate
=======
                  Register
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
                </button>
              </section>
            </div>
          </aside>
        </div>

        {(mensajeError || mensajeExito) && (
          <div className="auth-mensajes">
            {mensajeError && <p className="mensaje-error">{mensajeError}</p>}
            {mensajeExito && <p className="mensaje-demo">{mensajeExito}</p>}
          </div>
        )}
      </section>
    </main>
  )
}

export default LoginPage
