import { describe, expect, it } from 'vitest'
import { obtenerDetalleStock } from './stockUtils'

describe('obtenerDetalleStock', () => {
  it('retorna registros ordenados con stock restante', () => {
    const data = obtenerDetalleStock('Santiago', 'ENERO', ['ENERO'])

    expect(data.length).toBeGreaterThan(0)
    expect(data[0]).toHaveProperty('stockRestante')
    expect(data[0].stockRestante).toBeGreaterThanOrEqual(0)
  })
})
