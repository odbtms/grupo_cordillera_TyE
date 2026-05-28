import { ventasHttp } from './http'
import type { Venta } from '../types'

export async function obtenerVentas(): Promise<Venta[]> {
  const { data } = await ventasHttp.get<Venta[]>('')
  return Array.isArray(data) ? data : []
}

export async function obtenerVentasPorSucursal(sucursal: string): Promise<Venta[]> {
  const { data } = await ventasHttp.get<Venta[]>(`/sucursal/${encodeURIComponent(sucursal)}`)
  return Array.isArray(data) ? data : []
}

export async function registrarVenta(payload: Omit<Venta, 'id'>): Promise<Venta> {
  const { data } = await ventasHttp.post<Venta>('/registrar', payload)
  return data
}

export async function editarVenta(id: number, payload: Partial<import('../types').Venta>): Promise<import('../types').Venta> {
  const { data } = await ventasHttp.put<import('../types').Venta>(`/${id}`, payload)
  return data
}

export async function eliminarVenta(id: number): Promise<void> {
  await ventasHttp.delete(`/${id}`)
}

export async function registrarSucursal(payload: { nombre: string; ubicacion?: string; metaVenta?: number }): Promise<any> {
  const { data } = await ventasHttp.post('/sucursales', payload)
  return data
}

export async function obtenerSucursalesMaster(): Promise<any[]> {
  const { data } = await ventasHttp.get('/sucursales')
  return Array.isArray(data) ? data : []
}

export async function renombrarSucursal(id: number, nombre: string): Promise<any> {
  const { data } = await ventasHttp.put(`/sucursales/${id}/nombre`, { nombre })
  return data
}

export async function eliminarSucursal(id: number): Promise<void> {
  await ventasHttp.delete(`/sucursales/${id}`)
}
