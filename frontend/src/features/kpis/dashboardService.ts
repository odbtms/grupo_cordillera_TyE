import { obtenerKpis, obtenerVentas } from '../../api'
import type { Kpi, Venta } from '../../types'

export type PayloadDashboard = {
  ventas: Venta[]
  kpis: Kpi[]
}

export async function getDashboardPayload(): Promise<PayloadDashboard> {
  const [ventas, kpis] = await Promise.all([obtenerVentas(), obtenerKpis()])
  return { ventas, kpis }
}
