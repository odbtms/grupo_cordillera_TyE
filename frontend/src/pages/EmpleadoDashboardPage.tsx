import { useEffect, useMemo, useState } from 'react'
import { obtenerStock, obtenerVentasPorSucursal, registrarVenta, upsertStock } from '../api'
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

import FormularioVenta from '../components/empleado/FormularioVenta'
import FormularioStock from '../components/empleado/FormularioStock'
import TablaStock from '../components/empleado/TablaStock'

type EmpleadoDashboardPageProps = {
  sucursalAsignada: string
  nombreUsuario: string
}

function EmpleadoDashboardPage({
  sucursalAsignada,
  nombreUsuario,
}: EmpleadoDashboardPageProps) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [alertas, setAlertas] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensajeError, setMensajeError] = useState('')
  const [periodoAnalisis, setPeriodoAnalisis] = useState('GENERAL')

  // Estado para registro de ventas (Empleado)
  const [nuevaVenta, setNuevaVenta] = useState({
    montoTotal: 0,
    sistemaOrigen: 'POS',
    categoria: 'TODOS',
    producto: '',
    cantidad: 1,
    precioUnitario: 0,
  })

  const [carrito, setCarrito] = useState<Array<{
    producto: string
    cantidad: number
    precioUnitario: number
    subtotal: number
    categoria: string
  }>>([])

  const [mensajeVenta, setMensajeVenta] = useState('')

  const [nuevoStock, setNuevoStock] = useState({
    categoria: 'HOGAR',
    producto: '',
    cantidad: 0,
    precioUnitario: 0,
  })
  const [mensajeStock, setMensajeStock] = useState('')

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

  useEffect(() => {
    cargarDatos()
  }, [sucursalAsignada])

  function agregarAlVenta() {
    if (!nuevaVenta.producto || nuevaVenta.cantidad <= 0) {
      setMensajeVenta('Seleccione producto y cantidad válida.')
      return
    }

    // Validación de stock disponible localmente
    const normalizar = (t: string) => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const itemStock = stock.find(i => normalizar(i.producto) === normalizar(nuevaVenta.producto));
    const stockDisponible = itemStock?.cantidad || 0;

    if (nuevaVenta.cantidad > stockDisponible) {
      setMensajeVenta(`Solamente queda ${stockDisponible} stock de este producto.`);
      return;
    }

    setCarrito(actual => [
      ...actual,
      {
        producto: nuevaVenta.producto,
        cantidad: nuevaVenta.cantidad,
        precioUnitario: nuevaVenta.precioUnitario,
        subtotal: nuevaVenta.montoTotal,
        categoria: nuevaVenta.categoria
      }
    ])

    setNuevaVenta(actual => ({
      ...actual,
      producto: '',
      precioUnitario: 0,
      montoTotal: 0,
      cantidad: 1
    }))
    setMensajeVenta('')
  }

  async function procesarVentaCompleta() {
    if (carrito.length === 0) return

    try {
      await Promise.all(carrito.map(item => 
        registrarVenta({
          montoTotal: item.subtotal,
          sistemaOrigen: nuevaVenta.sistemaOrigen,
          sucursal: sucursalAsignada,
          vendedor: nombreUsuario,
          categoria: item.categoria,
          producto: item.producto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })
      ))

      setCarrito([])
      setMensajeVenta('Venta registrada con éxito. Stock actualizado.')
      
      await cargarDatos(); // Recargar stock y ventas
    } catch {
      setMensajeVenta('Error al procesar la venta.')
    }
  }

  async function manejarRegistroStock() {
    setMensajeStock('')
    if (!nuevoStock.producto.trim() || nuevoStock.cantidad <= 0) {
      setMensajeStock('Complete producto y cantidad correctamente.')
      return
    }

    try {
      await upsertStock({
        sucursal: sucursalAsignada,
        categoria: nuevoStock.categoria,
        producto: nuevoStock.producto,
        cantidad: nuevoStock.cantidad,
        precioUnitario: nuevoStock.precioUnitario,
        vendedor: nombreUsuario,
        fechaRegistro: new Date().toISOString(),
      })
      setMensajeStock('Stock registrado con éxito.')
      setNuevoStock({
        categoria: 'HOGAR',
        producto: '',
        cantidad: 0,
        precioUnitario: 0,
      })
      await cargarDatos() // Actualiza el dashboard
    } catch {
      setMensajeStock('Error al registrar el stock.')
    }
  }

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
      {!mensajeError && alertas.length > 0 && <p className="mensaje">{alertas[0]}</p>}

      <section className="tarjeta-panel">
        <div className="encabezado-mini-sucursales">
          <h3>Rendimiento (últimos 6 meses)</h3>
        </div>

        <p className="mensaje">
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
              className="input-bonito"
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

      {/* Formulario para que el empleado agregue una venta al carrito */}
      <FormularioVenta 
        sucursalAsignada={sucursalAsignada}
        nuevaVenta={nuevaVenta}
        setNuevaVenta={setNuevaVenta}
        stock={stock}
        carrito={carrito}
        setCarrito={setCarrito}
        mensajeVenta={mensajeVenta}
        agregarAlVenta={agregarAlVenta}
        procesarVentaCompleta={procesarVentaCompleta}
      />

      {/* Formulario para ingresar nuevo inventario a la sucursal actual */}
      <FormularioStock 
        nuevoStock={nuevoStock}
        setNuevoStock={setNuevoStock}
        manejarRegistroStock={manejarRegistroStock}
        mensajeStock={mensajeStock}
      />

      {/* Tabla que despliega todo el stock filtrado de la sucursal */}
      <TablaStock
        stock={stock}
        onEditar={async (item, cambios) => {
          await upsertStock({
            sucursal: sucursalAsignada,
            categoria: item.categoria,
            producto: cambios.producto,
            cantidad: cambios.cantidad,
            precioUnitario: cambios.precioUnitario,
            vendedor: nombreUsuario,
            fechaRegistro: new Date().toISOString(),
          })
          await cargarDatos()
        }}
      />

    </section>
  )
}

export default EmpleadoDashboardPage
