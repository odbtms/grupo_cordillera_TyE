import { useEffect, useState } from 'react'
import {
  actualizarRolUsuarioPorUsername,
  actualizarRolUsuario,
  obtenerUsuarios,
  obtenerPlantillasReporte,
  obtenerKpis,
  obtenerVentas,
  validarToken,
} from '../api'
import type { Usuario } from '../api'

type EstadoServicio = {
  nombre: string
  estado: 'conectado' | 'sin-conexion'
}

type ConfiguracionAuditoriaPageProps = {
  token: string
  usuario: string
  rol: string
  onCerrarSesion: () => void
}

function ConfiguracionAuditoriaPage({
  token,
  usuario,
  rol,
  onCerrarSesion,
}: ConfiguracionAuditoriaPageProps) {
  const [rolObjetivo, setRolObjetivo] = useState<'ADMIN' | 'EMPLEADO_TIENDA'>(
    rol.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLEADO_TIENDA',
  )
  const [mensajeRol, setMensajeRol] = useState('')
  const [usuariosDb, setUsuariosDb] = useState<Usuario[]>([])

  const [estadoServicios, setEstadoServicios] = useState<EstadoServicio[]>([
    { nombre: 'ms-auth', estado: 'sin-conexion' },
    { nombre: 'ms-datos', estado: 'sin-conexion' },
    { nombre: 'ms-kpis', estado: 'sin-conexion' },
    { nombre: 'ms-reportes', estado: 'sin-conexion' },
  ])

  useEffect(() => {
    async function validarServicios() {
      const resultados = await Promise.allSettled([
        validarToken(token),
        obtenerVentas(),
        obtenerKpis(),
        obtenerPlantillasReporte(),
        obtenerUsuarios()
      ])

      setEstadoServicios([
        {
          nombre: 'ms-auth',
          estado: resultados[0].status === 'fulfilled' ? 'conectado' : 'sin-conexion',
        },
        {
          nombre: 'ms-datos',
          estado: resultados[1].status === 'fulfilled' ? 'conectado' : 'sin-conexion',
        },
        {
          nombre: 'ms-kpis',
          estado: resultados[2].status === 'fulfilled' ? 'conectado' : 'sin-conexion',
        },
        {
          nombre: 'ms-reportes',
          estado: resultados[3].status === 'fulfilled' ? 'conectado' : 'sin-conexion',
        },
      ])

      if (resultados[4].status === 'fulfilled') {
        setUsuariosDb(resultados[4].value as Usuario[])
      }
    }

    validarServicios()
  }, [token])

  async function guardarRol() {
    setMensajeRol('')
    try {
      await actualizarRolUsuarioPorUsername(usuario, rolObjetivo)
      setMensajeRol(`Rol actualizado para ti (${usuario}).`)
      const lista = await obtenerUsuarios()
      setUsuariosDb(lista)
    } catch {
      setMensajeRol('Error al actualizar tu propio rol.')
    }
  }

  async function cambiarRolUsuarioExterno(id: number, nuevoRol: string) {
    try {
      await actualizarRolUsuario(id, nuevoRol)
      const lista = await obtenerUsuarios()
      setUsuariosDb(lista)
      alert('Rol de usuario actualizado correctamente.')
    } catch {
      alert('No se pudo cambiar el rol del usuario.')
    }
  }

  return (
    <section className="pagina-contenido">
      <div className="encabezado-pagina">
        <h2>Configuración y Auditoría</h2>
        <p>Control de sesión y estado de integración backend</p>
      </div>

      <section className="tarjeta-panel">
        <h3>Perfil de usuario</h3>
        <p>Usuario: {usuario}</p>
        <p>Rol: {rol}</p>
        <p>Token activo: {token ? 'Sí' : 'No'}</p>

        <div className="formulario-simple">
          <label>
            Cambiar Rol
            <select
              value={rolObjetivo}
              onChange={(evento) =>
                setRolObjetivo(evento.target.value as 'ADMIN' | 'EMPLEADO_TIENDA')
              }
            >
              <option value="ADMIN">ADMIN</option>
              <option value="EMPLEADO_TIENDA">EMPLEADO_TIENDA</option>
            </select>
          </label>
          <button type="button" onClick={guardarRol}>
            Actualizar rol
          </button>
        </div>
        {mensajeRol && <p>{mensajeRol}</p>}

        <button type="button" onClick={onCerrarSesion}>
          Cerrar sesión
        </button>
      </section>

      <section className="tarjeta-panel">
        <h3>Gestión de Usuarios (Base de Datos)</h3>
        <p className="mensaje-demo">Administra los roles de todos los usuarios registrados.</p>
        <div className="tabla-simple">
          <div className="fila fila-encabezado">
            <span>Usuario</span>
            <span>Email</span>
            <span>Rol Actual</span>
            <span>Acciones</span>
          </div>
          {usuariosDb.map((u) => (
            <div key={u.id} className="fila">
              <span>{u.username}</span>
              <span>{u.email}</span>
              <strong>{u.rol}</strong>
              <span>
                <select 
                  defaultValue={u.rol}
                  onChange={(e) => cambiarRolUsuarioExterno(u.id, e.target.value)}
                  style={{ fontSize: '12px', padding: '2px' }}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EMPLEADO_TIENDA">EMPLEADO_TIENDA</option>
                </select>
              </span>
            </div>
          ))}
          {usuariosDb.length === 0 && <p>Cargando lista de usuarios...</p>}
        </div>
      </section>

      <section className="tarjeta-panel">
        <h3>Health Check de servicios</h3>
        <ul className="lista-servicios">
          {estadoServicios.map((servicio) => (
            <li key={servicio.nombre}>
              <span
                className={`estado-circulo ${
                  servicio.estado === 'conectado' ? 'ok' : 'error'
                }`}
              />
              {servicio.nombre} - {servicio.estado}
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default ConfiguracionAuditoriaPage
