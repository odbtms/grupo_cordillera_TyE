import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./ventasApi', () => ({ obtenerVentas: vi.fn() }))
vi.mock('./kpisApi', () => ({ obtenerKpis: vi.fn() }))

import { obtenerVentas } from './ventasApi'
import { obtenerKpis } from './kpisApi'
import { obtenerDashboard } from './dashboardApi'

const ventasMock = obtenerVentas as ReturnType<typeof vi.fn>
const kpisMock = obtenerKpis as ReturnType<typeof vi.fn>

describe('obtenerDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calcula resumen, agrupa por sucursal y descarta ventas de prueba', async () => {
    ventasMock.mockResolvedValue([
      { sucursal: 'Santiago', montoTotal: 100 },
      { sucursal: 'Santiago', montoTotal: 50 },
      { sucursal: 'Temuco', montoTotal: 200 },
      { sucursal: 'Sucursal Prueba', montoTotal: 9999 },
    ])
    kpisMock.mockResolvedValue([{ id: 1 }])

    const dash = await obtenerDashboard()

    // La venta "prueba" se filtra: total = 100 + 50 + 200
    expect(dash.resumen.totalVentas).toBe(350)
    expect(dash.resumen.cantidadVentas).toBe(3)
    expect(dash.resumen.cantidadSucursales).toBe(2)

    const santiago = dash.ventasPorSucursal.find((v) => v.sucursal === 'Santiago')
    expect(santiago?.total).toBe(150)
    expect(dash.alertas).toEqual(['Sin alertas críticas detectadas.'])
  })

  it('devuelve alerta cuando no hay ventas', async () => {
    ventasMock.mockResolvedValue([])
    kpisMock.mockResolvedValue([])

    const dash = await obtenerDashboard()

    expect(dash.resumen.cantidadVentas).toBe(0)
    expect(dash.alertas).toEqual(['No hay ventas disponibles en ms-datos.'])
  })
})
