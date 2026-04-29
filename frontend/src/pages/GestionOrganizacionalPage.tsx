import { useEffect, useMemo, useState } from 'react'
import { actualizarFormulaKpi, fetchKpis, fetchVentas, registrarVenta } from '../api'
import { SUCURSALES_DEMO } from '../demoData'
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

  // Estado para creación de empleado local
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombreCompleto: '',
    edad: '',
    username: '',
    password: '',
    sucursalAsignada: '',
  })
  const [mensajeEmpleado, setMensajeEmpleado] = useState('')

  useEffect(() => {
    async function cargarSucursales() {
      setMensaje('')
      try {
        const [listaVentas, listaKpis] = await Promise.all([fetchVentas(), fetchKpis()])
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
        metaVenta: 1000000,
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

    setMensaje('Cambios validados. (Demo académica sin endpoint PUT de sucursal)')
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

      const listaActualizada = await fetchVentas()
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
      const lista = await fetchKpis()
      setKpis(lista)
      setNuevaFormula('')
      setMensajeKpi('Fórmula de KPI actualizada correctamente.')
    } catch {
      setMensajeKpi('No fue posible actualizar la fórmula en ms-kpis.')
    }
  }

  function crearEmpleado() {
    setMensajeEmpleado('')
    const { nombreCompleto, edad, username, password, sucursalAsignada } = nuevoEmpleado

    if (!nombreCompleto.trim() || !edad || !username.trim() || !password || !sucursalAsignada) {
      setMensajeEmpleado('Todos los campos son obligatorios.')
      return
    }

    const edadNum = Number(edad)
    if (Number.isNaN(edadNum) || edadNum < 18) {
      setMensajeEmpleado('La edad debe ser un número válido mayor o igual a 18.')
      return
    }

    try {
      const dbStr = localStorage.getItem('cordillera_mock_users')
      const db = dbStr ? JSON.parse(dbStr) : []
      
      const existe = db.find((u: any) => u.username === username.trim())
      if (existe) {
        setMensajeEmpleado('Ya existe un usuario con ese nombre de usuario.')
        return
      }

      db.push({
        nombreCompleto: nombreCompleto.trim(),
        edad: edadNum,
        username: username.trim(),
        password,
        rol: 'EMPLEADO_TIENDA',
        sucursalAsignada: sucursalAsignada.trim(),
      })

      localStorage.setItem('cordillera_mock_users', JSON.stringify(db))
      
      setNuevoEmpleado({
        nombreCompleto: '',
        edad: '',
        username: '',
        password: '',
        sucursalAsignada: '',
      })
      
      setMensajeEmpleado(`Empleado ${username} creado exitosamente.`)
    } catch {
      setMensajeEmpleado('Hubo un error al guardar el empleado localmente.')
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
        <h3>Crear Empleado (Acceso Local)</h3>
        <p className="mensaje-demo">
          Crea credenciales para que un empleado inicie sesión y visualice su sucursal.
        </p>
        <div className="formulario-simple">
          <label>
            Nombre completo
            <input
              type="text"
              value={nuevoEmpleado.nombreCompleto}
              onChange={(e) =>
                setNuevoEmpleado((actual) => ({ ...actual, nombreCompleto: e.target.value }))
              }
            />
          </label>

          <label>
            Edad
            <input
              type="number"
              min={18}
              value={nuevoEmpleado.edad}
              onChange={(e) =>
                setNuevoEmpleado((actual) => ({ ...actual, edad: e.target.value }))
              }
            />
          </label>

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
              <option value="">Seleccione una sucursal</option>
              {SUCURSALES_DEMO.map((s) => (
                <option key={s.sucursal} value={s.sucursal}>
                  {s.sucursal}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={crearEmpleado}>
            Registrar Empleado
          </button>
        </div>
        {mensajeEmpleado && <p className="mensaje-demo" style={{ marginTop: 12 }}>{mensajeEmpleado}</p>}
      </section>
    </section>
  )
}

export default GestionOrganizacionalPage
