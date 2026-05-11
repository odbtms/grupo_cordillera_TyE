import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  obtenerStock,
  obtenerVentas,
  obtenerVentasPorSucursal,
} from '../api'
import type { StockItem, Venta } from '../types'
import { FORMATO_MONEDA, FORMATO_COMPACTO, normalizarTexto } from '../utils/formatters'
import { STOCK_CRITICO_UMBRAL } from '../constants/dashboardConfig'

type RegistroAnalitico = {
  fecha: string
  sucursal: string
  categoria: string
  ventas: number
  inventario: number
  stockCritico: number
  margen: number
}

function fechaTexto(fecha: Date) {
  return fecha.toISOString().slice(0, 10)
}

type ReportesPageProps = {
  rol?: string
  sucursalAsignada?: string | null
}

function ReportesPage({ rol, sucursalAsignada }: ReportesPageProps) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [mensajeDatos, setMensajeDatos] = useState('')

  const [sucursalFiltro, setSucursalFiltro] = useState('Todas')
  const [fechaDesde, setFechaDesde] = useState(() => {
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - 29)
    return fechaTexto(inicio)
  })
  const [fechaHasta, setFechaHasta] = useState(() => fechaTexto(new Date()))
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')

  useEffect(() => {
    async function cargarDatos() {
      setMensajeDatos('')
      const esEmpleadoTienda = (rol ?? '').toUpperCase() === 'EMPLEADO_TIENDA'
      const sucursal = sucursalAsignada ?? ''

      try {
        if (esEmpleadoTienda && sucursal) {
          const [ventasSucursal, stockSucursal] = await Promise.all([
            obtenerVentasPorSucursal(sucursal),
            obtenerStock(sucursal),
          ])
          setVentas(ventasSucursal)
          setStock(stockSucursal)
        } else {
          const [ventasFull, stockFull] = await Promise.all([
            obtenerVentas(),
            obtenerStock(),
          ])
          setVentas(ventasFull)
          setStock(stockFull)
        }
      } catch {
        setVentas([])
        setStock([])
        setMensajeDatos('No se pudo cargar datos reales desde ms-datos.')
      }
    }

    cargarDatos()
  }, [rol, sucursalAsignada])

  const esEmpleadoTienda = (rol ?? '').toUpperCase() === 'EMPLEADO_TIENDA'
  const sucursalBloqueada = esEmpleadoTienda && Boolean(sucursalAsignada)

  const sucursalesOpciones = useMemo(() => {
    const setSucursales = new Set<string>()
    ventas.forEach((venta) => venta.sucursal && setSucursales.add(venta.sucursal))
    stock.forEach((item) => item.sucursal && setSucursales.add(item.sucursal))
    return ['Todas', ...Array.from(setSucursales).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [ventas, stock])

  const categoriasOpciones = useMemo(() => {
    const setCategorias = new Set<string>()
    stock.forEach((item) => item.categoria && setCategorias.add(item.categoria))
    return ['Todas', ...Array.from(setCategorias).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [stock])

  const categoriasAnalitica = useMemo(
    () => categoriasOpciones.filter((categoria) => categoria !== 'Todas'),
    [categoriasOpciones],
  )

  const registrosAnaliticos = useMemo(() => {
    if (!ventas.length) return []

    const stockPorSucursal = new Map<string, Map<string, { cantidad: number; criticos: number }>>()

    for (const item of stock) {
      const sucursal = item.sucursal
      const categoria = item.categoria || 'General'
      const mapCategorias = stockPorSucursal.get(sucursal) ?? new Map()
      const actual = mapCategorias.get(categoria) ?? { cantidad: 0, criticos: 0 }
      mapCategorias.set(categoria, {
        cantidad: actual.cantidad + item.cantidad,
        criticos: actual.criticos + (item.cantidad < STOCK_CRITICO_UMBRAL ? 1 : 0),
      })
      stockPorSucursal.set(sucursal, mapCategorias)
    }

    const mapa = new Map<string, RegistroAnalitico>()

    for (const venta of ventas) {
      const fecha = venta.fechaVenta ? fechaTexto(new Date(venta.fechaVenta)) : ''
      if (!fecha) continue

      const sucursal = venta.sucursal
      const categorias = stockPorSucursal.get(sucursal) ?? new Map([['General', { cantidad: 0, criticos: 0 }]])
      const totalStock = Array.from(categorias.values()).reduce((acc, item) => acc + item.cantidad, 0)

      categorias.forEach((info, categoria) => {
        const proporcion = totalStock > 0 ? info.cantidad / totalStock : 1
        const ventasCategoria = (venta.montoTotal ?? 0) * proporcion
        const key = `${fecha}|${sucursal}|${categoria}`

        const existente = mapa.get(key)
        if (existente) {
          mapa.set(key, {
            ...existente,
            ventas: existente.ventas + ventasCategoria,
          })
        } else {
          mapa.set(key, {
            fecha,
            sucursal,
            categoria,
            ventas: ventasCategoria,
            inventario: info.cantidad,
            stockCritico: info.criticos,
            margen: 0,
          })
        }
      })
    }

    return Array.from(mapa.values())
  }, [ventas, stock])

  const registrosFiltrados = useMemo(() => {
    const asignadaNorm = sucursalAsignada ? normalizarTexto(sucursalAsignada) : null
    const filtroNorm = normalizarTexto(sucursalFiltro)

    return registrosAnaliticos.filter((item) => {
      const sucursalItemNorm = normalizarTexto(item.sucursal)

      if (sucursalBloqueada && asignadaNorm && sucursalItemNorm !== asignadaNorm) return false
      if (!sucursalBloqueada && sucursalFiltro !== 'Todas' && sucursalItemNorm !== filtroNorm) return false
      if (categoriaFiltro !== 'Todas' && item.categoria !== categoriaFiltro) return false
      if (fechaDesde && item.fecha < fechaDesde) return false
      if (fechaHasta && item.fecha > fechaHasta) return false
      return true
    })
  }, [categoriaFiltro, fechaDesde, fechaHasta, sucursalFiltro, sucursalBloqueada, sucursalAsignada, registrosAnaliticos])

  const stockFiltrado = useMemo(() => {
    const asignadaNorm = sucursalAsignada ? normalizarTexto(sucursalAsignada) : null
    const filtroNorm = normalizarTexto(sucursalFiltro)

    return stock.filter((item) => {
      const sucursalItemNorm = normalizarTexto(item.sucursal)

      if (sucursalBloqueada && asignadaNorm && sucursalItemNorm !== asignadaNorm) return false
      if (!sucursalBloqueada && sucursalFiltro !== 'Todas' && sucursalItemNorm !== filtroNorm) return false
      if (categoriaFiltro !== 'Todas' && item.categoria !== categoriaFiltro) return false
      return true
    })
  }, [categoriaFiltro, sucursalFiltro, sucursalBloqueada, sucursalAsignada, stock])

  const ventaTotalConsolidada = useMemo(
    () => registrosFiltrados.reduce((acum, item) => acum + item.ventas, 0),
    [registrosFiltrados],
  )

  const sucursalMayorRendimiento = useMemo(() => {
    if (!registrosFiltrados.length) return 'Sin datos'

    const fechaMaxima = registrosFiltrados.reduce(
      (max, item) => (item.fecha > max ? item.fecha : max),
      registrosFiltrados[0].fecha,
    )

    const mapa = new Map<string, number>()
    registrosFiltrados
      .filter((item) => item.fecha === fechaMaxima)
      .forEach((item) => {
        mapa.set(item.sucursal, (mapa.get(item.sucursal) ?? 0) + item.ventas)
      })

    const lider = Array.from(mapa.entries()).sort((a, b) => b[1] - a[1])[0]
    return lider ? `${lider[0]} (${FORMATO_MONEDA.format(lider[1])})` : 'Sin datos'
  }, [registrosFiltrados])

  const alertasStock = useMemo(
    () => stockFiltrado.reduce((acum, item) => acum + (item.cantidad < STOCK_CRITICO_UMBRAL ? 1 : 0), 0),
    [stockFiltrado],
  )

  const margenGananciaPromedio = useMemo(() => {
    if (!registrosFiltrados.length) return 0
    return (
      registrosFiltrados.reduce((acum, item) => acum + item.margen, 0) /
      registrosFiltrados.length
    )
  }, [registrosFiltrados])

  const lineasVentasSemana = useMemo(() => {
    const mapa = new Map<string, number>()

    registrosFiltrados.forEach((item) => {
      mapa.set(item.fecha, (mapa.get(item.fecha) ?? 0) + item.ventas)
    })

    return Array.from(mapa.entries())
      .map(([fecha, ventas]) => ({ fecha, ventas }))
      .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
      .slice(-7)
  }, [registrosFiltrados])

  const barrasInventarioSucursal = useMemo(() => {
    const mapa = new Map<string, number>()

    stockFiltrado.forEach((item) => {
      mapa.set(item.sucursal, (mapa.get(item.sucursal) ?? 0) + item.cantidad)
    })

    return Array.from(mapa.entries())
      .map(([sucursal, inventario]) => ({ sucursal, inventario }))
      .sort((a, b) => b.inventario - a.inventario)
      .slice(0, 8)
  }, [stockFiltrado])

  const heatmapChile = useMemo(() => {
    const mapa = new Map<string, Map<string, number>>()

    registrosFiltrados.forEach((item) => {
      const categoriaMap = mapa.get(item.sucursal) ?? new Map<string, number>()
      categoriaMap.set(item.categoria, (categoriaMap.get(item.categoria) ?? 0) + item.ventas)
      mapa.set(item.sucursal, categoriaMap)
    })

    const filas = Array.from(mapa.entries())
      .map(([sucursal, categorias]) => ({
        sucursal,
        valores: categoriasAnalitica.map((categoria) => ({
          categoria,
          valor: categorias.get(categoria) ?? 0,
        })),
      }))
      .sort((a, b) => a.sucursal.localeCompare(b.sucursal, 'es'))

    const maximo = filas.reduce((max, fila) => {
      const local = fila.valores.reduce((m, item) => (item.valor > m ? item.valor : m), 0)
      return local > max ? local : max
    }, 0)

    return { filas, maximo }
  }, [registrosFiltrados, categoriasAnalitica])

  return (
    <section className="pagina-contenido">
      <div className="encabezado-pagina">
        <h2>Módulo de Reportes</h2>
        <p>Panel de gestión, filtros avanzados y visualización analítica</p>
      </div>

      <section className="reportes-kpi-grid">
        {mensajeDatos && <p className="mensaje-error">{mensajeDatos}</p>}
        <article className="reportes-kpi-card">
          <h3>Venta Total Consolidada</h3>
          <p>{FORMATO_MONEDA.format(ventaTotalConsolidada)}</p>
        </article>

        <article className="reportes-kpi-card">
          <h3>Sucursal con Mayor Rendimiento</h3>
          <p>{sucursalMayorRendimiento}</p>
        </article>

        <article className="reportes-kpi-card">
          <h3>Alertas de Stock</h3>
          <p>{alertasStock}</p>
        </article>

        <article className="reportes-kpi-card">
          <h3>Margen de Ganancia</h3>
          <p>{margenGananciaPromedio.toFixed(1)}%</p>
        </article>
      </section>

      <section className="tarjeta-panel">
        <h3>Barra de Filtros Inteligente</h3>
        <div className="reportes-filtros-grid">
          {!sucursalBloqueada && (
            <label>
              Selector de Sucursal
              <select
                value={sucursalFiltro}
                onChange={(evento) => setSucursalFiltro(evento.target.value)}
              >
                {sucursalesOpciones.map((sucursal) => (
                  <option key={sucursal} value={sucursal}>
                    {sucursal}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Rango - Desde
            <input
              type="date"
              value={fechaDesde}
              onChange={(evento) => setFechaDesde(evento.target.value)}
            />
          </label>

          <label>
            Rango - Hasta
            <input
              type="date"
              value={fechaHasta}
              onChange={(evento) => setFechaHasta(evento.target.value)}
            />
          </label>

          <label>
            Categoría de Producto
            <select
              value={categoriaFiltro}
              onChange={(evento) => setCategoriaFiltro(evento.target.value)}
            >
              {categoriasOpciones.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="reportes-graficos-grid">
        <article className="tarjeta-panel">
          <h3>Gráfico de Líneas: evolución de ventas de la semana</h3>
          <div className="contenedor-grafico">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineasVentasSemana}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis tickFormatter={(valor) => FORMATO_COMPACTO.format(Number(valor))} />
                <Tooltip formatter={(valor) => FORMATO_MONEDA.format(Number(valor))} />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="tarjeta-panel">
          <h3>Gráfico de Barras: inventario por sucursal</h3>
          <div className="contenedor-grafico">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barrasInventarioSucursal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sucursal" interval={0} angle={-18} textAnchor="end" height={58} />
                <YAxis tickFormatter={(valor) => FORMATO_COMPACTO.format(Number(valor))} />
                <Tooltip />
                <Bar dataKey="inventario" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {!sucursalBloqueada && categoriasAnalitica.length > 0 && (
        <section className="tarjeta-panel">
          <h3>Mapa de Calor: concentración de ventas en Chile</h3>
          <div className="reportes-heatmap-cabecera">
            <span>Sucursal</span>
            {categoriasAnalitica.map((categoria) => (
              <span key={categoria}>{categoria}</span>
            ))}
          </div>

          <div className="reportes-heatmap-grid">
            {heatmapChile.filas.map((fila) => (
              <div className="reportes-heatmap-row" key={fila.sucursal}>
                <span className="reportes-heatmap-sucursal">{fila.sucursal}</span>
                {fila.valores.map((item) => {
                  const intensidad = heatmapChile.maximo
                    ? item.valor / heatmapChile.maximo
                    : 0

                  return (
                    <span
                      key={`${fila.sucursal}-${item.categoria}`}
                      className="reportes-heatmap-celda"
                      style={{
                        backgroundColor: `rgba(15, 118, 110, ${0.1 + intensidad * 0.85})`,
                      }}
                      title={`${fila.sucursal} - ${item.categoria}: ${FORMATO_MONEDA.format(item.valor)}`}
                    >
                      {FORMATO_COMPACTO.format(item.valor)}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="tarjeta-resumen tarjeta-ancha" style={{ marginTop: '30px' }}>
        <div className="panel-head">
          <h2>Auditoría de Ventas Detallada</h2>
          <span>{ventas.length} movimientos registrados</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>
          Este reporte muestra cada objeto de venta de forma individual, ordenada por fecha y vinculada al empleado responsable.
        </p>

        <div className="tabla-simple" style={{ display: 'grid', gap: '5px' }}>
          <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.5fr 0.8fr 1fr', alignItems: 'center', background: '#f1f5f9', fontWeight: 'bold' }}>
            <span>Sucursal</span>
            <span>Empleado</span>
            <span>Categoría</span>
            <span>Producto</span>
            <span>Cant.</span>
            <span>Precio</span>
          </div>
          {ventas
            .sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime())
            .map((venta, idx) => (
              <div key={venta.id || idx} className="fila" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.5fr 0.8fr 1fr', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                <span>{venta.sucursal}</span>
                <span style={{ color: '#2563eb', fontWeight: '500' }}>{venta.vendedor || 'Admin'}</span>
                <span style={{ fontSize: '0.85rem' }}>{venta.categoria || 'VARIOS'}</span>
                <span>{venta.producto}</span>
                <strong>{venta.cantidad}</strong>
                <span>${venta.precioUnitario?.toLocaleString() || 0}</span>
              </div>
            ))}
          {ventas.length === 0 && (
            <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No hay ventas registradas para auditar.</p>
          )}
        </div>
      </section>

      <section className="tarjeta-resumen tarjeta-ancha" style={{ marginTop: '30px' }}>
        <div className="panel-head">
          <h2>Auditoría de Stock</h2>
          <span>{stock.length} registros de inventario</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>
          Seguimiento detallado de ingresos y existencias por sucursal y empleado responsable.
        </p>

        <div className="tabla-simple" style={{ display: 'grid', gap: '5px' }}>
          <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.5fr 0.8fr 1fr', alignItems: 'center', background: '#f1f5f9', fontWeight: 'bold' }}>
            <span>Sucursal</span>
            <span>Empleado</span>
            <span>Categoría</span>
            <span>Producto</span>
            <span>Stock</span>
            <span>Precio Un.</span>
          </div>
          {stockFiltrado
            .map((item, idx) => (
              <div key={item.id || idx} className="fila" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.5fr 0.8fr 1fr', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                <span>{item.sucursal}</span>
                <span style={{ color: '#0f766e', fontWeight: '500' }}>{item.vendedor || 'Sistema'}</span>
                <span style={{ fontSize: '0.85rem' }}>{item.categoria}</span>
                <span>{item.producto}</span>
                <strong style={{ color: item.cantidad < STOCK_CRITICO_UMBRAL ? '#ef4444' : 'inherit' }}>
                  {item.cantidad}
                </strong>
                <span>${item.precioUnitario?.toLocaleString() || 0}</span>
              </div>
            ))}
          {stockFiltrado.length === 0 && (
            <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No hay registros de stock para mostrar.</p>
          )}
        </div>
      </section>
    </section>
  )
}

export default ReportesPage
