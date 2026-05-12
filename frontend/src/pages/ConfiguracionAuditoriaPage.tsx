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
import { UserProfileManager, UserRoleList, ServiceHealthCheck } from '../components'

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

      <UserProfileManager
        usuario={usuario}
        rol={rol}
        token={token}
        rolObjetivo={rolObjetivo}
        setRolObjetivo={setRolObjetivo}
        guardarRol={guardarRol}
        mensajeRol={mensajeRol}
        onCerrarSesion={onCerrarSesion}
      />

      <UserRoleList
        usuariosDb={usuariosDb}
        cambiarRolUsuarioExterno={cambiarRolUsuarioExterno}
      />

      <ServiceHealthCheck
        estadoServicios={estadoServicios}
      />
    </section>
  )
}

export default ConfiguracionAuditoriaPage
