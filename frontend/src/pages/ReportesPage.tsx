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
  type PlantillaReporte,
} from '../api'

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

const SUCURSALES_ANALITICA = [
  'Santiago Centro',
  'Providencia',
  'Las Condes',
  'Puente Alto',
  'Maipú',
  'Concepción',
  'Viña del Mar',
  'Temuco',
  'Antofagasta',
  'La Serena',
  'Puerto Montt',
  'Rancagua',
]

const CATEGORIAS_ANALITICA = ['Electrónica', 'Hogar', 'Logística', 'Ventas']

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

function generarDatosAnaliticosDemo(): RegistroAnalitico[] {
  const hoy = new Date()
  const dias = 45
  const datos: RegistroAnalitico[] = []

  for (let d = 0; d < dias; d += 1) {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() - (dias - 1 - d))

    const factorDia = 0.86 + ((d % 10) - 4) * 0.025

    SUCURSALES_ANALITICA.forEach((sucursal, idxSucursal) => {
      CATEGORIAS_ANALITICA.forEach((categoria, idxCategoria) => {
        const factorSucursal = 1 + (idxSucursal % 5) * 0.065
        const factorCategoria = 0.88 + idxCategoria * 0.1
        const onda = 1 + Math.sin((d + 1) * (idxSucursal + 2) * 0.17) * 0.08

        const ventas = Math.round(
          390000 * factorDia * factorSucursal * factorCategoria * onda,
        )

        const inventarioBase =
          2200 - d * 8 + idxSucursal * 35 - idxCategoria * 70 + ((d + idxSucursal) % 6) * 42
        const inventario = Math.max(220, Math.round(inventarioBase))

        const stockCritico = inventario < 520 ? Math.max(1, Math.round((520 - inventario) / 55)) : 0

        const margenRaw =
          18 +
          (idxSucursal % 6) * 1.4 +
          idxCategoria * 2.1 +
          Math.sin((d + 2) * (idxSucursal + 1) * 0.11) * 1.8

        datos.push({
          fecha: fechaTexto(fecha),
          sucursal,
          categoria,
          ventas,
          inventario,
          stockCritico,
          margen: Number(Math.max(9, Math.min(42, margenRaw)).toFixed(1)),
        })
      })
    })
  }

  return datos
}

const DATOS_ANALITICA_DEMO = generarDatosAnaliticosDemo()

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

  const esEmpleadoTienda = (rol ?? '').toUpperCase() === 'EMPLEADO_TIENDA'
  const sucursalBloqueada = esEmpleadoTienda && Boolean(sucursalAsignada)

  const sucursalesOpciones = useMemo(
    () => ['Todas', ...SUCURSALES_ANALITICA],
    [],
  )

  const categoriasOpciones = useMemo(
    () => ['Todas', ...CATEGORIAS_ANALITICA],
    [],
  )

  const registrosFiltrados = useMemo(() => {
    const asignadaNorm = sucursalAsignada ? normalizarTexto(sucursalAsignada) : null
    const filtroNorm = normalizarTexto(sucursalFiltro)

    return DATOS_ANALITICA_DEMO.filter((item) => {
      const sucursalItemNorm = normalizarTexto(item.sucursal)

      if (sucursalBloqueada && asignadaNorm && sucursalItemNorm !== asignadaNorm) return false
      if (!sucursalBloqueada && sucursalFiltro !== 'Todas' && sucursalItemNorm !== filtroNorm) return false
      if (categoriaFiltro !== 'Todas' && item.categoria !== categoriaFiltro) return false
      if (fechaDesde && item.fecha < fechaDesde) return false
      if (fechaHasta && item.fecha > fechaHasta) return false
      return true
    })
  }, [categoriaFiltro, fechaDesde, fechaHasta, sucursalFiltro, sucursalBloqueada, sucursalAsignada])

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
    () => registrosFiltrados.reduce((acum, item) => acum + item.stockCritico, 0),
    [registrosFiltrados],
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

    registrosFiltrados.forEach((item) => {
      mapa.set(item.sucursal, (mapa.get(item.sucursal) ?? 0) + item.inventario)
    })

    return Array.from(mapa.entries())
      .map(([sucursal, inventario]) => ({ sucursal, inventario }))
      .sort((a, b) => b.inventario - a.inventario)
      .slice(0, 8)
  }, [registrosFiltrados])

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
        valores: CATEGORIAS_ANALITICA.map((categoria) => ({
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
  }, [registrosFiltrados])

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

    const plantillaLocal: PlantillaReporte = {
      id: Date.now(),
      titulo: tituloFinal,
      configuracionVisual: configuracionVisual.trim(),
      estado: 'Activo',
    }

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
      setPlantillas((actual) => [plantillaLocal, ...actual])
      setTitulo('')
      setConfiguracionVisual('')
      setPaginaActual(1)
      setMensajePlantilla('ms-reportes no responde. Plantilla guardada en modo local.')
    }
  }

  async function eliminarPlantilla(id: number) {
    try {
      await eliminarPlantillaReporte(id)
    } catch {
      // Si backend no encuentra el id local, mantenemos borrado local para demo académica
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

      {!sucursalBloqueada && (
        <section className="tarjeta-panel">
          <h3>Mapa de Calor: concentración de ventas en Chile</h3>
          <div className="reportes-heatmap-cabecera">
            <span>Sucursal</span>
            {CATEGORIAS_ANALITICA.map((categoria) => (
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
