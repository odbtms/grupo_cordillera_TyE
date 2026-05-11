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
          fechaVenta: new Date().toISOString(),
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

      <section className="tarjeta-panel" style={{ marginTop: '30px' }}>
        <h3>Registrar stock</h3>
        <div className="formulario-simple" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <label>
            Categoría
            <select
              value={nuevoStock.categoria}
              onChange={(e) => setNuevoStock({ ...nuevoStock, categoria: e.target.value })}
            >
              <option value="HOGAR">HOGAR</option>
              <option value="ELECTRONICA">ELECTRONICA</option>
              <option value="VARIOS">VARIOS</option>
            </select>
          </label>
          <label>
            Producto
            <input
              type="text"
              placeholder="Nombre del producto"
              value={nuevoStock.producto}
              onChange={(e) => setNuevoStock({ ...nuevoStock, producto: e.target.value })}
            />
          </label>
          <label>
            Cantidad a añadir
            <input
              type="number"
              value={nuevoStock.cantidad}
              onChange={(e) => setNuevoStock({ ...nuevoStock, cantidad: Number(e.target.value) })}
            />
          </label>
          <label>
            Precio Unitario
            <input
              type="number"
              value={nuevoStock.precioUnitario}
              onChange={(e) => setNuevoStock({ ...nuevoStock, precioUnitario: Number(e.target.value) })}
            />
          </label>
        </div>
        <button 
          type="button" 
          onClick={manejarRegistroStock} 
          style={{ marginTop: '15px', width: '100%', background: '#0f766e' }}
        >
          Confirmar ingreso de stock
        </button>
        {mensajeStock && <p style={{ marginTop: '10px', color: mensajeStock.includes('éxito') ? 'green' : 'red' }}>{mensajeStock}</p>}
      </section>

      <section className="tarjeta-panel" style={{ marginTop: '30px' }}>
        <h3>Stock disponible detallado</h3>
        {stock.length === 0 ? (
          <p className="mensaje-demo">No hay stock registrado para esta sucursal.</p>
        ) : (
          <div className="tabla-simple">
            <div className="fila fila-encabezado">
              <span>Categoría</span>
              <span>Producto</span>
              <span>Stock</span>
              <span>Precio Unitario</span>
            </div>
            {stock.map((item) => (
              <div key={item.id} className="fila">
                <span>{item.categoria}</span>
                <span>{item.producto}</span>
                <span>{item.cantidad}</span>
                <strong>${item.precioUnitario?.toLocaleString() || 0}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="bloque">
        <div className="panel-head">
          <h2>Registrar Venta</h2>
          <span>Sucursal actual: {sucursalAsignada}</span>
        </div>
        
        <div className="formulario-simple" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <label>
              Sistema origen
              <select
                value={nuevaVenta.sistemaOrigen}
                onChange={(e) => setNuevaVenta(a => ({ ...a, sistemaOrigen: e.target.value }))}
              >
                <option value="POS">POS</option>
                <option value="WEB">WEB</option>
                <option value="APP">APP</option>
              </select>
            </label>

            <label>
              Filtrar Categoría
              <select
                value={nuevaVenta.categoria}
                onChange={(e) => setNuevaVenta(a => ({ ...a, categoria: e.target.value, producto: '', precioUnitario: 0 }))}
              >
                <option value="TODOS">TODOS</option>
                <option value="ELECTRONICA">ELECTRÓNICA</option>
                <option value="HOGAR">HOGAR</option>
              </select>
            </label>

            <label>
              Producto
              <select
                value={nuevaVenta.producto}
                onChange={(e) => {
                  const prod = e.target.value;
                  const info = stock.find(s => s.producto === prod);
                  const precio = info?.precioUnitario || 0;
                  setNuevaVenta(a => ({ ...a, producto: prod, precioUnitario: precio, montoTotal: precio * a.cantidad }));
                }}
              >
                <option value="">Seleccione Producto</option>
                {stock
                  .filter(s => nuevaVenta.categoria === 'TODOS' || s.categoria.toUpperCase() === nuevaVenta.categoria)
                  .map(s => (
                    <option key={s.id} value={s.producto}>{s.producto} (Stock: {s.cantidad})</option>
                  ))
                }
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <label>
              Cantidad
              <input
                type="number"
                min={1}
                value={nuevaVenta.cantidad}
                onChange={(e) => {
                  const cant = Number(e.target.value);
                  setNuevaVenta(a => ({ ...a, cantidad: cant, montoTotal: cant * a.precioUnitario }));
                }}
              />
            </label>
            <label>
              Precio Unitario
              <input type="number" value={nuevaVenta.precioUnitario} disabled />
            </label>
            <label>
              Subtotal
              <input type="number" value={nuevaVenta.montoTotal} disabled />
            </label>
          </div>

          <button 
            type="button" 
            onClick={agregarAlVenta}
            style={{ width: '100%', marginTop: '15px', background: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Añadir a venta
          </button>
        </div>

        {carrito.length > 0 && (
          <div className="tabla-simple" style={{ marginTop: '20px', border: '1px solid #cbd5e1' }}>
            <div className="panel-head" style={{ padding: '10px', background: '#f1f5f9' }}>
              <h4 style={{ margin: 0 }}>Ventas en total</h4>
            </div>
            <div className="fila fila-encabezado">
              <span>Producto</span>
              <span>Cant</span>
              <span>Subtotal</span>
            </div>
            {carrito.map((item, idx) => (
              <div key={idx} className="fila">
                <span>{item.producto}</span>
                <span>{item.cantidad}</span>
                <span>${item.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div className="fila" style={{ fontWeight: 'bold', background: '#f8fafc' }}>
              <span>TOTAL</span>
              <span>-</span>
              <span>${carrito.reduce((acc, i) => acc + i.subtotal, 0).toLocaleString()}</span>
            </div>
            <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
              <button onClick={procesarVentaCompleta} style={{ flex: 2, background: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                Confirmar Venta
              </button>
              <button onClick={() => setCarrito([])} style={{ flex: 1, background: '#64748b', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {mensajeVenta && <p style={{ color: mensajeVenta.includes('éxito') ? 'green' : 'red', marginTop: '10px' }}>{mensajeVenta}</p>}
      </section>
    </section>
  )
}

export default EmpleadoDashboardPage
