import { useEffect, useMemo, useState } from 'react'
import { actualizarFormulaKpi, obtenerKpis, obtenerVentas, registrarVenta, registrarUsuario, upsertStock, registrarSucursal, obtenerSucursalesMaster, obtenerStock } from '../api'
import type { Kpi, Venta, StockItem } from '../types'
import {
  AdminFormularioVenta,
  FormularioNuevoEmpleado,
  FormularioNuevaSucursal,
  TablaMetasSucursalAdmin,
  GestorInventarioAdmin,
  GestorFormulasKpiAdmin
} from '../components'

type Sucursal = {
  nombre: string
  metaVenta: number
}

type GestionOrganizacionalPageProps = {
  nombreUsuario?: string
}

function GestionOrganizacionalPage({ nombreUsuario = 'ADMIN' }: GestionOrganizacionalPageProps) {
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

  const cargarTodo = async () => {
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

  useEffect(() => {
    cargarTodo()
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

    // Validación de stock disponible
    const normalizar = (t: string) => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const sucursalActual = normalizar(nuevaVenta.sucursal);
    const itemStock = inventarioFull.find(i => 
      normalizar(i.sucursal) === sucursalActual && 
      normalizar(i.producto) === normalizar(nuevaVenta.producto)
    );

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
          vendedor: nombreUsuario,
          categoria: item.categoria,
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
      setMensajeVenta('Venta registrada con éxito. Stock actualizado.')

      await cargarTodo()
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
        vendedor: 'ADMIN',
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

      <FormularioNuevaSucursal 
        nuevaSucursal={nuevaSucursal}
        setNuevaSucursal={setNuevaSucursal}
        crearSucursal={crearSucursal}
        mensajeSucursal={mensajeSucursal}
      />

      <TablaMetasSucursalAdmin 
        sucursales={sucursales}
        resumenVentas={resumenVentas}
        actualizarMeta={actualizarMeta}
        guardarCambios={guardarCambios}
        mensaje={mensaje}
      />

      <AdminFormularioVenta 
        nuevaVenta={nuevaVenta}
        setNuevaVenta={setNuevaVenta}
        sucursales={sucursales}
        inventarioFull={inventarioFull}
        carrito={carrito}
        setCarrito={setCarrito}
        agregarAlCarrito={agregarAlCarrito}
        procesarVentaCompleta={procesarVentaCompleta}
        mensajeVenta={mensajeVenta}
      />

      <GestorFormulasKpiAdmin 
        kpiSeleccionadoId={kpiSeleccionadoId}
        setKpiSeleccionadoId={setKpiSeleccionadoId}
        kpis={kpis}
        nuevaFormula={nuevaFormula}
        setNuevaFormula={setNuevaFormula}
        guardarFormulaKpi={guardarFormulaKpi}
        mensajeKpi={mensajeKpi}
      />

      <FormularioNuevoEmpleado 
        nuevoEmpleado={nuevoEmpleado}
        setNuevoEmpleado={setNuevoEmpleado}
        sucursales={sucursales}
        crearEmpleado={crearEmpleado}
        mensajeEmpleado={mensajeEmpleado}
      />

      <GestorInventarioAdmin 
        nuevoStock={nuevoStock}
        setNuevoStock={setNuevoStock}
        sucursales={sucursales}
        guardarStock={guardarStock}
        mensajeStock={mensajeStock}
      />
    </section>
  )
}

export default GestionOrganizacionalPage
