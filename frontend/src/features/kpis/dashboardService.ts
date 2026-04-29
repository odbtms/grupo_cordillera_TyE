import { fetchKpis, fetchVentas } from '../../api'
import type { Kpi, Venta } from '../../types'

export type DashboardPayload = {
  ventas: Venta[]
  kpis: Kpi[]
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const [ventas, kpis] = await Promise.all([fetchVentas(), fetchKpis()])
  return { ventas, kpis }
}
