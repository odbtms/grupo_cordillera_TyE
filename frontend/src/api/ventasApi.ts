import { ventasHttp } from './http'
import type { Venta } from '../types'

export async function fetchVentas(): Promise<Venta[]> {
  const { data } = await ventasHttp.get<Venta[]>('')
  return Array.isArray(data) ? data : []
}

export async function registrarVenta(payload: Omit<Venta, 'id'>): Promise<Venta> {
  const { data } = await ventasHttp.post<Venta>('/registrar', payload)
  return data
}
