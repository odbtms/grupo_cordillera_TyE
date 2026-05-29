import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'

type Sucursal = {
  id: number
  nombre: string
  metaVenta: number
}

type AdminBranchMetaTableProps = {
  sucursales: Sucursal[]
  resumenVentas: Map<string, number>
  actualizarMeta: (index: number, valor: string) => void
  guardarCambios: () => void
  mensaje: string
  onRenombrar: (id: number, nuevoNombre: string) => Promise<void>
  onEliminar: (id: number, nombre: string) => Promise<void>
}

export default function TablaMetasSucursalAdmin({
  sucursales,
  resumenVentas,
  actualizarMeta,
  guardarCambios,
  mensaje,
  onRenombrar,
  onEliminar,
}: AdminBranchMetaTableProps) {
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null)
  const [cargando, setCargando] = useState(false)

  async function guardarNombre(id: number) {
    if (!nuevoNombre.trim()) return
    setCargando(true)
    try {
      await onRenombrar(id, nuevoNombre.trim())
      setEditandoId(null)
      setNuevoNombre('')
    } finally {
      setCargando(false)
    }
  }

  async function confirmarEliminar(id: number, nombre: string) {
    setCargando(true)
    try {
      await onEliminar(id, nombre)
      setConfirmandoId(null)
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="tarjeta-panel">
      <h3>Metas de Venta por Sucursal</h3>
      <p className="mensaje">Visualización en tiempo real del cumplimiento de objetivos.</p>

      <div className="tabla-simple" style={{ display: 'grid', gap: '8px' }}>
        <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 0.8fr 0.8fr', alignItems: 'center' }}>
          <span>Sucursal</span>
          <span>Ventas Actuales</span>
          <span>Meta Mensual</span>
          <span style={{ textAlign: 'right' }}>% Logro</span>
          <span style={{ textAlign: 'center' }}>Acciones</span>
        </div>

        {sucursales.map((sucursal, indice) => {
          const ventasActuales = resumenVentas.get(sucursal.nombre) ?? 0
          const porcentaje = sucursal.metaVenta > 0 ? (ventasActuales / sucursal.metaVenta) * 100 : 0

          if (confirmandoId === sucursal.id) {
            return (
              <div key={sucursal.id} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', background: '#fef2f2' }}>
                <span style={{ fontSize: '0.84rem', color: '#dc2626' }}>
                  ¿Eliminar sucursal "{sucursal.nombre}"? Las ventas históricas se conservan.
                </span>
                <div style={{ display: 'flex', gap: '6px', padding: '0 8px' }}>
                  <button onClick={() => confirmarEliminar(sucursal.id, sucursal.nombre)} disabled={cargando}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                    Eliminar
                  </button>
                  <button onClick={() => setConfirmandoId(null)}
                    style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div key={sucursal.id} className="fila" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 0.8fr 0.8fr', alignItems: 'center' }}>
              {editandoId === sucursal.id ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    className="input-bonito"
                    value={nuevoNombre}
                    onChange={e => setNuevoNombre(e.target.value)}
                    autoFocus
                    style={{ padding: '3px 6px', fontSize: '0.85rem', flex: 1 }}
                  />
                  <button onClick={() => guardarNombre(sucursal.id)} disabled={cargando}
                    style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Check size={12} />
                  </button>
                  <button onClick={() => setEditandoId(null)}
                    style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <span>{sucursal.nombre}</span>
              )}
              <span>${ventasActuales.toLocaleString()}</span>
              <span>
                <input
                  className="input-bonito"
                  type="number"
                  min={1}
                  style={{ width: '100%', padding: '4px' }}
                  value={sucursal.metaVenta}
                  onChange={e => actualizarMeta(indice, e.target.value)}
                />
              </span>
              <strong style={{ color: porcentaje >= 100 ? '#4CAF50' : '#FF9800', textAlign: 'right' }}>
                {porcentaje.toFixed(1)}%
              </strong>
              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                <button
                  onClick={() => { setEditandoId(sucursal.id); setNuevoNombre(sucursal.nombre) }}
                  title="Renombrar"
                  style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '5px', padding: '4px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => setConfirmandoId(sucursal.id)}
                  title="Eliminar"
                  style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '5px', padding: '4px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}

        {sucursales.length === 0 && (
          <p style={{ padding: '20px', textAlign: 'center' }}>No hay sucursales registradas.</p>
        )}
      </div>

      <button
        type="button"
        onClick={guardarCambios}
        style={{ marginTop: '20px', background: '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
      >
        Guardar Metas
      </button>
      {mensaje && <p style={{ marginTop: '10px', color: '#334155' }}>{mensaje}</p>}
    </section>
  )
}
