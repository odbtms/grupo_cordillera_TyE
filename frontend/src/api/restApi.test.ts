import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', () => ({
  kpisHttp: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  reportesHttp: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  ventasHttp: { get: vi.fn(), post: vi.fn() },
}))

import { kpisHttp, reportesHttp, ventasHttp } from './http'
import { obtenerKpis, actualizarFormulaKpi, obtenerMetas } from './kpisApi'
import { obtenerPlantillasReporte, eliminarPlantillaReporte } from './reportsApi'
import { obtenerStock, upsertStock } from './stockApi'

const kpis = kpisHttp as unknown as Record<string, ReturnType<typeof vi.fn>>
const reportes = reportesHttp as unknown as Record<string, ReturnType<typeof vi.fn>>
const ventas = ventasHttp as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('kpisApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('obtenerKpis retorna [] si no es arreglo', async () => {
    kpis.get.mockResolvedValue({ data: null })
    expect(await obtenerKpis()).toEqual([])
  })

  it('actualizarFormulaKpi hace PUT con la fórmula', async () => {
    kpis.put.mockResolvedValue({ data: { id: 1 } })
    await actualizarFormulaKpi(1, 'a/b')
    expect(kpis.put).toHaveBeenCalledWith('/1/formula', { formula: 'a/b' })
  })

  it('obtenerMetas pega a /metas', async () => {
    kpis.get.mockResolvedValue({ data: [{ nombreSucursal: 'Santiago', metaVenta: 1 }] })
    expect(await obtenerMetas()).toHaveLength(1)
    expect(kpis.get).toHaveBeenCalledWith('/metas')
  })
})

describe('reportsApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('obtenerPlantillasReporte retorna [] si no es arreglo', async () => {
    reportes.get.mockResolvedValue({ data: undefined })
    expect(await obtenerPlantillasReporte()).toEqual([])
  })

  it('eliminarPlantillaReporte hace DELETE al id', async () => {
    reportes.delete.mockResolvedValue({})
    await eliminarPlantillaReporte(7)
    expect(reportes.delete).toHaveBeenCalledWith('/plantillas/7')
  })
})

describe('stockApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('obtenerStock manda el filtro de sucursal como param', async () => {
    ventas.get.mockResolvedValue({ data: [] })
    await obtenerStock('Temuco')
    expect(ventas.get).toHaveBeenCalledWith('/stock', { params: { sucursal: 'Temuco' } })
  })

  it('obtenerStock sin sucursal no manda params', async () => {
    ventas.get.mockResolvedValue({ data: [] })
    await obtenerStock()
    expect(ventas.get).toHaveBeenCalledWith('/stock', { params: undefined })
  })

  it('upsertStock hace POST a /stock', async () => {
    ventas.post.mockResolvedValue({ data: { id: 1 } })
    await upsertStock({ sucursal: 'Santiago', categoria: 'Electronica', producto: 'Mouse', cantidad: 5 })
    expect(ventas.post).toHaveBeenCalledWith('/stock', expect.objectContaining({ producto: 'Mouse' }))
  })
})
