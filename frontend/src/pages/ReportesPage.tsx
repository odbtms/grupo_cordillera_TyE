import { useEffect, useState } from 'react'
import {
  crearPlantillaReporte,
  obtenerPlantillasReporte,
  obtenerStock,
  obtenerVentas,
  type PlantillaReporte,
} from '../api'
import type { StockItem, Venta } from '../types'

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

  async function enviarReporteDiario() {
    try {
      const hoy = new Date()
      const diaMes = `${String(hoy.getDate()).padStart(2, '0')}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
      
      await crearPlantillaReporte({
        titulo: `Reporte Sucursal ${sucursalAsignada}`,
        estado: diaMes
      })
      
      alert(`Reporte de ${sucursalAsignada} enviado con éxito al administrador.`)
      // Recargar plantillas para que el admin lo vea si está logueado
      const lista = await obtenerPlantillasReporte()
      setPlantillas(lista.sort((a, b) => (b.id || 0) - (a.id || 0)))
    } catch {
      alert('Error al enviar el reporte. Intente nuevamente.')
    }
  }

  // VISTA PARA EL ADMINISTRADOR (LISTADO DE REPORTES RECIBIDOS)
  if (esAdmin) {
    return (
      <section className="pagina-contenido">
        <div className="encabezado-pagina">
          <h2>Módulo de Reportes Recibidos</h2>
          <p>Centro de auditoría y monitoreo de envíos de sucursales</p>
        </div>

        <section className="reportes-kpi-grid">
          <article className="reportes-kpi-card">
            <h3>Reportes Recibidos</h3>
            <p>{plantillas.length}</p>
          </article>
        </section>

        <section className="tarjeta-panel">
          <h3>Listado de Reportes Recibidos</h3>
          <p style={{ marginBottom: '15px', color: '#64748b' }}>Haz clic en un reporte para desplegar su auditoría detallada.</p>
          
          <div className="tabla-simple">
            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#f1f5f9' }}>
              <span>Nombre del Reporte</span>
              <span>Fecha de Envío</span>
              <span style={{ textAlign: 'center' }}>Acción</span>
            </div>

            {plantillas.map((p) => {
              const isExpandido = idPlantillaExpandida === p.id
              const sucursalNombre = p.titulo.replace('Reporte Sucursal ', '').trim()
              const fechaReporte = p.estado

              return (
                <div key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <div 
                    className="fila" 
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', cursor: 'pointer', background: isExpandido ? '#f8fafc' : 'white' }}
                    onClick={() => setIdPlantillaExpandida(isExpandido ? null : (p.id || null))}
                  >
                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{p.titulo}</span>
                    <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{fechaReporte}</span>
                    <button style={{ background: isExpandido ? '#64748b' : '#2563eb', padding: '5px 10px', fontSize: '0.8rem' }}>
                      {isExpandido ? 'Cerrar' : 'Ver Detalle ↓'}
                    </button>
                  </div>

                  {isExpandido && (
                    <div style={{ padding: '20px', background: '#f8fafc', borderTop: '2px solid #2563eb' }}>
                      <h3 style={{ color: '#1e293b', marginBottom: '20px' }}>📄 Auditoría Detallada: {sucursalNombre} ({fechaReporte})</h3>
                      
                      <div style={{ display: 'grid', gap: '30px' }}>
                        <article>
                          <h4 style={{ color: '#2563eb', marginBottom: '10px' }}>1. Auditoría de Ventas</h4>
                          <div className="tabla-simple">
                            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.8fr 1fr', background: '#fff' }}>
                              <span>Empleado</span>
                              <span>Producto</span>
                              <span>Cant.</span>
                              <span>Total</span>
                            </div>
                            {ventas
                              .filter(v => v.sucursal === sucursalNombre && v.fechaVenta.includes(fechaReporte))
                              .map((v, i) => (
                                <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.8fr 1fr' }}>
                                  <span>{v.vendedor || 'Admin'}</span>
                                  <span>{v.producto}</span>
                                  <strong>{v.cantidad}</strong>
                                  <span>${v.montoTotal?.toLocaleString()}</span>
                                </div>
                              ))}
                          </div>
                        </article>

                        <article>
                          <h4 style={{ color: '#0f766e', marginBottom: '10px' }}>2. Auditoría de Stock (Ingresos)</h4>
                          <div className="tabla-simple">
                            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.8fr 1fr', background: '#fff' }}>
                              <span>Empleado</span>
                              <span>Producto</span>
                              <span>Stock</span>
                              <span>Precio Un.</span>
                            </div>
                            {stock
                              .filter(s => s.sucursal === sucursalNombre && s.fechaRegistro?.includes(fechaReporte))
                              .map((s, i) => (
                                <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.8fr 1fr' }}>
                                  <span>{s.vendedor || 'Sistema'}</span>
                                  <span>{s.producto}</span>
                                  <strong>{s.cantidad}</strong>
                                  <span>${s.precioUnitario?.toLocaleString()}</span>
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
            {plantillas.length === 0 && <p style={{ padding: '20px', textAlign: 'center' }}>No se han recibido reportes aún.</p>}
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
          <h2>Módulo de Reportes - {sucursalAsignada}</h2>
          <p>Auditoría local de ventas e ingresos de stock</p>
        </div>
        <button 
          onClick={enviarReporteDiario}
          style={{ background: '#2563eb', padding: '12px 24px', fontSize: '1.1rem', fontWeight: 'bold' }}
        >
          ENVIAR REPORTE AL ADMIN
        </button>
      </div>

      <div style={{ display: 'grid', gap: '30px', marginTop: '30px' }}>
        {/* Tabla de Ventas (Empleado) */}
        <section className="tarjeta-panel">
          <h3 style={{ color: '#2563eb', marginBottom: '15px' }}>Auditoría de Ventas Detallada</h3>
          <div className="tabla-simple">
            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr', background: '#f1f5f9' }}>
              <span>Empleado</span>
              <span>Categoría</span>
              <span>Producto</span>
              <span>Cant.</span>
              <span>Precio</span>
            </div>
            {ventas
              .filter(v => v.sucursal === sucursalAsignada)
              .sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime())
              .map((v, i) => (
                <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr' }}>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{v.vendedor || 'Admin'}</span>
                  <span style={{ fontSize: '0.85rem' }}>{v.categoria || 'VARIOS'}</span>
                  <span>{v.producto}</span>
                  <strong>{v.cantidad}</strong>
                  <span>${v.precioUnitario?.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </section>

        {/* Tabla de Stock (Empleado) */}
        <section className="tarjeta-panel">
          <h3 style={{ color: '#0f766e', marginBottom: '15px' }}>Auditoría de Stock (Ingresos)</h3>
          <div className="tabla-simple">
            <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr', background: '#f1f5f9' }}>
              <span>Empleado</span>
              <span>Categoría</span>
              <span>Producto</span>
              <span>Stock</span>
              <span>Precio Un.</span>
            </div>
            {stock
              .filter(s => s.sucursal === sucursalAsignada)
              .map((s, i) => (
                <div key={i} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr 1fr' }}>
                  <span style={{ color: '#0f766e', fontWeight: 'bold' }}>{s.vendedor || 'Sistema'}</span>
                  <span style={{ fontSize: '0.85rem' }}>{s.categoria}</span>
                  <span>{s.producto}</span>
                  <strong>{s.cantidad}</strong>
                  <span>${s.precioUnitario?.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default ReportesPage
