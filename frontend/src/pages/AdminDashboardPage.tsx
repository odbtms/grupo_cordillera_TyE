import { useEffect, useMemo, useState } from 'react'
import { getDashboardPayload } from '../features/kpis'
import type { BranchCatalogItem, Kpi, Venta } from '../types'

const FALLBACK_VENTAS: Venta[] = [
  {
    id: 1,
    fechaVenta: '2026-04-18T10:30:00',
    montoTotal: 1480000,
    sistemaOrigen: 'POS',
    sucursal: 'Santiago Centro',
  },
  {
    id: 2,
    fechaVenta: '2026-04-18T16:10:00',
    montoTotal: 1220000,
    sistemaOrigen: 'Ecommerce',
    sucursal: 'Providencia',
  },
  {
    id: 3,
    fechaVenta: '2026-04-10T09:15:00',
    montoTotal: 860000,
    sistemaOrigen: 'POS',
    sucursal: 'Viña del Mar',
  },
  {
    id: 4,
    fechaVenta: '2026-03-18T14:40:00',
    montoTotal: 1110000,
    sistemaOrigen: 'POS',
    sucursal: 'Santiago Centro',
  },
  {
    id: 5,
    fechaVenta: '2026-03-11T11:25:00',
    montoTotal: 970000,
    sistemaOrigen: 'Ecommerce',
    sucursal: 'Providencia',
  },
  {
    id: 6,
    fechaVenta: '2026-03-04T12:50:00',
    montoTotal: 790000,
    sistemaOrigen: 'POS',
    sucursal: 'Viña del Mar',
  },
  {
    id: 7,
    fechaVenta: '2026-04-19T13:30:00',
    montoTotal: 640000,
    sistemaOrigen: 'POS',
    sucursal: 'Concepción',
  },
  {
    id: 8,
    fechaVenta: '2026-03-20T09:40:00',
    montoTotal: 420000,
    sistemaOrigen: 'Ecommerce',
    sucursal: 'Concepción',
  },
]

const FALLBACK_KPIS: Kpi[] = [
  {
    id: 1,
    nombre: 'Margen Operacional',
    formula: '(Ingresos-Costos)/Ingresos',
    valorCalculado: 31.5,
    fechaActualizacion: '2026-04-20T10:15:00',
  },
  {
    id: 2,
    nombre: 'Crecimiento Mensual',
    formula: '(Mes actual-Mes previo)/Mes previo',
    valorCalculado: 14.2,
    fechaActualizacion: '2026-04-20T10:15:00',
  },
]

const moneyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const monthLabelFormatter = new Intl.DateTimeFormat('es-CL', {
  month: 'long',
  year: 'numeric',
})

const BRANCH_ZONE_MAP: Record<string, string> = {
  'Santiago Centro': 'Metropolitana',
  Providencia: 'Metropolitana',
  'Viña del Mar': 'Costa',
  Concepción: 'Sur',
}

