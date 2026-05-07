import { useEffect, useState } from 'react'
import {
  actualizarRolUsuarioPorUsername,
  createPlantillaReporte,
  eliminarPlantillaReporte,
  fetchKpis,
  fetchVentas,
  validateToken,
} from '../api'

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
  const [rolObjetivo, setRolObjetivo] = useState<'ADMIN' | 'EJECUTIVO'>(
    rol.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EJECUTIVO',
  )
  const [mensajeRol, setMensajeRol] = useState('')

  const [estadoServicios, setEstadoServicios] = useState<EstadoServicio[]>([
    { nombre: 'ms-auth', estado: 'sin-conexion' },
    { nombre: 'ms-datos', estado: 'sin-conexion' },
    { nombre: 'ms-kpis', estado: 'sin-conexion' },
    { nombre: 'ms-reportes', estado: 'sin-conexion' },
  ])

  useEffect(() => {
    async function validarServicios() {
      const resultados = await Promise.allSettled([
        validateToken(token),
        fetchVentas(),
        fetchKpis(),
        (async () => {
          const temporal = await createPlantillaReporte({
            titulo: 'healthcheck-temp',
            configuracionVisual: 'healthcheck-temp',
            estado: 'Activo',
          })
          await eliminarPlantillaReporte(temporal.id)
          return true
        })(),
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
    }

    validarServicios()
  }, [token])

  async function guardarRol() {
    setMensajeRol('')
    try {
      await actualizarRolUsuarioPorUsername(usuario, rolObjetivo)
      setMensajeRol(`Rol actualizado en ms-auth para ${usuario}.`)
    } catch {
      setMensajeRol('No fue posible actualizar rol en ms-auth.')
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
            Cambiar rol (PUT ms-auth)
            <select
              value={rolObjetivo}
              onChange={(evento) =>
                setRolObjetivo(evento.target.value as 'ADMIN' | 'EJECUTIVO')
              }
            >
              <option value="ADMIN">ADMIN</option>
              <option value="EJECUTIVO">EJECUTIVO</option>
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
