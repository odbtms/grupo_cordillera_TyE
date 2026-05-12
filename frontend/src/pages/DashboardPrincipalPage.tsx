import { useEffect, useMemo, useState } from 'react'
import { obtenerDashboard } from '../api'
import type { Kpi, Venta } from '../types'
import { normalizarTexto } from '../utils/formatters'
import { TARJETAS_POR_PAGINA } from '../constants/dashboardConfig'
import {
  MiniaturasSucursalesDashboard,
  DetalleSucursalDashboard,
  ConsolidadoDashboard,
} from '../components'

function DashboardPrincipalPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [alertas, setAlertas] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensajeError, setMensajeError] = useState('')
  const [paginaSucursales, setPaginaSucursales] = useState(0)
  const [sucursalActiva, setSucursalActiva] = useState<string | null>(null)
  const [periodoAnalisis, setPeriodoAnalisis] = useState('GENERAL')

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)
      setMensajeError('')

      try {
        const respuesta = await obtenerDashboard()
        const mergedVentas = respuesta.ventas || []
        const mergedKpis = respuesta.kpis || []

        setVentas(mergedVentas)
        setKpis(mergedKpis)
        setAlertas(respuesta.alertas)
      } catch {
        setVentas([])
        setKpis([])
        setAlertas([])
        setMensajeError('No se pudo conectar con backend.')
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  const ventasPorSucursal = useMemo(() => {
    const porSucursal = new Map<string, { sucursal: string; total: number }>()

    for (const venta of ventas) {
      const llave = normalizarTexto(venta.sucursal)
      const registroActual = porSucursal.get(llave)

      porSucursal.set(llave, {
        sucursal: registroActual?.sucursal ?? venta.sucursal,
        total: (registroActual?.total ?? 0) + venta.montoTotal,
      })
    }

    return Array.from(porSucursal.values()).sort((a, b) => b.total - a.total)
  }, [ventas])

  const ventasTotales = useMemo(
    () => ventas.reduce((acum, item) => acum + item.montoTotal, 0),
    [ventas],
  )

  const graficoConsolidado = useMemo(() => {
    const porMes = new Map<string, number>()

    for (const venta of ventas) {
      const fecha = new Date(venta.fechaVenta)
      if (Number.isNaN(fecha.getTime())) continue

      const llave = `${fecha.getFullYear()}-${`${fecha.getMonth() + 1}`.padStart(2, '0')}`
      porMes.set(llave, (porMes.get(llave) ?? 0) + venta.montoTotal)
    }

    return Array.from(porMes.entries())
      .map(([periodo, total]) => ({ periodo, total }))
      .sort((a, b) => (a.periodo > b.periodo ? 1 : -1))
  }, [ventas])

  const serieSucursalActiva = useMemo(() => {
    if (!sucursalActiva) return []

    const sucursalObjetivo = normalizarTexto(sucursalActiva)

    const porMes = new Map<string, number>()
    for (const venta of ventas) {
      if (normalizarTexto(venta.sucursal) !== sucursalObjetivo) continue

      const fecha = new Date(venta.fechaVenta)
      if (Number.isNaN(fecha.getTime())) continue

      const periodo = `${fecha.getFullYear()}-${`${fecha.getMonth() + 1}`.padStart(2, '0')}`
      porMes.set(periodo, (porMes.get(periodo) ?? 0) + venta.montoTotal)
    }

    return Array.from(porMes.entries())
      .map(([periodo, total]) => ({ periodo, total }))
      .sort((a, b) => (a.periodo > b.periodo ? 1 : -1))
      .slice(-6)
  }, [sucursalActiva, ventas])

  const resumenSucursalActiva = useMemo(() => {
    if (!sucursalActiva) return null

    const total = serieSucursalActiva.reduce((acum, item) => acum + item.total, 0)
    const promedioMensual = serieSucursalActiva.length
      ? total / serieSucursalActiva.length
      : 0
    const mejorMes = serieSucursalActiva.reduce<{ periodo: string; total: number } | null>(
      (maximo, actual) =>
        !maximo || actual.total > maximo.total ? actual : maximo,
      null,
    )
    const registros = ventas.filter((item) => item.sucursal === sucursalActiva).length

    return {
      total,
      promedioMensual,
      mejorMes,
      registros,
    }
  }, [serieSucursalActiva, sucursalActiva, ventas])

  const rendimientoSucursales = useMemo(() => {
    if (!ventasTotales) return []

    return ventasPorSucursal.map((item) => ({
      ...item,
      porcentaje: (item.total / ventasTotales) * 100,
    }))
  }, [ventasPorSucursal, ventasTotales])

  const tarjetasSucursales = useMemo(() => {
    const mapaSeries = new Map<string, { sucursal: string; serie: Map<string, number>; total: number }>()

    for (const venta of ventas) {
      const llaveSucursal = normalizarTexto(venta.sucursal)
      const fecha = new Date(venta.fechaVenta)
      if (Number.isNaN(fecha.getTime())) continue

      const periodo = `${fecha.getFullYear()}-${`${fecha.getMonth() + 1}`.padStart(2, '0')}`
      const registroActual = mapaSeries.get(llaveSucursal)
      const serie = registroActual?.serie ?? new Map<string, number>()
      serie.set(periodo, (serie.get(periodo) ?? 0) + venta.montoTotal)

      mapaSeries.set(llaveSucursal, {
        sucursal: registroActual?.sucursal ?? venta.sucursal,
        serie,
        total: (registroActual?.total ?? 0) + venta.montoTotal,
      })
    }

    return ventasPorSucursal.map((item) => ({
      sucursal: item.sucursal,
      total: item.total,
      serie: Array.from(mapaSeries.get(normalizarTexto(item.sucursal))?.serie.entries() ?? [])
        .map(([periodo, total]) => ({ periodo, total }))
        .sort((a, b) => (a.periodo > b.periodo ? 1 : -1)),
    }))
  }, [ventas, ventasPorSucursal])

  const totalPaginasSucursales = Math.max(
    1,
    Math.ceil(tarjetasSucursales.length / TARJETAS_POR_PAGINA),
  )

  useEffect(() => {
    if (paginaSucursales > totalPaginasSucursales - 1) {
      setPaginaSucursales(0)
    }
  }, [paginaSucursales, totalPaginasSucursales])

  const inicioPagina = paginaSucursales * TARJETAS_POR_PAGINA
  const tarjetasVisibles = tarjetasSucursales.slice(
    inicioPagina,
    inicioPagina + TARJETAS_POR_PAGINA,
  )

  function paginaAnteriorSucursales() {
    setPaginaSucursales((actual) =>
      actual === 0 ? totalPaginasSucursales - 1 : actual - 1,
    )
  }

  function paginaSiguienteSucursales() {
    setPaginaSucursales((actual) =>
      actual === totalPaginasSucursales - 1 ? 0 : actual + 1,
    )
  }

  useEffect(() => {
    setPeriodoAnalisis('GENERAL')
  }, [sucursalActiva])

  const ventasAnalisis = useMemo(() => {
    if (!sucursalActiva) return 0

    if (periodoAnalisis === 'GENERAL') {
      return resumenSucursalActiva?.total ?? 0
    }

    const datoMes = serieSucursalActiva.find((item) => item.periodo === periodoAnalisis)
    return datoMes?.total ?? 0
  }, [periodoAnalisis, resumenSucursalActiva, serieSucursalActiva, sucursalActiva])

  return (
    <section className="pagina-contenido">
      <div className="encabezado-pagina">
        <h2>Dashboard Principal</h2>
        <p>Ventas por sucursal, consolidado global y rendimiento comercial</p>
      </div>

      {cargando && <p>Cargando información...</p>}
      {mensajeError && <p className="mensaje-error">{mensajeError}</p>}
      {!mensajeError && alertas.length > 0 && <p className="mensaje-demo">{alertas[0]}</p>}

      <MiniaturasSucursalesDashboard
        tarjetasVisibles={tarjetasVisibles}
        paginaSucursales={paginaSucursales}
        totalPaginasSucursales={totalPaginasSucursales}
        paginaAnteriorSucursales={paginaAnteriorSucursales}
        paginaSiguienteSucursales={paginaSiguienteSucursales}
        setSucursalActiva={setSucursalActiva}
        inicioPagina={inicioPagina}
      />

      {sucursalActiva ? (
        <DetalleSucursalDashboard
          sucursalActiva={sucursalActiva}
          setSucursalActiva={setSucursalActiva}
          serieSucursalActiva={serieSucursalActiva}
          setPeriodoAnalisis={setPeriodoAnalisis}
          periodoAnalisis={periodoAnalisis}
          resumenSucursalActiva={resumenSucursalActiva}
          ventasAnalisis={ventasAnalisis}
        />
      ) : (
        <ConsolidadoDashboard
          graficoConsolidado={graficoConsolidado}
          ventasTotales={ventasTotales}
          rendimientoSucursales={rendimientoSucursales}
          ventasPorSucursal={ventasPorSucursal}
          ventas={ventas}
          kpis={kpis}
        />
      )}
    </section>
  )
}

export default DashboardPrincipalPage