function monthKey(dateText: string): string {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return 'invalido'
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function zoneByBranch(branch: string): string {
  return BRANCH_ZONE_MAP[branch] ?? 'Sin zona'
}

function formatMonthLabel(key: string): string {
  const [yearText, monthText] = key.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  if (Number.isNaN(year) || Number.isNaN(month)) return key
  const date = new Date(year, month - 1, 1)
  return monthLabelFormatter.format(date)
}

function AdminDashboardPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'api' | 'local'>('local')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [zoneFilter, setZoneFilter] = useState('Todas')
  const [originFilter, setOriginFilter] = useState('Todos')

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)

      try {
        const payload = await getDashboardPayload()
        setVentas(payload.ventas)
        setKpis(payload.kpis)
        setDataSource('api')
      } catch {
        setVentas(FALLBACK_VENTAS)
        setKpis(FALLBACK_KPIS)
        setDataSource('local')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const totalSales = useMemo(
    () => ventas.reduce((total, venta) => total + (venta.montoTotal || 0), 0),
    [ventas],
  )

  const averageTicket = useMemo(() => {
    if (!ventas.length) return 0
    return totalSales / ventas.length
  }, [totalSales, ventas.length])

  const branchData = useMemo(() => {
    const map = new Map<string, number>()
    for (const venta of ventas) {
      const key = venta.sucursal || 'Sucursal sin nombre'
      map.set(key, (map.get(key) ?? 0) + (venta.montoTotal || 0))
    }

    return Array.from(map.entries())
      .map(([sucursal, total]) => ({ sucursal, total }))
      .sort((a, b) => b.total - a.total)
  }, [ventas])

  const sucursalLider = branchData[0]

  const alertas = useMemo(() => {
    const mensajes: string[] = []

    if (!ventas.length) {
      mensajes.push('No hay ventas registradas para analizar.')
      return mensajes
    }

    if (sucursalLider && totalSales > 0) {
      const participacion = (sucursalLider.total / totalSales) * 100
      if (participacion >= 50) {
        mensajes.push(
          `${sucursalLider.sucursal} concentra gran parte de los ingresos (${participacion.toFixed(1)}%).`,
        )
      }
    }

    const sucursalDebil = branchData.find((item) => item.total < averageTicket)
    if (sucursalDebil) {
      mensajes.push(
        `${sucursalDebil.sucursal} esta por debajo del promedio general de ingresos.`,
      )
    }

    if (!mensajes.length) {
      mensajes.push('Sin alertas importantes. El comportamiento se ve estable.')
    }

    return mensajes
  }, [averageTicket, branchData, sucursalLider, totalSales, ventas.length])

  const branchCatalog = useMemo<BranchCatalogItem[]>(() => {
    const map = new Map<string, number>()

    for (const venta of ventas) {
      const branch = venta.sucursal || 'Sucursal sin nombre'
      map.set(branch, (map.get(branch) ?? 0) + (venta.montoTotal || 0))
    }

    return Array.from(map.entries())
      .map(([sucursal, total]) => ({
        sucursal,
        zona: zoneByBranch(sucursal),
        total,
      }))
      .sort((a, b) => a.sucursal.localeCompare(b.sucursal, 'es'))
  }, [ventas])

  const zoneOptions = useMemo(
    () => ['Todas', ...new Set(branchCatalog.map((item) => item.zona))],
    [branchCatalog],
  )

  const originOptions = useMemo(
    () => ['Todos', ...new Set(ventas.map((venta) => venta.sistemaOrigen))],
    [ventas],
  )

  const filteredVentas = useMemo(() => {
    return ventas.filter((venta) => {
      const ventaDate = new Date(venta.fechaVenta)
      const branchZone = zoneByBranch(venta.sucursal || 'Sucursal sin nombre')

      if (fromDate) {
        const startDate = new Date(`${fromDate}T00:00:00`)
        if (ventaDate < startDate) return false
      }

      if (toDate) {
        const endDate = new Date(`${toDate}T23:59:59`)
        if (ventaDate > endDate) return false
      }

      if (zoneFilter !== 'Todas' && branchZone !== zoneFilter) {
        return false
      }

      if (originFilter !== 'Todos' && venta.sistemaOrigen !== originFilter) {
        return false
      }

      return true
    })
  }, [fromDate, originFilter, toDate, ventas, zoneFilter])

  const filteredBranchData = useMemo(() => {
    const map = new Map<string, number>()

    for (const venta of filteredVentas) {
      const branch = venta.sucursal || 'Sucursal sin nombre'
      map.set(branch, (map.get(branch) ?? 0) + venta.montoTotal)
    }

    return Array.from(map.entries())
      .map(([sucursal, total]) => ({ sucursal, total }))
      .sort((a, b) => b.total - a.total)
  }, [filteredVentas])

  const filteredBranchMax = filteredBranchData[0]?.total ?? 1

  const periodDetails = useMemo(() => {
    const map = new Map<string, { total: number; operaciones: number }>()

    for (const venta of filteredVentas) {
      const key = monthKey(venta.fechaVenta)
      const current = map.get(key) ?? { total: 0, operaciones: 0 }
      map.set(key, {
        total: current.total + venta.montoTotal,
        operaciones: current.operaciones + 1,
      })
    }

    return Array.from(map.entries())
      .map(([periodo, values]) => ({
        periodo,
        label: formatMonthLabel(periodo),
        total: values.total,
        operaciones: values.operaciones,
      }))
      .sort((a, b) => (a.periodo > b.periodo ? 1 : -1))
  }, [filteredVentas])

  const filteredTotal = useMemo(
    () => filteredVentas.reduce((sum, venta) => sum + venta.montoTotal, 0),
    [filteredVentas],
  )

  const filteredCatalog = useMemo(() => {
    const active = new Set(filteredBranchData.map((branch) => branch.sucursal))
    return branchCatalog
      .filter((item) => active.has(item.sucursal))
      .sort((a, b) => b.total - a.total)
  }, [branchCatalog, filteredBranchData])

  return (
    <main className="dashboard-page">
      <header className="encabezado-simple">
        <h1>Panel de Administracion</h1>
        <p>Grupo Cordillera - Vista para gerencia</p>
        <p>
          Estado: {loading ? 'Cargando datos...' : 'Datos cargados'} | Fuente:{' '}
          {dataSource === 'api' ? 'API' : 'respaldo local'}
        </p>
      </header>

      <section className="bloque" aria-label="Resumen de ventas totales">
        <h2>1. Dashboard general</h2>
        <div className="resumen-grid">
          <div className="tarjeta-resumen">
            <h3>Resumen de ventas totales</h3>
            <p className="valor-principal">{moneyFormatter.format(totalSales)}</p>
            <p>
              Registros: {ventas.length} | Sucursales con ventas:{' '}
              {branchData.length}
            </p>
          </div>
          <div className="tarjeta-resumen">
            <h3>Comparacion entre sucursales</h3>
            <ul className="lista-simple">
              {branchData.map((branch) => (
                <li key={branch.sucursal}>
                  <span>{branch.sucursal}</span>
                  <strong>{moneyFormatter.format(branch.total)}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="tarjeta-resumen">
            <h3>KPIs clave</h3>
            <ul className="lista-simple">
              <li>
                <span>Ticket promedio</span>
                <strong>{moneyFormatter.format(averageTicket)}</strong>
              </li>
              <li>
                <span>Sucursal lider</span>
                <strong>{sucursalLider?.sucursal ?? 'Sin datos'}</strong>
              </li>
              {kpis.slice(0, 2).map((kpi) => (
                <li key={kpi.id}>
                  <span>{kpi.nombre}</span>
                  <strong>{kpi.valorCalculado}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="tarjeta-resumen">
            <h3>Alertas o variaciones importantes</h3>
            <ul className="lista-alertas">
              {alertas.map((mensaje) => (
                <li key={mensaje}>{mensaje}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bloque" aria-label="Sucursales y ventas">
        <div className="section-title-row">
          <h2>2. Sucursales / Ventas</h2>
          <p>Analisis basico por sucursal con filtros.</p>
        </div>

        <div className="filtros-simples">
          <div className="filters-grid">
            <label>
              Fecha desde
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>

            <label>
              Fecha hasta
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>

            <label>
              Zona
              <select
                value={zoneFilter}
                onChange={(event) => setZoneFilter(event.target.value)}
              >
                {zoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sistema origen
              <select
                value={originFilter}
                onChange={(event) => setOriginFilter(event.target.value)}
              >
                {originOptions.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filters-summary">
            <span>{filteredVentas.length} ventas filtradas</span>
            <strong>{moneyFormatter.format(filteredTotal)}</strong>
            <button
              type="button"
              onClick={() => {
                setFromDate('')
                setToDate('')
                setZoneFilter('Todas')
                setOriginFilter('Todos')
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="resumen-grid">
          <article className="tarjeta-resumen" aria-label="Lista de sucursales">
            <div className="panel-head">
              <h2>Lista de Sucursales</h2>
              <span>{filteredCatalog.length} activas</span>
            </div>

            <div className="branch-table">
              <div className="branch-table-head">
                <span>Sucursal</span>
                <span>Zona</span>
                <span>Total</span>
              </div>
              {filteredCatalog.map((item) => (
                <div key={item.sucursal} className="branch-table-row">
                  <span>{item.sucursal}</span>
                  <span>{item.zona}</span>
                  <strong>{moneyFormatter.format(item.total)}</strong>
                </div>
              ))}
              {!filteredCatalog.length && (
                <p className="empty-state">No hay sucursales para el filtro actual.</p>
              )}
            </div>
          </article>

          <article className="tarjeta-resumen" aria-label="Ventas por sucursal">
            <div className="panel-head">
              <h2>Ventas por Sucursal</h2>
              <span>Total filtrado</span>
            </div>

            <div className="branch-list">
              {filteredBranchData.map((branch) => {
                const width =
                  filteredBranchMax > 0
                    ? (branch.total / filteredBranchMax) * 100
                    : 0
                return (
                  <div key={branch.sucursal} className="branch-item">
                    <div className="branch-top">
                      <span>{branch.sucursal}</span>
                      <strong>{moneyFormatter.format(branch.total)}</strong>
                    </div>
                    <div className="branch-bar-bg">
                      <div
                        className="branch-bar-fill"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {!filteredBranchData.length && (
                <p className="empty-state">Sin ventas para los filtros seleccionados.</p>
              )}
            </div>
          </article>

          <article
            className="tarjeta-resumen tarjeta-ancha"
            aria-label="Detalle por periodo"
          >
            <div className="panel-head">
              <h2>Detalle de Ingresos por Periodo</h2>
              <span>Mensual</span>
            </div>

            <div className="period-table">
              <div className="period-table-head">
                <span>Periodo</span>
                <span>Operaciones</span>
                <span>Ingresos</span>
              </div>
              {periodDetails.map((period) => (
                <div key={period.periodo} className="period-table-row">
                  <span>{period.label}</span>
                  <span>{period.operaciones}</span>
                  <strong>{moneyFormatter.format(period.total)}</strong>
                </div>
              ))}
              {!periodDetails.length && (
                <p className="empty-state">No existen ingresos en el periodo filtrado.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboardPage
