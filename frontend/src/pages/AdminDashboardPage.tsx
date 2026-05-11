import { useEffect, useMemo, useState } from 'react'
import { obtenerKpis, obtenerVentas, obtenerStock } from '../api'
import type { ItemCatalogoSucursal, Kpi, Venta, StockItem } from '../types'
import { FORMATO_MONEDA, monthLabelFormatter } from '../utils/formatters'
import { BRANCH_ZONE_MAP } from '../constants/dashboardConfig'

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

  useEffect(() => {
    async function cargarDatosDashboard() {
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

    cargarDatosDashboard()
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

  const opcionesOrigen = useMemo(
    () => ['Todos', ...new Set(ventas.map((venta) => venta.sistemaOrigen))],
    [ventas],
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

      <section className="bloque" aria-label="Resumen de ventas totales">
        <h2>1. Dashboard general</h2>
        <div className="resumen-grid">
          <div className="tarjeta-resumen">
            <h3>Resumen de ventas totales</h3>
            <p className="valor-principal">{FORMATO_MONEDA.format(ventasTotales)}</p>
            <p>
              Registros: {ventas.length} | Sucursales con ventas:{' '}
              {datosSucursales.length}
            </p>
          </div>
          <div className="tarjeta-resumen">
            <h3>Comparacion entre sucursales</h3>
            <ul className="lista-simple">
              {datosSucursales.map((dato) => (
                <li key={dato.sucursal}>
                  <span>{dato.sucursal}</span>
                  <strong>{FORMATO_MONEDA.format(dato.total)}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="tarjeta-resumen">
            <h3>KPIs clave</h3>
            <ul className="lista-simple">
              <li>
                <span>Ticket promedio</span>
                <strong>{FORMATO_MONEDA.format(ticketPromedio)}</strong>
              </li>
              <li>
                <span>Sucursal lider</span>
                <strong>{sucursalLider?.sucursal ?? 'Sin datos'}</strong>
              </li>
              {kpis.slice(0, 2).map((kpi) => (
                <li key={kpi.id}>
                  <span>{kpi.nombre}</span>
                  <strong>{kpi.valorCalculado}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="tarjeta-resumen">
            <h3>Alertas o variaciones importantes</h3>
            <ul className="lista-alertas">
              {alertas.map((mensaje) => (
                <li key={mensaje}>{mensaje}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bloque" aria-label="Sucursales y ventas">
        <div className="section-title-row">
          <h2>2. Sucursales / Ventas</h2>
          <p>Analisis basico por sucursal con filtros.</p>
        </div>

        <div className="filtros-simples">
          <div className="filters-grid">
            <label>
              Fecha desde
              <input
                type="date"
                value={fechaDesde}
                onChange={(evento) => setFechaDesde(evento.target.value)}
              />
            </label>

            <label>
              Fecha hasta
              <input
                type="date"
                value={fechaHasta}
                onChange={(evento) => setFechaHasta(evento.target.value)}
              />
            </label>

            <label>
              Zona
              <select
                value={filtroZona}
                onChange={(evento) => setFiltroZona(evento.target.value)}
              >
                {opcionesZona.map((zona) => (
                  <option key={zona} value={zona}>
                    {zona}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sistema origen
              <select
                value={filtroOrigen}
                onChange={(evento) => setFiltroOrigen(evento.target.value)}
              >
                {opcionesOrigen.map((origen) => (
                  <option key={origen} value={origen}>
                    {origen}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filters-summary">
            <span>{ventasFiltradas.length} ventas filtradas</span>
            <strong>{FORMATO_MONEDA.format(totalFiltrado)}</strong>
            <button
              type="button"
              onClick={() => {
                setFechaDesde('')
                setFechaHasta('')
                setFiltroZona('Todas')
                setFiltroOrigen('Todos')
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="resumen-grid">
          <article className="tarjeta-resumen" aria-label="Lista de sucursales">
            <div className="panel-head">
              <h2>Lista de Sucursales</h2>
              <span>{catalogoFiltrado.length} activas</span>
            </div>

            <div className="branch-table">
              <div className="branch-table-head">
                <span>Sucursal</span>
                <span>Zona</span>
                <span>Total</span>
              </div>
              {catalogoFiltrado.map((item) => (
                <div key={item.sucursal} className="branch-table-row">
                  <span>{item.sucursal}</span>
                  <span>{item.zona}</span>
                  <strong>{FORMATO_MONEDA.format(item.total)}</strong>
                </div>
              ))}
              {!catalogoFiltrado.length && (
                <p className="empty-state">No hay sucursales para el filtro actual.</p>
              )}
            </div>
          </article>

          <article className="tarjeta-resumen" aria-label="Ventas por sucursal">
            <div className="panel-head">
              <h2>Ventas por Sucursal</h2>
              <span>Total filtrado</span>
            </div>

            <div className="branch-list">
              {datosSucursalesFiltrados.map((dato) => {
                const ancho =
                  maxVentaSucursalFiltrada > 0
                    ? (dato.total / maxVentaSucursalFiltrada) * 100
                    : 0
                return (
                  <div key={dato.sucursal} className="branch-item">
                    <div className="branch-top">
                      <span>{dato.sucursal}</span>
                      <strong>{FORMATO_MONEDA.format(dato.total)}</strong>
                    </div>
                    <div className="branch-bar-bg">
                      <div
                        className="branch-bar-fill"
                        style={{ width: `${ancho}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {!datosSucursalesFiltrados.length && (
                <p className="empty-state">Sin ventas para los filtros seleccionados.</p>
              )}
            </div>
          </article>

          <article
            className="tarjeta-resumen tarjeta-ancha"
            aria-label="Detalle por periodo"
          >
            <div className="panel-head">
              <h2>Detalle de Ingresos por Periodo</h2>
              <span>Mensual</span>
            </div>

            <div className="period-table">
              <div className="period-table-head">
                <span>Periodo</span>
                <span>Operaciones</span>
                <span>Ingresos</span>
              </div>
              {detallesPeriodo.map((detalle) => (
                <div key={detalle.periodo} className="period-table-row">
                  <span>{detalle.etiqueta}</span>
                  <span>{detalle.operaciones}</span>
                  <strong>{FORMATO_MONEDA.format(detalle.total)}</strong>
                </div>
              ))}
              {!detallesPeriodo.length && (
                <p className="empty-state">No existen ingresos en el periodo filtrado.</p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="bloque" aria-label="Inventario global">
        <h2>3. Inventario Global</h2>
        <div className="tarjeta-resumen tarjeta-ancha">
          <div className="panel-head">
            <h2>Stock por Sucursal y Producto</h2>
            <span>{stock.length} ítems en total</span>
          </div>
          <div className="branch-table">
            <div className="branch-table-head">
              <span>Sucursal</span>
              <span>Categoría</span>
              <span>Producto</span>
              <span>Stock</span>
              <span>Precio</span>
            </div>
            {stock.map((item) => (
              <div key={item.id} className="branch-table-row">
                <span>{item.sucursal}</span>
                <span>{item.categoria}</span>
                <span>{item.producto}</span>
                <strong>{item.cantidad}</strong>
                <span>${item.precioUnitario?.toLocaleString() || 0}</span>
              </div>
            ))}
            {!stock.length && (
              <p className="empty-state">No hay información de stock disponible.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboardPage
