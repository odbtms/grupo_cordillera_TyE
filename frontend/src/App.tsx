import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from './layouts'
import ConfiguracionAuditoriaPage from './pages/ConfiguracionAuditoriaPage'
import DashboardPrincipalPage from './pages/DashboardPrincipalPage'
import EmpleadoDashboardPage from './pages/EmpleadoDashboardPage'
import GestionOrganizacionalPage from './pages/GestionOrganizacionalPage'
import LoginPage from './pages/LoginPage'
import ReportesPage from './pages/ReportesPage'

type PaginaSistema =
  | 'dashboard'
  | 'reportes'
  | 'gestion-organizacional'
  | 'configuracion-auditoria'

function obtenerSesionInicial() {
  const token = sessionStorage.getItem('token') ?? ''
  const rol = sessionStorage.getItem('rol') ?? ''
  const usuario = sessionStorage.getItem('usuario') ?? ''
  const sucursal = sessionStorage.getItem('sucursal')
  return { token, rol, usuario, sucursal }
}

function App() {
  const sesionInicial = useMemo(() => obtenerSesionInicial(), [])
  const [token, setToken] = useState(sesionInicial.token)
  const [rol, setRol] = useState(sesionInicial.rol)
  const [usuario, setUsuario] = useState(sesionInicial.usuario)
  const [sucursal, setSucursal] = useState<string | null>(sesionInicial.sucursal)
  const hashInicial = (window.location.hash.replace('#', '') as PaginaSistema) || 'dashboard'
  const [paginaActual, setPaginaActual] = useState<PaginaSistema>(hashInicial)

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.pagina) {
        setPaginaActual(event.state.pagina)
      } else {
        const hash = window.location.hash.replace('#', '') as PaginaSistema
        setPaginaActual(hash || 'dashboard')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navegarA(nuevaPagina: PaginaSistema) {
    setPaginaActual(nuevaPagina)
    window.history.pushState({ pagina: nuevaPagina }, '', `#${nuevaPagina}`)
  }

  function manejarLoginExitoso(
    nuevoToken: string,
    nuevoRol: string,
    nuevoUsuario: string,
    nuevaSucursal: string | null,
  ) {
    setToken(nuevoToken)
    setRol(nuevoRol)
    setUsuario(nuevoUsuario)
    setSucursal(nuevaSucursal)
    navegarA('dashboard')

    sessionStorage.setItem('token', nuevoToken)
    sessionStorage.setItem('rol', nuevoRol)
    sessionStorage.setItem('usuario', nuevoUsuario)

    if (nuevaSucursal) {
      sessionStorage.setItem('sucursal', nuevaSucursal)
    } else {
      sessionStorage.removeItem('sucursal')
    }
  }

  function cerrarSesion() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('rol')
    sessionStorage.removeItem('usuario')
    sessionStorage.removeItem('sucursal')

    setToken('')
    setRol('')
    setUsuario('')
    setSucursal(null)
    navegarA('dashboard')
  }

  const esAdmin = rol.toUpperCase() === 'ADMIN'
  const esEmpleadoTienda = rol.toUpperCase() === 'EMPLEADO_TIENDA'

  if (!token) {
    return (
      <AdminLayout>
        <LoginPage onLoginExitoso={manejarLoginExitoso} />
      </AdminLayout>
    )
  }

  const opcionesMenu: Array<{ clave: PaginaSistema; texto: string }> = esEmpleadoTienda
    ? [
        { clave: 'dashboard', texto: 'Dashboard principal' },
        { clave: 'reportes', texto: 'Módulo de reportes' },
      ]
    : [
        { clave: 'dashboard', texto: 'Dashboard principal' },
        { clave: 'reportes', texto: 'Módulo de reportes' },
        ...(esAdmin
          ? ([
              {
                clave: 'gestion-organizacional',
                texto: 'Gestión organizacional',
              },
            ] as Array<{ clave: PaginaSistema; texto: string }>)
          : []),
        {
          clave: 'configuracion-auditoria',
          texto: 'Configuración y auditoría',
        },
      ]

  let contenidoPagina = esEmpleadoTienda && sucursal
    ? <EmpleadoDashboardPage sucursalAsignada={sucursal} />
    : <DashboardPrincipalPage />

  if (paginaActual === 'reportes') {
    contenidoPagina = <ReportesPage rol={rol} sucursalAsignada={sucursal} />
  }

  if (paginaActual === 'gestion-organizacional' && esAdmin && !esEmpleadoTienda) {
    contenidoPagina = <GestionOrganizacionalPage />
  }

  if (paginaActual === 'configuracion-auditoria' && !esEmpleadoTienda) {
    contenidoPagina = (
      <ConfiguracionAuditoriaPage
        token={token}
        usuario={usuario}
        rol={rol}
        onCerrarSesion={cerrarSesion}
      />
    )
  }

  return (
    <AdminLayout>
      <main className="aplicacion-contenedor">
        <aside className="menu-lateral">
          <h2>Panel Admin</h2>
          <p>{usuario}</p>
          {esEmpleadoTienda && sucursal && <p>Sucursal: {sucursal}</p>}

          <nav>
            {opcionesMenu.map((opcion) => (
              <button
                key={opcion.clave}
                type="button"
                className={paginaActual === opcion.clave ? 'activo' : ''}
                onClick={() => navegarA(opcion.clave)}
              >
                {opcion.texto}
              </button>
            ))}
          </nav>

          <button type="button" onClick={cerrarSesion} className="boton-cerrar-sesion">
            Cerrar sesión
          </button>
        </aside>

        <section className="contenido-principal">{contenidoPagina}</section>
      </main>
    </AdminLayout>
  )
}

export default App
