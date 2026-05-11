import { useEffect, useMemo, useState } from 'react'
import { obtenerStock, obtenerVentasPorSucursal } from '../api'
import type { StockItem, Venta } from '../types'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FORMATO_MONEDA, FORMATO_COMPACTO, normalizarTexto } from '../utils/formatters'

type EmpleadoDashboardPageProps = {
  sucursalAsignada: string
}

function EmpleadoDashboardPage({
  sucursalAsignada,
}: EmpleadoDashboardPageProps) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [alertas, setAlertas] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensajeError, setMensajeError] = useState('')
  const [periodoAnalisis, setPeriodoAnalisis] = useState('GENERAL')

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)
      setMensajeError('')

      try {
        const [ventasSucursal, stockSucursal] = await Promise.all([
          obtenerVentasPorSucursal(sucursalAsignada),
          obtenerStock(sucursalAsignada),
        ])

        setVentas(ventasSucursal)
        setStock(stockSucursal)
        setAlertas([])
      } catch {
        setVentas([])
        setStock([])
        setAlertas([])
        setMensajeError('No se pudo conectar con backend o cargar los datos.')
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [sucursalAsignada])

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

  const ventasAnalisis = useMemo(() => {
    if (periodoAnalisis === 'GENERAL') {
      return resumenSucursalActiva.total
    }

    const datoMes = serieSucursalActiva.find((item) => item.periodo === periodoAnalisis)
    return datoMes?.total ?? 0
  }, [periodoAnalisis, resumenSucursalActiva, serieSucursalActiva])




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


        </div>


      </section>

      <section className="tarjeta-panel">
        <h3>Stock disponible detallado</h3>
        {stock.length === 0 ? (
          <p className="mensaje-demo">No hay stock registrado para esta sucursal.</p>
        ) : (
          <div className="tabla-simple">
            <div className="fila fila-encabezado">
              <span>Categoría</span>
              <span>Producto</span>
              <span>Stock</span>
              <span>Precio</span>
            </div>
            {stock.map((item) => (
              <div key={item.id} className="fila">
                <span>{item.categoria}</span>
                <span>{item.producto}</span>
                <span>{item.cantidad}</span>
                <span>${item.precioUnitario?.toLocaleString() || 0}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default EmpleadoDashboardPage
