import { useState } from 'react'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import type { Venta, StockItem } from '../../types'
import { FORMATO_MONEDA } from '../../utils/formatters'

type Sucursal = { id: number; nombre: string; metaVenta: number }

type Props = {
  ventas: Venta[]
  sucursales: Sucursal[]
  inventarioFull: StockItem[]
  onEditar: (id: number, payload: Partial<Venta>) => Promise<void>
  onEliminar: (id: number) => Promise<void>
}

export default function GestorVentasAdmin({ ventas, sucursales, onEditar, onEliminar }: Props) {
  const [filtroSucursal, setFiltroSucursal] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<Venta>>({})
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const ventasFiltradas = ventas
    .filter(v => (v.montoTotal ?? 0) > 0)
    .filter(v => !filtroSucursal || v.sucursal === filtroSucursal)
    .sort((a, b) => b.id - a.id)
    .slice(0, 100)

  function iniciarEdicion(v: Venta) {
    setEditandoId(v.id)
    setForm({
      vendedor: v.vendedor ?? '',
      categoria: v.categoria ?? '',
      producto: v.producto ?? '',
      cantidad: v.cantidad ?? 1,
      precioUnitario: v.precioUnitario ?? 0,
      montoTotal: v.montoTotal,
      sucursal: v.sucursal,
    })
    setMensaje('')
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setForm({})
  }

  async function guardarEdicion(id: number) {
    setCargando(true)
    try {
      const montoCalculado = (form.precioUnitario ?? 0) * (form.cantidad ?? 1)
      await onEditar(id, { ...form, montoTotal: montoCalculado })
      setEditandoId(null)
      setForm({})
      setMensaje('Venta actualizada correctamente.')
    } catch {
      setMensaje('Error al actualizar la venta.')
    } finally {
      setCargando(false)
    }
  }

  async function confirmarEliminar(id: number) {
    setCargando(true)
    try {
      await onEliminar(id)
      setConfirmandoId(null)
      setMensaje('Venta eliminada y stock restaurado.')
    } catch {
      setMensaje('Error al eliminar la venta.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="tarjeta-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3>Gestión de Ventas</h3>
        <select
          value={filtroSucursal}
          onChange={e => setFiltroSucursal(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value=''>Todas las sucursales</option>
          {sucursales.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
        </select>
      </div>

      {mensaje && (
        <p style={{ marginBottom: '10px', color: mensaje.startsWith('Error') ? '#dc2626' : '#0f766e', fontSize: '0.85rem' }}>
          {mensaje}
        </p>
      )}

      <div className="tabla-simple">
        <div className="fila fila-encabezado" style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1.5fr 0.6fr 1fr 1fr 1fr', fontSize: '0.82rem' }}>
          <span>ID</span>
          <span>Vendedor</span>
          <span>Producto</span>
          <span>Cant.</span>
          <span>Precio Unit.</span>
          <span>Total</span>
          <span style={{ textAlign: 'center' }}>Acciones</span>
        </div>

        {ventasFiltradas.length === 0 && (
          <p style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay ventas para mostrar.</p>
        )}

        {ventasFiltradas.map(v => (
          editandoId === v.id ? (
            <div key={v.id} className="fila" style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1.5fr 0.6fr 1fr 1fr 1fr', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>#{v.id}</span>
              <input value={form.vendedor ?? ''} onChange={e => setForm(f => ({ ...f, vendedor: e.target.value }))}
                style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%' }} />
              <input value={form.producto ?? ''} onChange={e => setForm(f => ({ ...f, producto: e.target.value }))}
                style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%' }} />
              <input type="number" min={1} value={form.cantidad ?? 1} onChange={e => setForm(f => ({ ...f, cantidad: Number(e.target.value) }))}
                style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%' }} />
              <input type="number" min={0} value={form.precioUnitario ?? 0} onChange={e => setForm(f => ({ ...f, precioUnitario: Number(e.target.value) }))}
                style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%' }} />
              <span style={{ fontSize: '0.82rem', color: '#0f766e', fontWeight: 600 }}>
                {FORMATO_MONEDA.format((form.precioUnitario ?? 0) * (form.cantidad ?? 1))}
              </span>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button onClick={() => guardarEdicion(v.id)} disabled={cargando}
                  style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem' }}>
                  <Check size={12} /> Guardar
                </button>
                <button onClick={cancelarEdicion}
                  style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem' }}>
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : confirmandoId === v.id ? (
            <div key={v.id} className="fila" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', background: '#fef2f2' }}>
              <span style={{ fontSize: '0.84rem', color: '#dc2626' }}>
                ¿Eliminar venta #{v.id} — {v.producto} ({v.vendedor})? El stock será restaurado.
              </span>
              <div style={{ display: 'flex', gap: '6px', padding: '0 8px' }}>
                <button onClick={() => confirmarEliminar(v.id)} disabled={cargando}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                  Confirmar
                </button>
                <button onClick={() => setConfirmandoId(null)}
                  style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div key={v.id} className="fila" style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1.5fr 0.6fr 1fr 1fr 1fr', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>#{v.id}</span>
              <span style={{ fontSize: '0.84rem' }}>{v.vendedor || '—'}</span>
              <span style={{ fontSize: '0.84rem' }}>{v.producto || '—'}</span>
              <strong style={{ fontSize: '0.84rem' }}>{v.cantidad ?? '—'}</strong>
              <span style={{ fontSize: '0.84rem' }}>{FORMATO_MONEDA.format(v.precioUnitario ?? 0)}</span>
              <span style={{ fontWeight: 600, color: '#0f766e', fontSize: '0.84rem' }}>{FORMATO_MONEDA.format(v.montoTotal)}</span>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                <button onClick={() => iniciarEdicion(v)} title="Editar"
                  style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => setConfirmandoId(v.id)} title="Eliminar"
                  style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        ))}
      </div>
    </section>
  )
}
