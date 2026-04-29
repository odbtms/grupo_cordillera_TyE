import { useEffect, useMemo, useState } from 'react'
import { fetchDashboard } from '../api'
import type { Venta } from '../types'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DASHBOARD_DEMO } from '../demoData'
import { obtenerDetalleStock } from '../utils/stockUtils'

const FORMATO_MONEDA = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const FORMATO_COMPACTO = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

type EmpleadoDashboardPageProps = {
  sucursalAsignada: string
}

function EmpleadoDashboardPage({
  sucursalAsignada,
}: EmpleadoDashboardPageProps) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [alertas, setAlertas] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensajeError, setMensajeError] = useState('')
  const [periodoAnalisis, setPeriodoAnalisis] = useState('GENERAL')

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)
      setMensajeError('')

      try {
        const respuesta = await fetchDashboard()
        const mergedVentas = [...DASHBOARD_DEMO.ventas, ...(respuesta.ventas || [])]

        setVentas(mergedVentas)
        setAlertas(respuesta.alertas)
      } catch {
        setVentas(DASHBOARD_DEMO.ventas)
        setAlertas(DASHBOARD_DEMO.alertas)
        setMensajeError('No se pudo conectar con backend o cargar los datos. Mostrando demo.')
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  const serieSucursalActiva = useMemo(() => {
    const sucursalObjetivo = normalizarTexto(sucursalAsignada)

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
  }, [sucursalAsignada, ventas])

  const resumenSucursalActiva = useMemo(() => {
    const total = serieSucursalActiva.reduce((acum, item) => acum + item.total, 0)
    const promedioMensual = serieSucursalActiva.length
      ? total / serieSucursalActiva.length
      : 0
    const registros = ventas.filter((item) => normalizarTexto(item.sucursal) === normalizarTexto(sucursalAsignada)).length

    return {
      total,
      promedioMensual,
      registros,
    }
  }, [serieSucursalActiva, sucursalAsignada, ventas])

  const periodosAnalisisDisponibles = useMemo(
    () => serieSucursalActiva.map((item) => item.periodo),
    [serieSucursalActiva],
  )

  const detalleFiltrado = useMemo(() => {
    return obtenerDetalleStock(
      sucursalAsignada,
      periodoAnalisis,
      periodosAnalisisDisponibles,
    )
  }, [sucursalAsignada, periodoAnalisis, periodosAnalisisDisponibles])

  const ventasAnalisis = useMemo(() => {
    if (periodoAnalisis === 'GENERAL') {
      return resumenSucursalActiva.total
    }

    const datoMes = serieSucursalActiva.find((item) => item.periodo === periodoAnalisis)
    return datoMes?.total ?? 0
  }, [periodoAnalisis, resumenSucursalActiva, serieSucursalActiva])

  const stockVendidoAnalisis = useMemo(
    () => detalleFiltrado.reduce((acum, item) => acum + item.vendidos, 0),
    [detalleFiltrado],
  )

  const productoMasVendido = useMemo(() => {
    if (!detalleFiltrado.length) return null

    return detalleFiltrado.reduce((maximo, actual) =>
      actual.vendidos > maximo.vendidos ? actual : maximo,
    )
  }, [detalleFiltrado])

  const stockPorCategoria = useMemo(() => {
    return {
      electronica: detalleFiltrado
        .filter((item) => item.categoria === 'Electrónica')
        .reduce((acum, item) => acum + item.stockRestante, 0),
      hogar: detalleFiltrado
        .filter((item) => item.categoria === 'Hogar')
        .reduce((acum, item) => acum + item.stockRestante, 0),
    }
  }, [detalleFiltrado])

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
        <h2>Dashboard de Sucursal</h2>
        <p>Rendimiento comercial y stock de {sucursalAsignada}</p>
      </div>

      {cargando && <p>Cargando información...</p>}
      {mensajeError && <p className="mensaje-error">{mensajeError}</p>}
      {!mensajeError && alertas.length > 0 && <p className="mensaje-demo">{alertas[0]}</p>}

      <section className="tarjeta-panel">
        <div className="encabezado-mini-sucursales">
          <h3>Rendimiento (últimos 6 meses)</h3>
        </div>

        <p className="mensaje-demo">
          Puedes revisar el rendimiento general de {sucursalAsignada} o seleccionar un mes puntual haciendo click en el gráfico.
        </p>

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
        <h3>Resumen operativo</h3>

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

        <div className="rejilla-kpi">
          <article className="tarjeta-kpi">
            <h3>{periodoAnalisis === 'GENERAL' ? 'Ventas 6 meses' : 'Ventas del mes'}</h3>
            <p>{FORMATO_MONEDA.format(ventasAnalisis)}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Stock vendido</h3>
            <p>{stockVendidoAnalisis}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Producto más vendido</h3>
            <p>{productoMasVendido?.producto ?? '-'}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Stock actual (ref.)</h3>
            <p>{stockPorCategoria.electronica + stockPorCategoria.hogar}</p>
          </article>
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

export default EmpleadoDashboardPage
