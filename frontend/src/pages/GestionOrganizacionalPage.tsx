import { useEffect, useMemo, useState } from 'react'
import { actualizarFormulaKpi, obtenerKpis, obtenerVentas, registrarVenta, registrarUsuario, upsertStock, registrarSucursal, obtenerSucursalesMaster, obtenerStock } from '../api'
import type { Kpi, Venta, StockItem } from '../types'

type Sucursal = {
  nombre: string
  metaVenta: number
}

function GestionOrganizacionalPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [inventarioFull, setInventarioFull] = useState<StockItem[]>([])
  const [mensaje, setMensaje] = useState('')
  const [mensajeKpi, setMensajeKpi] = useState('')
  const [mensajeVenta, setMensajeVenta] = useState('')

  const [nuevaVenta, setNuevaVenta] = useState({
    montoTotal: 0,
    sistemaOrigen: 'POS',
    sucursal: '',
    categoria: 'TODOS',
    producto: '',
    cantidad: 1,
    precioUnitario: 0,
  })

  const [kpiSeleccionadoId, setKpiSeleccionadoId] = useState<number | null>(null)
  const [nuevaFormula, setNuevaFormula] = useState('')

  // Sistema de Carrito para Ventas
  const [carrito, setCarrito] = useState<Array<{
    producto: string
    cantidad: number
    precioUnitario: number
    subtotal: number
    categoria: string
  }>>([])

  // Estado para creación de empleado
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    username: '',
    email: '',
    password: '',
    sucursalAsignada: '',
  })
  const [mensajeEmpleado, setMensajeEmpleado] = useState('')

  const [nuevoStock, setNuevoStock] = useState({
    sucursal: '',
    categoria: 'ELECTRONICA',
    producto: '',
    cantidad: 0,
    precioUnitario: 0,
  })
  const [mensajeStock, setMensajeStock] = useState('')

  const [nuevaSucursal, setNuevaSucursal] = useState({
    nombre: '',
    ubicacion: '',
    metaVenta: 0
  })
  const [mensajeSucursal, setMensajeSucursal] = useState('')

  useEffect(() => {
    async function cargarSucursales() {
      setMensaje('')
      try {
        const [listaVentas, listaKpis, listaSucursales, listaStock] = await Promise.all([
          obtenerVentas(),
          obtenerKpis(),
          obtenerSucursalesMaster(),
          obtenerStock()
        ])
        setVentas(listaVentas)
        setKpis(listaKpis)
        setInventarioFull(listaStock)

        setSucursales(
          listaSucursales.map((s: any) => ({
            nombre: s.nombre,
            metaVenta: s.metaVenta || 0,
          }))
        )
      } catch {
        setMensaje('No se pudo obtener la informacion desde el servidor.')
      }
    }

    cargarSucursales()
  }, [])

  const resumenVentas = useMemo(() => {
    const mapa = new Map<string, number>()

    for (const venta of ventas) {
      mapa.set(venta.sucursal, (mapa.get(venta.sucursal) ?? 0) + venta.montoTotal)
    }

    return mapa
  }, [ventas])

  function actualizarMeta(indice: number, nuevoValor: string) {
    const meta = Number(nuevoValor)
    setSucursales((actual) =>
      actual.map((item, idx) =>
        idx === indice
          ? {
            ...item,
            metaVenta: Number.isNaN(meta) ? 0 : meta,
          }
          : item,
      ),
    )
  }

  async function guardarCambios() {
    const existeMetaInvalida = sucursales.some(
      (item) => !item.nombre.trim() || item.metaVenta <= 0,
    )

    if (existeMetaInvalida) {
      setMensaje('Todos los campos deben ser válidos y metas mayores a cero.')
      return
    }

    try {
      // Usar el nuevo endpoint de metas en ms-datos
      await Promise.all(
        sucursales.map((item) =>
          registrarSucursal({ nombre: item.nombre, metaVenta: item.metaVenta })
        )
      )
      setMensaje('Cambios guardados exitosamente.')
    } catch {
      setMensaje('Error al guardar las metas.')
    }
  }

  async function crearSucursal() {
    setMensajeSucursal('')
    if (!nuevaSucursal.nombre.trim()) {
      setMensajeSucursal('El nombre de la sucursal es obligatorio.')
      return
    }

    try {
      await registrarSucursal(nuevaSucursal)
      setNuevaSucursal({ nombre: '', ubicacion: '', metaVenta: 0 })
      setMensajeSucursal('Sucursal registrada correctamente.')
      // Recargar lista
      const lista = await obtenerSucursalesMaster()
      setSucursales(lista.map((s: any) => ({ nombre: s.nombre, metaVenta: s.metaVenta || 0 })))
    } catch {
      setMensajeSucursal('Error al registrar la sucursal.')
    }
  }

  function agregarAlCarrito() {
    if (!nuevaVenta.producto || nuevaVenta.cantidad <= 0) {
      setMensajeVenta('Seleccione producto y cantidad válida.')
      return
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
    
    // Limpiar campos de producto para el siguiente
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
    if (carrito.length === 0) {
      setMensajeVenta('El carrito está vacío.')
      return
    }

    try {
      // Registrar cada item del carrito como una venta
      await Promise.all(carrito.map(item => 
        registrarVenta({
          fechaVenta: new Date().toISOString(),
          montoTotal: item.subtotal,
          sistemaOrigen: nuevaVenta.sistemaOrigen.trim() || 'POS',
          sucursal: nuevaVenta.sucursal.trim(),
          producto: item.producto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })
      ))

      const [listaVentas, listaStock] = await Promise.all([obtenerVentas(), obtenerStock()])
      setVentas(listaVentas)
      setInventarioFull(listaStock)
      
      setCarrito([])
      setNuevaVenta({ 
        montoTotal: 0, 
        sistemaOrigen: 'POS', 
        sucursal: '', 
        categoria: 'TODOS', 
        producto: '', 
        cantidad: 1, 
        precioUnitario: 0 
      })
      setMensajeVenta('Venta completa registrada con éxito. Inventario actualizado.')
    } catch {
      setMensajeVenta('Error al procesar uno o más productos de la venta.')
    }
  }

  async function guardarFormulaKpi() {
    setMensajeKpi('')

    if (!kpiSeleccionadoId || !nuevaFormula.trim()) {
      setMensajeKpi('Debe seleccionar un KPI e ingresar una fórmula.')
      return
    }

    try {
      await actualizarFormulaKpi(kpiSeleccionadoId, nuevaFormula.trim())
      const lista = await obtenerKpis()
      setKpis(lista)
      setNuevaFormula('')
      setMensajeKpi('Fórmula de KPI actualizada correctamente.')
    } catch {
      setMensajeKpi('No fue posible actualizar la fórmula en ms-kpis.')
    }
  }

  async function crearEmpleado() {
    setMensajeEmpleado('')
    const { username, email, password, sucursalAsignada } = nuevoEmpleado

    if (!username.trim() || !email.trim() || !password || !sucursalAsignada.trim()) {
      setMensajeEmpleado('Todos los campos son obligatorios.')
      return
    }

    try {
      await registrarUsuario({
        username: username.trim(),
        email: email.trim(),
        password,
        rol: 'EMPLEADO_TIENDA',
        sucursal: sucursalAsignada.trim()
      })

      setNuevoEmpleado({
        username: '',
        email: '',
        password: '',
        sucursalAsignada: '',
      })

      setMensajeEmpleado(`Empleado ${username} creado exitosamente en la base de datos (ms-auth).`)
    } catch {
      setMensajeEmpleado('Hubo un error al guardar el empleado en ms-auth.')
    }
  }

  async function guardarStock() {
    setMensajeStock('')

    if (!nuevoStock.sucursal.trim() || !nuevoStock.producto.trim() || nuevoStock.cantidad < 0) {
      setMensajeStock('Sucursal, producto y cantidad son obligatorios.')
      return
    }

    try {
      await upsertStock({
        sucursal: nuevoStock.sucursal.trim(),
        categoria: nuevoStock.categoria,
        producto: nuevoStock.producto.trim(),
        cantidad: nuevoStock.cantidad,
        precioUnitario: nuevoStock.precioUnitario,
      })

      const listaStock = await obtenerStock()
      setInventarioFull(listaStock)
      setNuevoStock({
        sucursal: '',
        categoria: 'ELECTRONICA',
        producto: '',
        cantidad: 0,
        precioUnitario: 0,
      })

      setMensajeStock('Stock guardado correctamente.')
    } catch {
      setMensajeStock('No fue posible guardar el stock en ms-datos.')
    }
  }

  return (
    <section className="pagina-contenido">
      <div className="encabezado-pagina">
        <h2>Gestión Organizacional</h2>
        <p>Mantenimiento de sucursales, metas y parámetros del sistema</p>
      </div>

      <section className="tarjeta-panel">
        <h3>Registro de Nueva Sucursal</h3>
        <div className="formulario-simple">
          <label>
            Nombre de Sucursal
            <input
              type="text"
              placeholder="Ej: Santiago Centro"
              value={nuevaSucursal.nombre}
              onChange={(e) => setNuevaSucursal({ ...nuevaSucursal, nombre: e.target.value })}
            />
          </label>
          <button type="button" onClick={crearSucursal}>Registrar Sucursal</button>
        </div>
        {mensajeSucursal && <p>{mensajeSucursal}</p>}
      </section>

      <section className="tarjeta-panel">
        <h3>Metas de Venta por Sucursal</h3>
        <div className="tabla-simple">
          <div className="fila fila-encabezado">
            <span>Sucursal</span>
            <span>Ventas acumuladas</span>
            <span>Meta de venta</span>
          </div>

          {sucursales.map((sucursal, indice) => (
            <div key={sucursal.nombre} className="fila">
              <span>{sucursal.nombre}</span>
              <span>{resumenVentas.get(sucursal.nombre) ?? 0}</span>
              <span>
                <input
                  type="number"
                  min={1}
                  value={sucursal.metaVenta}
                  onChange={(evento) => actualizarMeta(indice, evento.target.value)}
                />
              </span>
            </div>
          ))}
          {sucursales.length === 0 && <p>No hay sucursales registradas.</p>}
        </div>

        <button type="button" onClick={guardarCambios}>
          Guardar Metas
        </button>
        {mensaje && <p>{mensaje}</p>}
      </section>

      <section className="tarjeta-panel">
        <h3>Registrar Venta</h3>
        <div className="formulario-simple">
          <label>
            Sucursal
            <select
              value={nuevaVenta.sucursal}
              onChange={(evento) =>
                setNuevaVenta((actual) => ({ ...actual, sucursal: evento.target.value, producto: '', precioUnitario: 0, montoTotal: 0 }))
              }
            >
              <option value="">Seleccione Sucursal</option>
              {sucursales.map(s => (
                <option key={s.nombre} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            Sistema origen
            <select
              value={nuevaVenta.sistemaOrigen}
              onChange={(evento) =>
                setNuevaVenta((actual) => ({ ...actual, sistemaOrigen: evento.target.value }))
              }
            >
              <option value="POS">POS</option>
              <option value="WEB">WEB</option>
              <option value="APP">APP</option>
            </select>
          </label>

          <label>
            Filtrar por Categoría
            <select
              value={nuevaVenta.categoria}
              onChange={(evento) =>
                setNuevaVenta((actual) => ({ ...actual, categoria: evento.target.value, producto: '', precioUnitario: 0, montoTotal: 0 }))
              }
            >
              <option value="TODOS">TODOS LOS PRODUCTOS</option>
              <option value="ELECTRONICA">ELECTRÓNICA</option>
              <option value="HOGAR">HOGAR</option>
            </select>
          </label>

          <label>
            Producto (con Stock)
            <select
              value={nuevaVenta.producto}
              onChange={(evento) => {
                const prodNombre = evento.target.value;
                const normalizar = (t: string) => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                const sucursalActual = normalizar(nuevaVenta.sucursal);
                const infoStock = inventarioFull.find(i =>
                  normalizar(i.sucursal) === sucursalActual &&
                  normalizar(i.producto) === normalizar(prodNombre)
                );

                const precio = infoStock?.precioUnitario || 0;
                setNuevaVenta((actual) => ({
                  ...actual,
                  producto: prodNombre,
                  precioUnitario: precio,
                  montoTotal: actual.cantidad * precio
                }))
              }}
              disabled={!nuevaVenta.sucursal}
            >
              <option value="">{nuevaVenta.sucursal ? 'Seleccione Producto' : 'Elija primero sucursal'}</option>
              {inventarioFull
                .filter(i => {
                  const normalizar = (t: string) => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const matchesSucursal = normalizar(i.sucursal) === normalizar(nuevaVenta.sucursal);
                  const matchesCategoria = nuevaVenta.categoria === 'TODOS' || i.categoria.toUpperCase() === nuevaVenta.categoria;
                  return matchesSucursal && matchesCategoria && i.cantidad > 0;
                })
                .map(i => (
                  <option key={i.id} value={i.producto}>{i.producto} (Stock: {i.cantidad})</option>
                ))
              }
            </select>
          </label>

          <label>
            Cantidad
            <input
              type="number"
              min={1}
              value={nuevaVenta.cantidad}
              onChange={(evento) => {
                const cant = Number(evento.target.value);
                setNuevaVenta((actual) => ({
                  ...actual,
                  cantidad: cant,
                  montoTotal: cant * actual.precioUnitario
                }))
              }}
            />
          </label>

          <label>
            Precio Unitario
            <input
              type="number"
              disabled
              value={nuevaVenta.precioUnitario}
            />
          </label>

          <label>
            Monto total (Calculado)
            <input
              type="number"
              disabled
              value={nuevaVenta.montoTotal}
            />
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={agregarAlCarrito} style={{ flex: 1, background: '#4CAF50' }}>
              + Añadir al Carrito
            </button>
          </div>
        </div>

        {carrito.length > 0 && (
          <div className="tabla-simple" style={{ marginTop: 20, border: '1px solid #ddd', padding: '10px' }}>
            <h4>Carrito de Ventas</h4>
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
            <div className="fila" style={{ borderTop: '2px solid #333', fontWeight: 'bold' }}>
              <span>TOTAL VENTA</span>
              <span>-</span>
              <span>${carrito.reduce((acc, i) => acc + i.subtotal, 0).toLocaleString()}</span>
            </div>
            <button 
              type="button" 
              onClick={procesarVentaCompleta} 
              style={{ width: '100%', marginTop: '10px', background: '#2196F3', color: 'white' }}
            >
              Confirmar y Registrar Venta Completa
            </button>
            <button 
              type="button" 
              onClick={() => setCarrito([])}
              style={{ width: '100%', marginTop: '5px', background: '#f44336', color: 'white', fontSize: '12px' }}
            >
              Vaciar Carrito
            </button>
          </div>
        )}

        {mensajeVenta && <p style={{ color: mensajeVenta.includes('éxito') ? 'green' : 'red' }}>{mensajeVenta}</p>}
      </section>

      <section className="tarjeta-panel">
        <h3>Actualizar KPI</h3>
        <div className="formulario-simple">
          <label>
            KPI
            <select
              value={kpiSeleccionadoId ?? ''}
              onChange={(evento) => setKpiSeleccionadoId(Number(evento.target.value))}
            >
              <option value="">Seleccione un KPI</option>
              {kpis.map((kpi) => (
                <option key={kpi.id} value={kpi.id}>
                  {kpi.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nueva fórmula
            <input
              type="text"
              value={nuevaFormula}
              onChange={(evento) => setNuevaFormula(evento.target.value)}
            />
          </label>

          <button type="button" onClick={guardarFormulaKpi}>
            Guardar fórmula
          </button>
        </div>

        <div className="tabla-simple" style={{ marginTop: 20 }}>
          <div className="fila fila-encabezado">
            <span>KPI</span>
            <span>Fórmula</span>
            <span>Meta</span>
          </div>
          {kpis.map(kpi => (
            <div key={kpi.id} className="fila">
              <span>{kpi.nombre}</span>
              <span><code>{kpi.formula}</code></span>
              <span>{kpi.meta}</span>
            </div>
          ))}
        </div>

        {mensajeKpi && <p>{mensajeKpi}</p>}
      </section>

      <section className="tarjeta-panel">
        <h3>Crear Empleado</h3>
        <p className="mensaje-demo">
          Crea credenciales para que un empleado inicie sesión y visualice solamente su sucursal.
        </p>
        <div className="formulario-simple">
          <label>
            Usuario
            <input
              type="text"
              placeholder="Ej: empleado.valpo"
              value={nuevoEmpleado.username}
              onChange={(e) =>
                setNuevoEmpleado((actual) => ({ ...actual, username: e.target.value }))
              }
            />
          </label>

          <label>
            Correo Electrónico
            <input
              type="email"
              placeholder="Ej: empleado@tienda.cl"
              value={nuevoEmpleado.email}
              onChange={(e) =>
                setNuevoEmpleado((actual) => ({ ...actual, email: e.target.value }))
              }
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={nuevoEmpleado.password}
              onChange={(e) =>
                setNuevoEmpleado((actual) => ({ ...actual, password: e.target.value }))
              }
            />
          </label>

          <label>
            Sucursal asignada
            <select
              value={nuevoEmpleado.sucursalAsignada}
              onChange={(e) =>
                setNuevoEmpleado((actual) => ({ ...actual, sucursalAsignada: e.target.value }))
              }
            >
              <option value="">Seleccione Sucursal</option>
              {sucursales.map(s => (
                <option key={s.nombre} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>
          </label>

          <button type="button" onClick={crearEmpleado}>
            Registrar Empleado
          </button>
        </div>
        {mensajeEmpleado && <p className="mensaje-demo" style={{ marginTop: 12 }}>{mensajeEmpleado}</p>}
      </section>

      <section className="tarjeta-panel">
        <h3>Registrar stock por sucursal</h3>
        <p className="mensaje-demo">
          Guarda stock real para cada sucursal y categoría (Electrónica/Hogar).
        </p>
        <div className="formulario-simple">
          <label>
            Sucursal
            <select
              value={nuevoStock.sucursal}
              onChange={(e) =>
                setNuevoStock((actual) => ({ ...actual, sucursal: e.target.value }))
              }
            >
              <option value="">Seleccione Sucursal</option>
              {sucursales.map(s => (
                <option key={s.nombre} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            Categoría
            <select
              value={nuevoStock.categoria}
              onChange={(e) =>
                setNuevoStock((actual) => ({ ...actual, categoria: e.target.value }))
              }
            >
              <option value="ELECTRONICA">ELECTRONICA</option>
              <option value="HOGAR">HOGAR</option>
            </select>
          </label>

          <label>
            Producto
            <input
              type="text"
              placeholder="Ej: Audífonos"
              value={nuevoStock.producto}
              onChange={(e) =>
                setNuevoStock((actual) => ({ ...actual, producto: e.target.value }))
              }
            />
          </label>

          <label>
            Cantidad
            <input
              type="number"
              min={0}
              value={nuevoStock.cantidad}
              onChange={(e) =>
                setNuevoStock((actual) => ({ ...actual, cantidad: Number(e.target.value) }))
              }
            />
          </label>

          <label>
            Precio Unitario
            <input
              type="number"
              min={0}
              value={nuevoStock.precioUnitario}
              onChange={(e) =>
                setNuevoStock((actual) => ({ ...actual, precioUnitario: Number(e.target.value) }))
              }
            />
          </label>

          <button type="button" onClick={guardarStock}>
            Guardar Stock
          </button>
        </div>
        {mensajeStock && <p className="mensaje-demo" style={{ marginTop: 12 }}>{mensajeStock}</p>}
      </section>
    </section>
  )
}

export default GestionOrganizacionalPage
