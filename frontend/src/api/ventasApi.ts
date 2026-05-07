import { ventasHttp } from './http'
import type { Venta } from '../types'

export async function fetchVentas(): Promise<Venta[]> {
  const { data } = await ventasHttp.get<Venta[]>('')
  return Array.isArray(data) ? data : []
}

<<<<<<< HEAD
export async function fetchVentasPorSucursal(sucursal: string): Promise<Venta[]> {
  const { data } = await ventasHttp.get<Venta[]>(`/sucursal/${encodeURIComponent(sucursal)}`)
  return Array.isArray(data) ? data : []
}

=======
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
export async function registrarVenta(payload: Omit<Venta, 'id'>): Promise<Venta> {
  const { data } = await ventasHttp.post<Venta>('/registrar', payload)
  return data
}
