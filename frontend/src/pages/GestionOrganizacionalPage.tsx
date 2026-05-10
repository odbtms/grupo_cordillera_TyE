import { useEffect, useMemo, useState } from 'react'
import { actualizarFormulaKpi, obtenerKpis, obtenerVentas, registrarVenta, registrarUsuario, upsertStock } from '../api'
import type { Kpi, Venta } from '../types'

type Sucursal = {
  nombre: string
  metaVenta: number
}

function GestionOrganizacionalPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [mensaje, setMensaje] = useState('')
  const [mensajeKpi, setMensajeKpi] = useState('')
  const [mensajeVenta, setMensajeVenta] = useState('')

  const [nuevaVenta, setNuevaVenta] = useState({
    montoTotal: 0,
    sistemaOrigen: 'POS',
    sucursal: '',
  })

  const [kpiSeleccionadoId, setKpiSeleccionadoId] = useState<number | null>(null)
  const [nuevaFormula, setNuevaFormula] = useState('')

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
    categoria: 'Electrónica',
    producto: '',
    cantidad: 0,
  })
  const [mensajeStock, setMensajeStock] = useState('')

  useEffect(() => {
    async function cargarSucursales() {
      setMensaje('')
      try {
        const [listaVentas, listaKpis] = await Promise.all([obtenerVentas(), obtenerKpis()])
        setVentas(listaVentas)
        setKpis(listaKpis)
      } catch {
        setMensaje('No se pudo obtener información desde ms-datos.')
      }
    }

    cargarSucursales()
  }, [])

  useEffect(() => {
    if (!ventas.length) return

    const unicas = Array.from(new Set(ventas.map((item) => item.sucursal))).sort()
    setSucursales(
      unicas.map((nombre) => ({
        nombre,
        metaVenta: 0,
      })),
    )
  }, [ventas])

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

  function guardarCambios() {
    const existeMetaInvalida = sucursales.some(
      (item) => !item.nombre.trim() || item.metaVenta <= 0,
    )

    if (existeMetaInvalida) {
      setMensaje('Todos los campos deben ser válidos y metas mayores a cero.')
      return
    }

    setMensaje('Cambios locales validados.')
  }

  async function crearVenta() {
    setMensajeVenta('')

    if (!nuevaVenta.sucursal.trim() || nuevaVenta.montoTotal <= 0) {
      setMensajeVenta('Debe indicar sucursal y un monto mayor a cero.')
      return
    }

    try {
      await registrarVenta({
        fechaVenta: new Date().toISOString(),
        montoTotal: nuevaVenta.montoTotal,
        sistemaOrigen: nuevaVenta.sistemaOrigen.trim() || 'POS',
        sucursal: nuevaVenta.sucursal.trim(),
      })

      const listaActualizada = await obtenerVentas()
      setVentas(listaActualizada)
      setNuevaVenta({ montoTotal: 0, sistemaOrigen: 'POS', sucursal: '' })
      setMensajeVenta('Venta registrada correctamente en ms-datos.')
    } catch {
      setMensajeVenta('No fue posible registrar la venta en ms-datos.')
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
      })

      setNuevoStock({
        sucursal: '',
        categoria: 'Electrónica',
        producto: '',
        cantidad: 0,
      })

      setMensajeStock('Stock guardado correctamente en ms-datos.')
    } catch {
      setMensajeStock('No fue posible guardar el stock en ms-datos.')
    }
  }

  return (
    <section className="pagina-contenido">
      <div className="encabezado-pagina">
        <h2>Gestión Organizacional</h2>
        <p>Mantenimiento básico de sucursales y metas</p>
      </div>

      <section className="tarjeta-panel">
        <h3>CRUD de Sucursales (metas)</h3>
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
        </div>

        <button type="button" onClick={guardarCambios}>
          Guardar cambios
        </button>
        {mensaje && <p>{mensaje}</p>}
      </section>

      <section className="tarjeta-panel">
        <h3>Registrar venta (POST ms-datos)</h3>
        <div className="formulario-simple">
          <label>
            Sucursal
            <input
              type="text"
              value={nuevaVenta.sucursal}
              onChange={(evento) =>
                setNuevaVenta((actual) => ({ ...actual, sucursal: evento.target.value }))
              }
            />
          </label>

          <label>
            Sistema origen
            <input
              type="text"
              value={nuevaVenta.sistemaOrigen}
              onChange={(evento) =>
                setNuevaVenta((actual) => ({ ...actual, sistemaOrigen: evento.target.value }))
              }
            />
          </label>

          <label>
            Monto total
            <input
              type="number"
              min={1}
              value={nuevaVenta.montoTotal}
              onChange={(evento) =>
                setNuevaVenta((actual) => ({
                  ...actual,
                  montoTotal: Number(evento.target.value),
                }))
              }
            />
          </label>

          <button type="button" onClick={crearVenta}>
            Registrar venta
          </button>
        </div>
        {mensajeVenta && <p>{mensajeVenta}</p>}
      </section>

      <section className="tarjeta-panel">
        <h3>Actualizar KPI (PUT ms-kpis)</h3>
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

        {mensajeKpi && <p>{mensajeKpi}</p>}
      </section>

      <section className="tarjeta-panel">
        <h3>Crear Empleado (ms-auth)</h3>
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
            <input
              type="text"
              placeholder="Ej: Santiago"
              value={nuevoEmpleado.sucursalAsignada}
              onChange={(e) =>
                setNuevoEmpleado((actual) => ({ ...actual, sucursalAsignada: e.target.value }))
              }
            />
          </label>

          <button type="button" onClick={crearEmpleado}>
            Registrar Empleado
          </button>
        </div>
        {mensajeEmpleado && <p className="mensaje-demo" style={{ marginTop: 12 }}>{mensajeEmpleado}</p>}
      </section>

      <section className="tarjeta-panel">
        <h3>Registrar stock por sucursal (ms-datos)</h3>
        <p className="mensaje-demo">
          Guarda stock real para cada sucursal y categoría (Electrónica/Hogar).
        </p>
        <div className="formulario-simple">
          <label>
            Sucursal
            <input
              type="text"
              placeholder="Ej: Santiago"
              value={nuevoStock.sucursal}
              onChange={(e) =>
                setNuevoStock((actual) => ({ ...actual, sucursal: e.target.value }))
              }
            />
          </label>

          <label>
            Categoría
            <select
              value={nuevoStock.categoria}
              onChange={(e) =>
                setNuevoStock((actual) => ({ ...actual, categoria: e.target.value }))
              }
            >
              <option value="Electrónica">Electrónica</option>
              <option value="Hogar">Hogar</option>
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
