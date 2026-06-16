import { useEffect, useMemo, useState } from 'react'
import { obtenerKpis, obtenerVentas, obtenerStock } from '../api'
import type { ItemCatalogoSucursal, Kpi, Venta, StockItem } from '../types'
import { monthLabelFormatter } from '../utils/formatters'
import { BRANCH_ZONE_MAP } from '../constants/dashboardConfig'
import { 
  DashboardGeneralAdmin, 
  FiltrosDashboardAdmin, 
  ResumenVentasDashboardAdmin, 
  InventarioDashboardAdmin 
} from '../components'

function claveMes(textoFecha: string): string {
  const fecha = new Date(textoFecha)
  if (Number.isNaN(fecha.getTime())) return 'invalido'
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}`
}

function zonaPorSucursal(sucursal: string): string {
  return BRANCH_ZONE_MAP[sucursal] ?? 'Sin zona'
}

function formatearEtiquetaMes(clave: string): string {
  const [textoAnio, textoMes] = clave.split('-')
  const anio = Number(textoAnio)
  const mes = Number(textoMes)
  if (Number.isNaN(anio) || Number.isNaN(mes)) return clave
  const fecha = new Date(anio, mes - 1, 1)
  return monthLabelFormatter.format(fecha)
}

function AdminDashboardPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroZona, setFiltroZona] = useState('Todas')
  const [filtroOrigen, setFiltroOrigen] = useState('Todos')
  const [filtroSucursal, setFiltroSucursal] = useState('Todas')

  async function cargarDatosDashboard(mostrarCargando = false) {
    if (mostrarCargando) setCargando(true)
    try {
      const [ventasData, kpisData, stockData] = await Promise.all([obtenerVentas(), obtenerKpis(), obtenerStock()])
      setVentas(ventasData)
      setKpis(kpisData)
      setStock(stockData)
    } catch {
      // En refresco automático no borramos datos ya cargados
      if (mostrarCargando) {
        setVentas([])
        setKpis([])
        setStock([])
      }
    } finally {
      if (mostrarCargando) setCargando(false)
    }
  }

  useEffect(() => {
    // Función para carga inicial (asincrónica para evitar setState sincrónico)
    const cargarInicial = async () => {
      setCargando(true)
      try {
        const [ventasData, kpisData, stockData] = await Promise.all([obtenerVentas(), obtenerKpis(), obtenerStock()])
        setVentas(ventasData)
        setKpis(kpisData)
        setStock(stockData)
      } catch {
        setVentas([])
        setKpis([])
        setStock([])
      } finally {
        setCargando(false)
      }
    }

    cargarInicial()

    // Guardar la referencia para poder removerla correctamente al desmontar
    const alRegistrarVenta = () => cargarDatosDashboard()

    // Refresco cuando el mismo usuario registra una venta
    window.addEventListener('venta-registrada', alRegistrarVenta)

    // Refresco automático cada 20 s para detectar nuevas ventas
    const intervalo = setInterval(() => cargarDatosDashboard(), 20_000)

    return () => {
      window.removeEventListener('venta-registrada', alRegistrarVenta)
      clearInterval(intervalo)
    }
  }, [])

  const ventasTotales = useMemo(
    () => ventas.reduce((total, venta) => total + (venta.montoTotal || 0), 0),
    [ventas],
  )

  const ticketPromedio = useMemo(() => {
    if (!ventas.length) return 0
    return ventasTotales / ventas.length
  }, [ventasTotales, ventas.length])

  const datosSucursales = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const venta of ventas) {
      const clave = venta.sucursal || 'Sucursal sin nombre'
      mapa.set(clave, (mapa.get(clave) ?? 0) + (venta.montoTotal || 0))
    }

    return Array.from(mapa.entries())
      .map(([sucursal, total]) => ({ sucursal, total }))
      .sort((a, b) => b.total - a.total)
  }, [ventas])

  const sucursalLider = datosSucursales[0]

  const alertas = useMemo(() => {
    const mensajes: string[] = []

    if (!ventas.length) {
      mensajes.push('No hay ventas registradas para analizar.')
      return mensajes
    }

    if (sucursalLider && ventasTotales > 0) {
      const participacion = (sucursalLider.total / ventasTotales) * 100
      if (participacion >= 50) {
        mensajes.push(
          `${sucursalLider.sucursal} concentra gran parte de los ingresos (${participacion.toFixed(1)}%).`,
        )
      }
    }

    const sucursalDebil = datosSucursales.find((item) => item.total < ticketPromedio)
    if (sucursalDebil) {
      mensajes.push(
        `${sucursalDebil.sucursal} esta por debajo del promedio general de ingresos.`,
      )
    }

    if (!mensajes.length) {
      mensajes.push('Sin alertas importantes. El comportamiento se ve estable.')
    }

    return mensajes
  }, [ticketPromedio, datosSucursales, sucursalLider, ventasTotales, ventas.length])

  const catalogoSucursales = useMemo<ItemCatalogoSucursal[]>(() => {
    const mapa = new Map<string, number>()

    for (const venta of ventas) {
      const sucursal = venta.sucursal || 'Sucursal sin nombre'
      mapa.set(sucursal, (mapa.get(sucursal) ?? 0) + (venta.montoTotal || 0))
    }

    return Array.from(mapa.entries())
      .map(([sucursal, total]) => ({
        sucursal,
        zona: zonaPorSucursal(sucursal),
        total,
      }))
      .sort((a, b) => a.sucursal.localeCompare(b.sucursal, 'es'))
  }, [ventas])

  const opcionesZona = useMemo(
    () => ['Todas', ...new Set(catalogoSucursales.map((item) => item.zona))],
    [catalogoSucursales],
  )

  const ventasFiltradas = useMemo(() => {
    return ventas.filter((venta) => {
      const fechaVentaDate = new Date(venta.fechaVenta)
      const zonaSucursal = zonaPorSucursal(venta.sucursal || 'Sucursal sin nombre')

      if (fechaDesde) {
        const fechaInicio = new Date(`${fechaDesde}T00:00:00`)
        if (fechaVentaDate < fechaInicio) return false
      }

      if (fechaHasta) {
        const fechaFin = new Date(`${fechaHasta}T23:59:59`)
        if (fechaVentaDate > fechaFin) return false
      }

      if (filtroZona !== 'Todas' && zonaSucursal !== filtroZona) {
        return false
      }

      if (filtroOrigen !== 'Todos' && venta.sistemaOrigen !== filtroOrigen) {
        return false
      }

      return true
    })
  }, [fechaDesde, filtroOrigen, fechaHasta, ventas, filtroZona])

  const datosSucursalesFiltrados = useMemo(() => {
    const mapa = new Map<string, number>()

    for (const venta of ventasFiltradas) {
      const sucursal = venta.sucursal || 'Sucursal sin nombre'
      mapa.set(sucursal, (mapa.get(sucursal) ?? 0) + venta.montoTotal)
    }

    return Array.from(mapa.entries())
      .map(([sucursal, total]) => ({ sucursal, total }))
      .sort((a, b) => b.total - a.total)
  }, [ventasFiltradas])

  const maxVentaSucursalFiltrada = datosSucursalesFiltrados[0]?.total ?? 1

  const detallesPeriodo = useMemo(() => {
    const mapa = new Map<string, { total: number; operaciones: number }>()

    for (const venta of ventasFiltradas) {
      const clave = claveMes(venta.fechaVenta)
      const actual = mapa.get(clave) ?? { total: 0, operaciones: 0 }
      mapa.set(clave, {
        total: actual.total + venta.montoTotal,
        operaciones: actual.operaciones + 1,
      })
    }

    return Array.from(mapa.entries())
      .map(([periodo, valores]) => ({
        periodo,
        etiqueta: formatearEtiquetaMes(periodo),
        total: valores.total,
        operaciones: valores.operaciones,
      }))
      .sort((a, b) => (a.periodo > b.periodo ? 1 : -1))
  }, [ventasFiltradas])

  const totalFiltrado = useMemo(
    () => ventasFiltradas.reduce((suma, venta) => suma + venta.montoTotal, 0),
    [ventasFiltradas],
  )

  const catalogoFiltrado = useMemo(() => {
    const activas = new Set(datosSucursalesFiltrados.map((sucursal) => sucursal.sucursal))
    return catalogoSucursales
      .filter((item) => activas.has(item.sucursal))
      .sort((a, b) => b.total - a.total)
  }, [catalogoSucursales, datosSucursalesFiltrados])

  return (
    <main className="dashboard-page">
      <header className="encabezado-simple">
        <h1>Panel de Administracion</h1>
        <p>Grupo Cordillera - Vista para gerencia</p>
        <p>
          Estado: {cargando ? 'Cargando datos...' : 'Datos actualizados'}
        </p>
      </header>

      <DashboardGeneralAdmin
        ventasTotales={ventasTotales}
        ventasCount={ventas.length}
        datosSucursales={datosSucursales}
        ticketPromedio={ticketPromedio}
        sucursalLider={sucursalLider}
        kpis={kpis}
        alertas={alertas}
      />

      <section className="bloque" aria-label="Sucursales y ventas">
        <div className="section-title-row">
          <h2>2. Sucursales / Ventas</h2>
          <p>Analisis basico por sucursal con filtros.</p>
        </div>

        <FiltrosDashboardAdmin
          fechaDesde={fechaDesde}
          setFechaDesde={setFechaDesde}
          fechaHasta={fechaHasta}
          setFechaHasta={setFechaHasta}
          filtroZona={filtroZona}
          setFiltroZona={setFiltroZona}
          opcionesZona={opcionesZona}
          filtroOrigen={filtroOrigen}
          setFiltroOrigen={setFiltroOrigen}
          filtroSucursal={filtroSucursal}
          setFiltroSucursal={setFiltroSucursal}
          stock={stock}
          ventasFiltradasCount={ventasFiltradas.length}
          totalFiltrado={totalFiltrado}
        />

        <ResumenVentasDashboardAdmin
          catalogoFiltrado={catalogoFiltrado}
          datosSucursalesFiltrados={datosSucursalesFiltrados}
          maxVentaSucursalFiltrada={maxVentaSucursalFiltrada}
          detallesPeriodo={detallesPeriodo}
          setFiltroSucursal={setFiltroSucursal}
        />
      </section>

      <InventarioDashboardAdmin
        stock={stock}
        filtroSucursal={filtroSucursal}
      />
    </main>
  )
}

export default AdminDashboardPage
