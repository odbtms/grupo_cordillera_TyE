import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../api', () => ({
  obtenerVentas: vi.fn(),
  obtenerKpis: vi.fn(),
}))

import { obtenerVentas, obtenerKpis } from '../../api'
import { getDashboardPayload } from './dashboardService'

describe('getDashboardPayload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('combina ventas y kpis en un solo payload', async () => {
    ;(obtenerVentas as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }])
    ;(obtenerKpis as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 10 }, { id: 11 }])

    const payload = await getDashboardPayload()

    expect(payload.ventas).toHaveLength(1)
    expect(payload.kpis).toHaveLength(2)
    expect(obtenerVentas).toHaveBeenCalledOnce()
    expect(obtenerKpis).toHaveBeenCalledOnce()
  })
})
