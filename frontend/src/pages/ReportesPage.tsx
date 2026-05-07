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
  createPlantillaReporte,
  eliminarPlantillaReporte,
  fetchPlantillasReporte,
  fetchStock,
  fetchVentas,
  fetchVentasPorSucursal,
  type PlantillaReporte,
} from '../api'
import type { StockItem, Venta } from '../types'

const TAMANO_PAGINA = 5

const FORMATO_MONEDA = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const FORMATO_COMPACTO = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

type RegistroAnalitico = {
  fecha: string
  sucursal: string
  categoria: string
  ventas: number
  inventario: number
  stockCritico: number
  margen: number
}

const STOCK_CRITICO_UMBRAL = 10

function fechaTexto(fecha: Date) {
  return fecha.toISOString().slice(0, 10)
}

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}


function descargarComoTexto(nombreArchivo: string, contenido: string) {
  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(blob)
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

type ReportesPageProps = {
  rol?: string
  sucursalAsignada?: string | null
}

function ReportesPage({ rol, sucursalAsignada }: ReportesPageProps) {
  const [titulo, setTitulo] = useState('')
  const [configuracionVisual, setConfiguracionVisual] = useState('')
  const [plantillas, setPlantillas] = useState<PlantillaReporte[]>([])
  const [paginaActual, setPaginaActual] = useState(1)
  const [mensajePlantilla, setMensajePlantilla] = useState('')

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
    async function cargarPlantillas() {
      try {
        const lista = await fetchPlantillasReporte()
        setPlantillas(lista)
      } catch {
        setMensajePlantilla('No se pudo cargar el listado desde ms-reportes.')
      }
    }

    cargarPlantillas()
  }, [])

  useEffect(() => {
    async function cargarDatos() {
      setMensajeDatos('')
      const esEmpleadoTienda = (rol ?? '').toUpperCase() === 'EMPLEADO_TIENDA'
      const sucursal = sucursalAsignada ?? ''

      try {
        if (esEmpleadoTienda && sucursal) {
          const [ventasSucursal, stockSucursal] = await Promise.all([
            fetchVentasPorSucursal(sucursal),
            fetchStock(sucursal),
          ])
          setVentas(ventasSucursal)
          setStock(stockSucursal)
        } else {
          const [ventasFull, stockFull] = await Promise.all([
            fetchVentas(),
            fetchStock(),
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

  const plantillasVisibles = useMemo(() => {
    if (!sucursalBloqueada || !sucursalAsignada) return plantillas
    return plantillas.filter((p) => p.titulo?.includes(`[${sucursalAsignada}]`))
  }, [plantillas, sucursalBloqueada, sucursalAsignada])

  const totalPaginas = Math.max(1, Math.ceil(plantillasVisibles.length / TAMANO_PAGINA))

  const plantillasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * TAMANO_PAGINA
    return plantillasVisibles.slice(inicio, inicio + TAMANO_PAGINA)
  }, [paginaActual, plantillasVisibles])

  async function crearPlantilla() {
    setMensajePlantilla('')

    if (!titulo.trim() || !configuracionVisual.trim()) {
      setMensajePlantilla('Debe completar título y configuración visual.')
      return
    }

    const tituloFinal = sucursalBloqueada && sucursalAsignada
      ? `[${sucursalAsignada}] ${titulo.trim()}`
      : titulo.trim()

    try {
      const creada = await createPlantillaReporte({
        titulo: tituloFinal,
        configuracionVisual: configuracionVisual.trim(),
        estado: 'Activo',
      })

      setPlantillas((actual) => [creada, ...actual])
      setTitulo('')
      setConfiguracionVisual('')
      setPaginaActual(1)
      setMensajePlantilla('Plantilla creada correctamente.')
    } catch {
      setMensajePlantilla('No fue posible crear la plantilla en ms-reportes.')
    }
  }

  async function eliminarPlantilla(id: number) {
    try {
      await eliminarPlantillaReporte(id)
    } catch {
    }

    setPlantillas((actual) => actual.filter((item) => item.id !== id))
  }

  function exportarPDF() {
    const contenido = JSON.stringify(plantillas, null, 2)
    descargarComoTexto('reportes.pdf', contenido)
  }

  function exportarExcel() {
    const cabecera = 'id,titulo,configuracionVisual,estado\n'
    const filas = plantillas
      .map(
        (item) =>
          `${item.id},"${item.titulo}","${item.configuracionVisual}",${item.estado}`,
      )
      .join('\n')

    descargarComoTexto('reportes.csv', cabecera + filas)
  }

  return (
    <section className="pagina-contenido">
      <div className="encabezado-pagina">
        <h2>Módulo de Reportes</h2>
        <p>Panel ejecutivo, filtros avanzados y visualización analítica</p>
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

      <section className="tarjeta-panel">
        <h3>Nueva plantilla</h3>
        <div className="formulario-simple">
          <label>
            Título
            <input
              type="text"
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
            />
          </label>

          <label>
            Configuración visual
            <input
              type="text"
              value={configuracionVisual}
              onChange={(evento) => setConfiguracionVisual(evento.target.value)}
            />
          </label>

          <button type="button" onClick={crearPlantilla}>
            Crear plantilla
          </button>
        </div>

        {mensajePlantilla && <p>{mensajePlantilla}</p>}
      </section>

      <section className="tarjeta-panel">
        <div className="fila-acciones">
          <h3>Listado de reportes</h3>
          <div>
            <button type="button" onClick={exportarPDF}>
              Descargar PDF
            </button>
            <button type="button" onClick={exportarExcel}>
              Descargar Excel
            </button>
          </div>
        </div>

        <div className="tabla-simple">
          <div className="fila fila-encabezado">
            <span>Título</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {plantillasPaginadas.map((plantilla) => (
            <div className="fila" key={plantilla.id}>
              <span>{plantilla.titulo}</span>
              <span>{plantilla.estado}</span>
              <span>
                <button type="button" onClick={() => eliminarPlantilla(plantilla.id)}>
                  Eliminar
                </button>
              </span>
            </div>
          ))}
          {plantillasPaginadas.length === 0 && <p>No hay plantillas creadas aún.</p>}
        </div>

        <div className="paginacion">
          <button
            type="button"
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((valor) => Math.max(1, valor - 1))}
          >
            Anterior
          </button>
          <span>
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            type="button"
            disabled={paginaActual === totalPaginas}
            onClick={() => setPaginaActual((valor) => Math.min(totalPaginas, valor + 1))}
          >
            Siguiente
          </button>
        </div>
      </section>
    </section>
  )
}

export default ReportesPage
