import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { Toaster } from 'sonner'
import { LayoutDashboard, FileBarChart2, Building2, Settings, LogOut, User, Store } from 'lucide-react'
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

const ICONOS_MENU: Record<PaginaSistema, React.ReactNode> = {
  dashboard: <LayoutDashboard size={16} />,
  reportes: <FileBarChart2 size={16} />,
  'gestion-organizacional': <Building2 size={16} />,
  'configuracion-auditoria': <Settings size={16} />,
}

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
        <Toaster position="top-right" richColors />
        <LoginPage onLoginExitoso={manejarLoginExitoso} />
      </AdminLayout>
    )
  }

  const opcionesMenu: Array<{ clave: PaginaSistema; texto: string }> = esEmpleadoTienda
    ? [
      { clave: 'dashboard', texto: 'Dashboard' },
      { clave: 'reportes', texto: 'Reportes' },
    ]
    : [
      { clave: 'dashboard', texto: 'Dashboard' },
      { clave: 'reportes', texto: 'Reportes' },
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
        texto: 'Configuración',
      },
    ]

  let contenidoPagina = <DashboardPrincipalPage />

  if (esEmpleadoTienda) {
    contenidoPagina = sucursal
      ? <EmpleadoDashboardPage sucursalAsignada={sucursal} nombreUsuario={usuario} />
      : <div className="cargando-pantalla">Cargando sucursal asignada...</div>
  }

  if (paginaActual === 'reportes') {
    contenidoPagina = <ReportesPage rol={rol} sucursalAsignada={sucursal} />
  }

  if (paginaActual === 'gestion-organizacional' && esAdmin && !esEmpleadoTienda) {
    contenidoPagina = <GestionOrganizacionalPage nombreUsuario={usuario} />
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
      <Toaster position="top-right" richColors />
      <main className="aplicacion-contenedor">
        <aside className="menu-lateral">
          <div className="menu-lateral-header">
            <div className="menu-lateral-logo">
              <Building2 size={20} color="#0f766e" />
              <h2>Grupo Cordillera</h2>
            </div>
            <div className="menu-lateral-usuario">
              <div className="menu-lateral-avatar">
                <User size={14} />
              </div>
              <div>
                <p className="menu-lateral-nombre">{usuario}</p>
                <p className="menu-lateral-rol">{esAdmin ? 'Administrador' : 'Empleado'}</p>
                {esEmpleadoTienda && sucursal && (
                  <p className="menu-lateral-sucursal">
                    <Store size={11} style={{ display: 'inline', marginRight: 4 }} />
                    {sucursal}
                  </p>
                )}
              </div>
            </div>
          </div>

          <nav>
            {opcionesMenu.map((opcion) => (
              <button
                key={opcion.clave}
                type="button"
                className={`menu-lateral-btn${paginaActual === opcion.clave ? ' activo' : ''}`}
                onClick={() => navegarA(opcion.clave)}
              >
                <span className="menu-lateral-icon">{ICONOS_MENU[opcion.clave]}</span>
                {opcion.texto}
              </button>
            ))}
          </nav>

          <button type="button" onClick={cerrarSesion} className="boton-cerrar-sesion">
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </aside>

        <section className="contenido-principal">{contenidoPagina}</section>
      </main>
    </AdminLayout>
  )
}

export default App
