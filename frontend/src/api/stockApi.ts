import { ventasHttp } from './http'
import type { StockItem } from '../types'

export type StockInput = {
  sucursal: string
  categoria: string
  producto: string
  cantidad: number
  precioUnitario?: number
}

export async function obtenerStock(sucursal?: string): Promise<StockItem[]> {
  const { data } = await ventasHttp.get<StockItem[]>('/stock', {
    params: sucursal ? { sucursal } : undefined,
  })
  return Array.isArray(data) ? data : []
}

export async function upsertStock(payload: StockInput): Promise<StockItem> {
  const { data } = await ventasHttp.post<StockItem>('/stock', payload)
  return data
}
