import { useEffect, useMemo, useState } from 'react'
import { fetchDashboard } from '../api'
import { obtenerDetalleStock } from '../utils/stockUtils'
import type { Kpi, Venta } from '../types'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const FORMATO_MONEDA = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const FORMATO_COMPACTO = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const COLORES_GRAFICO = [
  '#0f766e',
  '#1d4ed8',
  '#0891b2',
  '#4f46e5',
  '#65a30d',
  '#b45309',
  '#9333ea',
  '#dc2626',
]

const TARJETAS_POR_PAGINA = 4

import { DASHBOARD_DEMO } from '../demoData'

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function DashboardPrincipalPage() {
  const [ventas, setVentas] = useState<Venta[]>(DASHBOARD_DEMO.ventas)
  const [kpis, setKpis] = useState<Kpi[]>(DASHBOARD_DEMO.kpis)
  const [alertas, setAlertas] = useState<string[]>(DASHBOARD_DEMO.alertas)
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
        const respuesta = await fetchDashboard()
        const mergedVentas = [...DASHBOARD_DEMO.ventas, ...(respuesta.ventas || [])]
        const mergedKpis = [...DASHBOARD_DEMO.kpis, ...(respuesta.kpis || [])]

        setVentas(mergedVentas)
        setKpis(mergedKpis)
        setAlertas(respuesta.alertas)
      } catch {
        setVentas(DASHBOARD_DEMO.ventas)
        setKpis(DASHBOARD_DEMO.kpis)
        setAlertas(DASHBOARD_DEMO.alertas)
        setMensajeError('No se pudo conectar con backend. Mostrando datos demo.')
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

    return Array.from(porSucursal.values())
      .sort((a, b) => b.total - a.total)
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

  const periodosAnalisisDisponibles = useMemo(
    () => (sucursalActiva ? serieSucursalActiva : graficoConsolidado).map((item) => item.periodo),
    [sucursalActiva, serieSucursalActiva, graficoConsolidado],
  )

  const detalleFiltrado = useMemo(() => {
    return obtenerDetalleStock(
      sucursalActiva,
      periodoAnalisis,
      periodosAnalisisDisponibles,
    )
  }, [sucursalActiva, periodoAnalisis, periodosAnalisisDisponibles])

  const detalleElectronica = useMemo(
    () => detalleFiltrado.filter((item) => item.categoria === 'Electrónica'),
    [detalleFiltrado],
  )

  const detalleHogar = useMemo(
    () => detalleFiltrado.filter((item) => item.categoria === 'Hogar'),
    [detalleFiltrado],
  )

  return (
    <section className="pagina-contenido">
      <div className="encabezado-pagina">
        <h2>Dashboard Principal</h2>
        <p>Ventas por sucursal, consolidado global y rendimiento comercial</p>
      </div>

      {cargando && <p>Cargando información...</p>}
      {mensajeError && <p className="mensaje-error">{mensajeError}</p>}
      {!mensajeError && alertas.length > 0 && <p className="mensaje-demo">{alertas[0]}</p>}

      <section className="tarjeta-panel">
        <div className="encabezado-mini-sucursales">
          <h3>Ventas por sucursal</h3>
          <div className="controles-mini-sucursales">
            <button type="button" onClick={paginaAnteriorSucursales} aria-label="Página anterior">
              ◀
            </button>
            <span>
              {Math.min(paginaSucursales + 1, totalPaginasSucursales)} / {totalPaginasSucursales}
            </span>
            <button type="button" onClick={paginaSiguienteSucursales} aria-label="Página siguiente">
              ▶
            </button>
          </div>
        </div>

        <p className="mensaje-demo">
          Ejemplo: Santiago {FORMATO_MONEDA.format(20000000)} y Concepción{' '}
          {FORMATO_MONEDA.format(12000000)}.
        </p>

        <div className="rejilla-mini-sucursales">
          {tarjetasVisibles.map((item, index) => {
            const miniId = `mini-${inicioPagina + index}`
            return (
            <article className="tarjeta-mini-sucursal" key={item.sucursal}>
              <button
                type="button"
                className="boton-mini-sucursal"
                onClick={() => setSucursalActiva(item.sucursal)}
              >
              <h4>{item.sucursal}</h4>
              <p>{FORMATO_MONEDA.format(item.total)}</p>
              <div className="mini-grafico-sucursal">
                <ResponsiveContainer width="100%" height={90}>
                  <AreaChart data={item.serie}>
                    <defs>
                      <linearGradient id={miniId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="periodo" hide />
                    <YAxis hide />
                    <Tooltip formatter={(valor) => FORMATO_MONEDA.format(Number(valor))} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: '#ffffff', stroke: '#0f766e', strokeWidth: 1.5 }}
                      activeDot={{ r: 4 }}
                      fillOpacity={1}
                      fill={`url(#${miniId})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              </button>
            </article>
          )})}
        </div>
      </section>

      {sucursalActiva ? (
        <>
          <section className="tarjeta-panel">
            <div className="encabezado-mini-sucursales">
              <h3>Rendimiento de {sucursalActiva} (últimos 6 meses)</h3>
              <button
                type="button"
                className="boton-volver-general"
                onClick={() => setSucursalActiva(null)}
              >
                Volver al general
              </button>
            </div>

            <div className="contenedor-grafico">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={serieSucursalActiva}
                  onClick={(evento) => {
                    const etiqueta = (evento as { activeLabel?: string })?.activeLabel
                    if (etiqueta) {
                      setPeriodoAnalisis(etiqueta)
                    }
                  }}
                  margin={{ top: 8, right: 18, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSucursalDetalle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis
                    width={70}
                    tickFormatter={(valor) => FORMATO_COMPACTO.format(Number(valor))}
                  />
                  <Tooltip formatter={(valor) => FORMATO_MONEDA.format(Number(valor))} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#0f766e"
                    dot={{ r: 3, fill: '#ffffff', stroke: '#0f766e', strokeWidth: 1.5 }}
                    activeDot={{ r: 5 }}
                    fillOpacity={1}
                    fill="url(#colorSucursalDetalle)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="tarjeta-panel">
            <h3>Resumen rápido ({sucursalActiva})</h3>

            <div className="rejilla-kpi">
              <article className="tarjeta-kpi">
                <h3>{periodoAnalisis === 'GENERAL' ? 'Ventas 6 meses' : 'Ventas del mes'}</h3>
                <p>{FORMATO_MONEDA.format(ventasAnalisis)}</p>
              </article>

              <article className="tarjeta-kpi">
                <h3>Promedio mensual</h3>
                <p>
                  {FORMATO_MONEDA.format(resumenSucursalActiva?.promedioMensual ?? 0)}
                </p>
              </article>

              <article className="tarjeta-kpi">
                <h3>Mejor mes</h3>
                <p>
                  {resumenSucursalActiva?.mejorMes?.periodo ?? '-'}
                </p>
              </article>

              <article className="tarjeta-kpi">
                <h3>Registros de venta</h3>
                <p>
                  {resumenSucursalActiva?.registros ?? 0}
                </p>
              </article>
            </div>
          </section>
        </>
      ) : (
        <section className="panel-graficos">
        <article className="tarjeta-panel grafico-principal">
          <h3>Venta consolidada (todas las sucursales)</h3>
          <div className="contenedor-grafico">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={graficoConsolidado}
                margin={{ top: 8, right: 18, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis
                  width={70}
                  tickFormatter={(valor) => FORMATO_COMPACTO.format(Number(valor))}
                />
                <Tooltip formatter={(valor) => FORMATO_MONEDA.format(Number(valor))} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mensaje-demo">Total consolidado: {FORMATO_MONEDA.format(ventasTotales)}</p>
        </article>

        <article className="tarjeta-panel grafico-rendimiento">
          <h3>Rendimiento por sucursal</h3>
          <div className="contenedor-grafico">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={rendimientoSucursales}
                  dataKey="porcentaje"
                  nameKey="sucursal"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={1}
                >
                  {rendimientoSucursales.map((item, index) => (
                    <Cell
                      key={item.sucursal}
                      fill={COLORES_GRAFICO[index % COLORES_GRAFICO.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(valor, _, item) => {
                    const total = item?.payload?.total ?? 0
                    return [
                      `${Number(valor).toFixed(2)}% • ${FORMATO_MONEDA.format(total)}`,
                      'Participación',
                    ]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="lista-sucursales-resumen">
            {rendimientoSucursales.slice(0, 8).map((item) => (
              <p key={item.sucursal}>
                <strong>{item.sucursal}:</strong> {item.porcentaje.toFixed(1)}%
              </p>
            ))}
          </div>
        </article>
      </section>
      )}

      {!sucursalActiva && <section className="tarjeta-panel">
        <h3>Resumen rápido</h3>
        <div className="rejilla-kpi">
          <article className="tarjeta-kpi">
            <h3>Ventas Totales</h3>
            <p>{FORMATO_MONEDA.format(ventasTotales)}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Ventas registradas</h3>
            <p>{ventas.length}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Sucursales activas</h3>
            <p>{ventasPorSucursal.length}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>KPIs disponibles</h3>
            <p>{kpis.length}</p>
          </article>
        </div>
      </section>}

      <section className="tarjeta-panel" style={{ marginTop: 24 }}>
        <h3>
          Stock de productos {sucursalActiva ? `(${sucursalActiva})` : '(Todas las sucursales)'}
        </h3>
        
        <div className="formulario-simple" style={{ marginBottom: 12 }}>
          <label>
            Periodo de análisis
            <select
              value={periodoAnalisis}
              onChange={(evento) => setPeriodoAnalisis(evento.target.value)}
            >
              <option value="GENERAL">General (6 meses)</option>
              {periodosAnalisisDisponibles.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="panel-graficos" style={{ marginTop: 12 }}>
          <article className="tarjeta-panel">
            <h3>Stock de productos (Electrónica)</h3>
            <div className="lista-sucursales-resumen">
              {detalleElectronica.map((item) => (
                <p key={item.producto}>
                  <strong>{item.stockInicial} {item.producto.toLowerCase()}</strong> ({item.vendidos} vendidos) total = {item.stockRestante} {item.producto.toLowerCase()}
                </p>
              ))}
            </div>
          </article>

          <article className="tarjeta-panel">
            <h3>Stock de productos (Hogar)</h3>
            <div className="lista-sucursales-resumen">
              {detalleHogar.map((item) => (
                <p key={item.producto}>
                  <strong>{item.stockInicial} {item.producto.toLowerCase()}</strong> ({item.vendidos} vendidos) total = {item.stockRestante} {item.producto.toLowerCase()}
                </p>
              ))}
            </div>
          </article>
        </div>
      </section>
    </section>
  )
}

export default DashboardPrincipalPage
