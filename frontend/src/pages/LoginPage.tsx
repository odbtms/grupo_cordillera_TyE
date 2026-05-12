import { useState } from 'react'
import { AuthLoginForm, AuthRegisterForm } from '../components'

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
  const [mensajeError, setMensajeError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  return (
    <main className="pagina-login">
      <section className={`auth-contenedor ${modo === 'register' ? 'modo-register' : ''}`}>
        <div className="auth-panel-base">
          <AuthLoginForm 
            onLoginExitoso={onLoginExitoso}
            setMensajeError={setMensajeError}
            setMensajeExito={setMensajeExito}
          />
          <AuthRegisterForm 
            onLoginExitoso={onLoginExitoso}
            setMensajeError={setMensajeError}
            setMensajeExito={setMensajeExito}
          />

          <aside className="auth-overlay">
            <div className="auth-overlay-track">
              <section className="auth-overlay-panel auth-overlay-left">
                <h2>¡Bienvenido!</h2>
                <p>¿Ya tienes cuenta? Ingresa con tu usuario.</p>
                <button 
                  className="btn-overlay" 
                  type="button" 
                  onClick={() => {
                    setModo('login');
                    setMensajeError('');
                    setMensajeExito('');
                  }}
                >
                  inicia sesion
                </button>
              </section>

              <section className="auth-overlay-panel auth-overlay-right">
                <h2>Crear cuenta</h2>
                <p>Si eres nuevo en la plataforma, regístrate aquí.</p>
                <button
                  className="btn-overlay"
                  type="button"
                  onClick={() => {
                    setModo('register');
                    setMensajeError('');
                    setMensajeExito('');
                  }}
                >
                  Registrate
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
