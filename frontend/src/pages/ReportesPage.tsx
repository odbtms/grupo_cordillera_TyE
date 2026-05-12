import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
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

type ReportesPageProps = {
  rol?: string
  sucursalAsignada?: string | null
}

function ReportesPage({ rol, sucursalAsignada }: ReportesPageProps) {
  const [plantillas, setPlantillas] = useState<PlantillaReporte[]>([])
  const [idPlantillaExpandida, setIdPlantillaExpandida] = useState<number | null>(null)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [stock, setStock] = useState<StockItem[]>([])

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

  // --- FUNCION DE ENVIO ---
  async function enviarReporteDiario() {
    try {
      const hoy = new Date()
      const diaMes = `${String(hoy.getDate()).padStart(2, '0')}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
      
      await crearPlantillaReporte({
        titulo: `Reporte Sucursal ${sucursalAsignada}`,
        estado: diaMes
      })
      
      alert(`Reporte de ${sucursalAsignada} enviado con éxito al administrador.`)
      
      // Limpiar las tablas para el empleado en la sesión actual
      setVentas(prev => prev.filter(v => v.sucursal !== sucursalAsignada))
      setStock(prev => prev.filter(s => s.sucursal !== sucursalAsignada))

      const lista = await obtenerPlantillasReporte()
      setPlantillas(lista.sort((a, b) => (b.id || 0) - (a.id || 0)))
    } catch {
      alert('Error al enviar el reporte. Intente nuevamente.')
    }
  }

  // --- FUNCION DE ELIMINACION (ADMIN) ---
  async function manejarEliminarReporte(id: number | undefined) {
    if (!id) return;
    if (confirm('¿Está seguro de que desea eliminar este reporte de forma permanente?')) {
      try {
        await eliminarPlantillaReporte(id);
        const lista = await obtenerPlantillasReporte();
        setPlantillas(lista.sort((a, b) => (b.id || 0) - (a.id || 0)));
        if (idPlantillaExpandida === id) setIdPlantillaExpandida(null);
      } catch (error) {
        alert('Error al eliminar el reporte.');
      }
    }
  }

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

        {/* --- SECCION DE KPIS RAPIDOS --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <article className="tarjeta-resumen" style={{ borderLeft: '5px solid #0f766e' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>VENTA TOTAL RED</span>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0f766e', margin: '5px 0' }}>
              {FORMATO_MONEDA.format(ventaTotalGlobal)}
            </p>
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>↑ Rendimiento Global</span>
          </article>

          <article className="tarjeta-resumen" style={{ borderLeft: '5px solid #2563eb' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>SUCURSAL LÍDER</span>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2563eb', margin: '5px 0' }}>
              {sucursalTop.name}
            </p>
            <span style={{ fontSize: '0.8rem', color: '#2563eb' }}>{FORMATO_MONEDA.format(sucursalTop.value)} facturados</span>
          </article>

          <article className="tarjeta-resumen" style={{ borderLeft: '5px solid #7c3aed' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>OPERATIVIDAD</span>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#7c3aed', margin: '5px 0' }}>
              100%
            </p>
            <span style={{ fontSize: '0.8rem', color: '#7c3aed' }}>Sistema en línea</span>
          </article>
        </div>

        {/* --- SECCION DE GRAFICOS Y DESEMPEÑO --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          
          <article className="tarjeta-resumen" style={{ background: 'white' }}>
            <h3>Mejor Rendimiento</h3>
            <div style={{ marginTop: '15px' }}>
              {analiticaSucursales.slice(0, 5).map((s, idx) => (
                <div key={s.name} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{idx + 1}. {s.name}</span>
                    <span style={{ fontSize: '0.9rem', color: '#0f766e', fontWeight: 'bold' }}>{FORMATO_MONEDA.format(s.value)}</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${(s.value / (sucursalTop.value || 1)) * 100}%`, 
                      background: COLORES[idx % COLORES.length],
                      transition: 'width 1s ease-in-out'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="tarjeta-resumen">
            <h3>Stock por Sucursal</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analiticaStockSucursales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val) || 0} unidades`, 'Stock Disp.']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {analiticaStockSucursales.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="tarjeta-resumen">
            <h3>Ventas por Categoría</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analiticaCategorias}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analiticaCategorias.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES[(index + 2) % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => FORMATO_MONEDA.format(Number(val) || 0)} />
              </PieChart>
            </ResponsiveContainer>
          </article>
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

            {plantillas.map((p) => {
              const isExpandido = idPlantillaExpandida === p.id
              const sucursalNombre = p.titulo.replace('Reporte Sucursal ', '').trim()
              const fechaReporte = p.estado // "11-05"

              return (
                <div key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <div 
                    className="fila" 
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', cursor: 'pointer', background: isExpandido ? '#f8fafc' : 'white' }}
                  >
                    <span style={{ fontWeight: 'bold' }} onClick={() => setIdPlantillaExpandida(isExpandido ? null : (p.id || null))}>{sucursalNombre}</span>
                    <span style={{ color: '#0f766e', fontWeight: 'bold' }} onClick={() => setIdPlantillaExpandida(isExpandido ? null : (p.id || null))}>{fechaReporte}</span>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button 
                        style={{ background: isExpandido ? '#64748b' : '#2563eb', padding: '5px 12px' }}
                        onClick={() => setIdPlantillaExpandida(isExpandido ? null : (p.id || null))}
                      >
                        {isExpandido ? 'Cerrar' : 'Revisar ↓'}
                      </button>
                      <button 
                        style={{ background: '#ef4444', padding: '5px 12px' }}
                        onClick={(e) => { e.stopPropagation(); manejarEliminarReporte(p.id) }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {isExpandido && (
                    <div style={{ padding: '20px', background: '#f8fafc', borderTop: '2px solid #2563eb' }}>
                      <h4 style={{ marginBottom: '20px' }}>📄 Auditoría Detallada: {sucursalNombre} ({fechaReporte})</h4>
                      
                      <div style={{ display: 'grid', gap: '30px' }}>
                        <article>
                          <h5 style={{ color: '#2563eb', marginBottom: '10px' }}>Auditoría de Ventas</h5>
                          <div className="tabla-simple">
                            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
                              <span>Empleado</span>
                              <span>Categoría</span>
                              <span>Producto</span>
                              <span>Cant.</span>
                              <span>Precio Unitario</span>
                              <span>Venta Total</span>
                            </div>
                            {ventas
                              .filter(v => v.sucursal === sucursalNombre && (v.fechaVenta.includes(fechaReporte) || v.fechaVenta.includes(fechaReporte.split('-').reverse().join('-'))))
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
                        </article>

                        <article>
                          <h5 style={{ color: '#0f766e', marginBottom: '10px' }}>Auditoría de Stock</h5>
                          <div className="tabla-simple">
                            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
                              <span>Empleado</span>
                              <span>Categoría</span>
                              <span>Producto</span>
                              <span>Stock</span>
                              <span>Precio Unitario</span>
                              <span>Venta Total</span>
                            </div>
                            {stock
                              .filter(s => s.sucursal === sucursalNombre && (s.fechaRegistro?.includes(fechaReporte) || s.fechaRegistro?.includes(fechaReporte.split('-').reverse().join('-'))))
                              .map((s, i) => (
                                <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
                                  <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{s.vendedor || 'Sistema'}</span>
                                  <span>{s.categoria || 'VARIOS'}</span>
                                  <span>{s.producto}</span>
                                  <strong>{s.cantidad}</strong>
                                  <span>{FORMATO_MONEDA.format(s.precioUnitario || 0)}</span>
                                  <span style={{ fontWeight: 'bold', color: '#0f766e' }}>{FORMATO_MONEDA.format((s.precioUnitario || 0) * (s.cantidad || 0))}</span>
                                </div>
                              ))}
                          </div>
                        </article>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
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
            {ventas
              .filter(v => v.sucursal === sucursalAsignada)
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
            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
              <span>Empleado</span>
              <span>Categoría</span>
              <span>Producto</span>
              <span>Stock</span>
              <span>Precio Unitario</span>
              <span>Venta Total</span>
            </div>
            {stock
              .filter(s => s.sucursal === sucursalAsignada)
              .map((s, i) => (
                <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr 1fr' }}>
                  <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{s.vendedor || 'Sistema'}</span>
                  <span>{s.categoria}</span>
                  <span>{s.producto}</span>
                  <strong>{s.cantidad}</strong>
                  <span>{FORMATO_MONEDA.format(s.precioUnitario || 0)}</span>
                  <span style={{ fontWeight: 'bold', color: '#0f766e' }}>{FORMATO_MONEDA.format((s.precioUnitario || 0) * (s.cantidad || 0))}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default ReportesPage
