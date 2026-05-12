import { useEffect, useMemo, useState } from 'react'
import {
  crearPlantillaReporte,
  obtenerPlantillasReporte,
  eliminarPlantillaReporte,
  obtenerStock,
  obtenerVentas,
  type PlantillaReporte,
} from '../api'
import type { StockItem, Venta } from '../types'
import { FORMATO_MONEDA } from '../utils/formatters'
import GrillaKpiAdmin from '../components/admin/GrillaKpiAdmin'
import ListaRankingSucursales from '../components/admin/ListaRankingSucursales'
import GraficosAdmin from '../components/admin/GraficosAdmin'
import FilaAuditoriaReporte from '../components/admin/FilaAuditoriaReporte'

type ReportesPageProps = {
  rol?: string
  sucursalAsignada?: string | null
}

function ReportesPage({ rol, sucursalAsignada }: ReportesPageProps) {
  const [plantillas, setPlantillas] = useState<PlantillaReporte[]>([])
  const [idPlantillaExpandida, setIdPlantillaExpandida] = useState<number | null>(null)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [modalConfig, setModalConfig] = useState<{ visible: boolean, tipo: 'info' | 'confirm' | 'error', mensaje: string, onConfirm?: () => void }>({ visible: false, tipo: 'info', mensaje: '' })

  const mostrarMensaje = (mensaje: string, tipo: 'info' | 'error' = 'info') => {
    setModalConfig({ visible: true, tipo, mensaje })
  }

  const mostrarConfirmacion = (mensaje: string, onConfirm: () => void) => {
    setModalConfig({ visible: true, tipo: 'confirm', mensaje, onConfirm })
  }

  const cerrarModal = () => {
    setModalConfig({ ...modalConfig, visible: false })
  }

  const esAdmin = (rol ?? '').toUpperCase() === 'ADMIN'

  useEffect(() => {
    async function cargarTodo() {
      try {
        const [listaPlantillas, listaVentas, listaStock] = await Promise.all([
          obtenerPlantillasReporte(),
          obtenerVentas(),
          obtenerStock(),
        ])
        setPlantillas(listaPlantillas.sort((a, b) => (b.id || 0) - (a.id || 0)))
        setVentas(listaVentas)
        setStock(listaStock)
      } catch {
        console.error('Error al cargar datos')
      }
    }
    cargarTodo()
  }, [])

  // --- LOGICA DE ANALITICA (SOLO ADMIN) ---
  const analiticaSucursales = useMemo(() => {
    const mapa = new Map<string, number>()
    ventas.forEach(v => {
      const actual = mapa.get(v.sucursal) ?? 0
      mapa.set(v.sucursal, actual + (v.montoTotal || 0))
    })
    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [ventas])

  const ventaTotalGlobal = useMemo(() => analiticaSucursales.reduce((acc, i) => acc + i.value, 0), [analiticaSucursales])

  const analiticaCategorias = useMemo(() => {
    const mapa = new Map<string, number>()
    ventas.forEach(v => {
      const cat = (v.categoria || '').toUpperCase()
      if (cat === 'HOGAR' || cat === 'ELECTRONICA' || cat === 'ELECTRÓNICA') {
        const nombreLimpio = cat === 'ELECTRÓNICA' ? 'ELECTRONICA' : cat
        const actual = mapa.get(nombreLimpio) ?? 0
        mapa.set(nombreLimpio, actual + (v.montoTotal || 0))
      }
    })
    return Array.from(mapa.entries()).map(([name, value]) => ({ name, value }))
  }, [ventas])

  const analiticaStockSucursales = useMemo(() => {
    const mapa = new Map<string, number>()
    stock.forEach(s => {
      const actual = mapa.get(s.sucursal) ?? 0
      mapa.set(s.sucursal, actual + (s.cantidad || 0))
    })
    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [stock])

  const sucursalTop = useMemo(() => analiticaSucursales[0] || { name: '-', value: 0 }, [analiticaSucursales])

  const ultimoReporte = useMemo(() => {
    return plantillas
      .filter(p => p.titulo === `Reporte Sucursal ${sucursalAsignada}` && p.estado.includes('T'))
      .sort((a, b) => new Date(b.estado).getTime() - new Date(a.estado).getTime())[0]
  }, [plantillas, sucursalAsignada])

  // --- FUNCION DE ENVIO ---
  async function enviarReporteDiario() {
    try {
      const isoEstado = new Date().toISOString()
      
      await crearPlantillaReporte({
        titulo: `Reporte Sucursal ${sucursalAsignada}`,
        estado: isoEstado
      })
      
      mostrarMensaje(`Reporte de ${sucursalAsignada} enviado con éxito al administrador.`)
      
      const lista = await obtenerPlantillasReporte()
      setPlantillas(lista.sort((a, b) => (b.id || 0) - (a.id || 0)))
    } catch {
      mostrarMensaje('Error al enviar el reporte. Intente nuevamente.', 'error')
    }
  }

  // --- FILTROS PARA EL EMPLEADO ---
  const ventasEmpleado = useMemo(() => {
    return ventas.filter(v => {
      if (v.sucursal !== sucursalAsignada) return false;
      if (!ultimoReporte) return true;
      let date;
      if (Array.isArray(v.fechaVenta) && v.fechaVenta.length >= 3) {
        date = new Date(v.fechaVenta[0], v.fechaVenta[1] - 1, v.fechaVenta[2], v.fechaVenta[3] || 0, v.fechaVenta[4] || 0, v.fechaVenta[5] || 0);
      } else {
        date = new Date(v.fechaVenta);
      }
      if (isNaN(date.getTime())) return true;
      return date.getTime() > new Date(ultimoReporte.estado).getTime();
    });
  }, [ventas, sucursalAsignada, ultimoReporte])

  const stockEmpleado = useMemo(() => {
    return stock.filter(s => {
      if (s.sucursal !== sucursalAsignada) return false;
      if (!ultimoReporte) return true;
      let date;
      if (Array.isArray(s.fechaRegistro) && s.fechaRegistro.length >= 3) {
        date = new Date(s.fechaRegistro[0], s.fechaRegistro[1] - 1, s.fechaRegistro[2], s.fechaRegistro[3] || 0, s.fechaRegistro[4] || 0, s.fechaRegistro[5] || 0);
      } else {
        date = new Date(s.fechaRegistro || '');
      }
      if (isNaN(date.getTime())) return true;
      return date.getTime() > new Date(ultimoReporte.estado).getTime();
    });
  }, [stock, sucursalAsignada, ultimoReporte])

  // --- FUNCION DE ELIMINACION (ADMIN) ---
  async function manejarEliminarReporte(id: number | undefined) {
    if (!id) return;
    mostrarConfirmacion('¿Está seguro de que desea eliminar este reporte de forma permanente?', async () => {
      try {
        await eliminarPlantillaReporte(id);
        const lista = await obtenerPlantillasReporte();
        setPlantillas(lista.sort((a, b) => (b.id || 0) - (a.id || 0)));
        if (idPlantillaExpandida === id) setIdPlantillaExpandida(null);
        cerrarModal();
      } catch (error) {
        mostrarMensaje('Error al eliminar el reporte.', 'error');
      }
    });
  }

  const RenderModal = () => {
    if (!modalConfig.visible) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', minWidth: '300px', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: modalConfig.tipo === 'error' ? '#ef4444' : '#0f766e' }}>
            {modalConfig.tipo === 'confirm' ? 'Confirmación' : modalConfig.tipo === 'error' ? 'Error' : 'Notificación'}
          </h3>
          <p style={{ marginBottom: '25px', color: '#334155' }}>{modalConfig.mensaje}</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            {modalConfig.tipo === 'confirm' && (
              <button onClick={cerrarModal} style={{ padding: '8px 16px', background: '#94a3b8', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
            )}
            <button 
              onClick={() => {
                if (modalConfig.tipo === 'confirm' && modalConfig.onConfirm) {
                  modalConfig.onConfirm();
                } else {
                  cerrarModal();
                }
              }} 
              style={{ padding: '8px 16px', background: modalConfig.tipo === 'error' ? '#ef4444' : '#0f766e', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- COLORES PARA GRAFICOS ---
  const COLORES = ['#0f766e', '#2563eb', '#7c3aed', '#db2777', '#ea580c']

  // VISTA PARA EL ADMINISTRADOR
  if (esAdmin) {
    return (
      <section className="pagina-contenido">
        <div className="encabezado-pagina">
          <h2>Análisis de Rendimiento y Reportes</h2>
          <p>Visión global del desempeño de sucursales y auditoría de envíos</p>
        </div>

        {/* Componente extraído de KPIs Rápidos */}
        <GrillaKpiAdmin ventaTotalGlobal={ventaTotalGlobal} sucursalTop={sucursalTop} />

        {/* --- SECCION DE GRAFICOS Y DESEMPEÑO --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px', marginBottom: '30px' }}>
          
          {/* Componente extraído de Ranking de Sucursales */}
          <ListaRankingSucursales 
            analiticaSucursales={analiticaSucursales} 
            sucursalTop={sucursalTop} 
            colores={COLORES} 
          />

          <GraficosAdmin 
            analiticaStockSucursales={analiticaStockSucursales}
            analiticaCategorias={analiticaCategorias}
            colores={COLORES}
          />
        </div>

        {/* --- LISTADO DE REPORTES RECIBIDOS (ACORDEONES) --- */}
        <section className="tarjeta-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Listado de Reportes Recibidos</h3>
            <span className="badge-info">{plantillas.length} reportes</span>
          </div>
          
          <div className="tabla-simple">
            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#f1f5f9' }}>
              <span>Sucursal</span>
              <span>Fecha Envío</span>
              <span style={{ textAlign: 'center' }}>Acción</span>
            </div>

            {plantillas.map((p) => (
              <FilaAuditoriaReporte
                key={p.id}
                reporte={p}
                isExpandido={idPlantillaExpandida === p.id}
                onToggle={() => setIdPlantillaExpandida(idPlantillaExpandida === p.id ? null : (p.id || null))}
                onEliminar={manejarEliminarReporte}
                ventas={ventas}
                stock={stock}
                plantillas={plantillas}
              />
            ))}
          </div>
        </section>
        {RenderModal()}
      </section>
    )
  }

  // VISTA PARA EL EMPLEADO (AUDITORÍA LOCAL + BOTÓN ENVIAR)
  return (
    <section className="pagina-contenido">
      <div className="encabezado-pagina" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Auditoría de Sucursal - {sucursalAsignada}</h2>
          <p>Monitoreo de movimientos diarios y envío de reportes</p>
        </div>
        <button 
          onClick={enviarReporteDiario}
          style={{ background: '#0f766e', padding: '12px 24px', fontSize: '1.1rem', fontWeight: 'bold' }}
        >
          ENVIAR REPORTE AL ADMIN
        </button>
      </div>

      <div style={{ display: 'grid', gap: '30px', marginTop: '30px' }}>
        <section className="tarjeta-panel">
          <h3 style={{ color: '#2563eb', marginBottom: '15px' }}>Auditoría de Ventas Detallada</h3>
          <div className="tabla-simple">
            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
              <span>Empleado</span>
              <span>Categoría</span>
              <span>Producto</span>
              <span>Cant.</span>
              <span>Precio Unitario</span>
              <span>Venta Total</span>
            </div>
            {ventasEmpleado
              .sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime())
              .map((v, i) => (
                <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{v.vendedor || 'Admin'}</span>
                  <span>{v.categoria || 'VARIOS'}</span>
                  <span>{v.producto}</span>
                  <strong>{v.cantidad}</strong>
                  <span>{FORMATO_MONEDA.format(v.precioUnitario || 0)}</span>
                  <span style={{ fontWeight: 'bold', color: '#0f766e' }}>{FORMATO_MONEDA.format((v.precioUnitario || 0) * (v.cantidad || 0))}</span>
                </div>
              ))}
          </div>
        </section>

        <section className="tarjeta-panel">
          <h3 style={{ color: '#0f766e', marginBottom: '15px' }}>Auditoría de Stock (Ingresos)</h3>
          <div className="tabla-simple">
            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr' }}>
              <span>Empleado</span>
              <span>Categoría</span>
              <span>Producto</span>
              <span>Stock</span>
              <span>Precio Unitario</span>
            </div>
            {stockEmpleado
              .map((s, i) => (
                <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr' }}>
                  <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{s.vendedor || 'Sistema'}</span>
                  <span>{s.categoria}</span>
                  <span>{s.producto}</span>
                  <strong>{s.cantidad}</strong>
                  <span>{FORMATO_MONEDA.format(s.precioUnitario || 0)}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
      {RenderModal()}
    </section>
  )
}

export default ReportesPage
