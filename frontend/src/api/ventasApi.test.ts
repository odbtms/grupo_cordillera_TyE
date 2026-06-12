import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock del cliente HTTP para no golpear la red real
vi.mock('./http', () => ({
  ventasHttp: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { ventasHttp } from './http'
import {
  obtenerVentas,
  obtenerVentasPorSucursal,
  registrarVenta,
  eliminarVenta,
} from './ventasApi'

const httpMock = ventasHttp as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('ventasApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('obtenerVentas retorna el arreglo recibido', async () => {
    httpMock.get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] })
    const ventas = await obtenerVentas()
    expect(ventas).toHaveLength(2)
    expect(httpMock.get).toHaveBeenCalledWith('')
  })

  it('obtenerVentas retorna [] si la respuesta no es un arreglo', async () => {
    httpMock.get.mockResolvedValue({ data: null })
    expect(await obtenerVentas()).toEqual([])
  })

  it('obtenerVentasPorSucursal codifica el nombre en la URL', async () => {
    httpMock.get.mockResolvedValue({ data: [] })
    await obtenerVentasPorSucursal('Viña del Mar')
    expect(httpMock.get).toHaveBeenCalledWith('/sucursal/Vi%C3%B1a%20del%20Mar')
  })

  it('registrarVenta hace POST a /registrar y devuelve la venta', async () => {
    httpMock.post.mockResolvedValue({ data: { id: 9, montoTotal: 100 } })
    const venta = await registrarVenta({ montoTotal: 100 } as never)
    expect(venta.id).toBe(9)
    expect(httpMock.post).toHaveBeenCalledWith('/registrar', { montoTotal: 100 })
  })

  it('eliminarVenta hace DELETE al id', async () => {
    httpMock.delete.mockResolvedValue({})
    await eliminarVenta(5)
    expect(httpMock.delete).toHaveBeenCalledWith('/5')
  })
})
