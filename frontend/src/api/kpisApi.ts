import { kpisHttp } from './http'
import type { Kpi } from '../types'

export async function obtenerKpis(): Promise<Kpi[]> {
  const { data } = await kpisHttp.get<Kpi[]>('')
  return Array.isArray(data) ? data : []
}

export async function actualizarFormulaKpi(id: number, formula: string): Promise<Kpi> {
  const { data } = await kpisHttp.put<Kpi>(`/${id}/formula`, {
    formula,
  })
  return data
}

export type MetaSucursal = {
  nombreSucursal: string
  metaVenta: number
}

export async function obtenerMetas(): Promise<MetaSucursal[]> {
  const { data } = await kpisHttp.get<MetaSucursal[]>('/metas')
  return Array.isArray(data) ? data : []
}

export async function upsertMeta(payload: MetaSucursal): Promise<MetaSucursal> {
  const { data } = await kpisHttp.post<MetaSucursal>('/metas', payload)
  return data
}
