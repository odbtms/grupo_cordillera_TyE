import { describe, expect, it } from 'vitest'
import { obtenerDetalleStock, PRODUCTOS_BASE } from './stockUtils'

describe('obtenerDetalleStock', () => {
  it('retorna registros ordenados con stock restante', () => {
    const data = obtenerDetalleStock('Santiago', 'ENERO', ['ENERO'])

    expect(data.length).toBeGreaterThan(0)
    expect(data[0]).toHaveProperty('stockRestante')
    expect(data[0].stockRestante).toBeGreaterThanOrEqual(0)
  })

  it('devuelve un registro por cada producto base', () => {
    const data = obtenerDetalleStock('Santiago', 'ENERO', ['ENERO'])
    expect(data).toHaveLength(PRODUCTOS_BASE.length)
  })

  it('ordena los productos alfabéticamente', () => {
    const data = obtenerDetalleStock('Santiago', 'ENERO', ['ENERO'])
    const nombres = data.map((r) => r.producto)
    const ordenados = [...nombres].sort((a, b) => a.localeCompare(b))
    expect(nombres).toEqual(ordenados)
  })

  it('retorna lista vacía si no hay periodos disponibles', () => {
    expect(obtenerDetalleStock('Santiago', 'ENERO', [])).toEqual([])
  })

  it('el stock restante nunca supera al stock inicial', () => {
    const data = obtenerDetalleStock('Concepción', 'GENERAL', ['ENERO', 'FEBRERO'])
    for (const registro of data) {
      expect(registro.vendidos).toBeLessThanOrEqual(registro.stockInicial)
      expect(registro.stockRestante).toBe(registro.stockInicial - registro.vendidos)
    }
  })

  it('acumula todas las sucursales cuando no hay una activa', () => {
    const unaSucursal = obtenerDetalleStock('Santiago', 'ENERO', ['ENERO'])
    const todas = obtenerDetalleStock(null, 'ENERO', ['ENERO'])
    // Al sumar 5 sucursales, el stock inicial total debe ser mayor que el de una sola
    const totalUna = unaSucursal.reduce((acc, r) => acc + r.stockInicial, 0)
    const totalTodas = todas.reduce((acc, r) => acc + r.stockInicial, 0)
    expect(totalTodas).toBeGreaterThan(totalUna)
  })

  it('el modo GENERAL suma todos los meses disponibles', () => {
    const unMes = obtenerDetalleStock('Santiago', 'ENERO', ['ENERO', 'FEBRERO'])
    const general = obtenerDetalleStock('Santiago', 'GENERAL', ['ENERO', 'FEBRERO'])
    const totalUnMes = unMes.reduce((acc, r) => acc + r.stockInicial, 0)
    const totalGeneral = general.reduce((acc, r) => acc + r.stockInicial, 0)
    expect(totalGeneral).toBeGreaterThan(totalUnMes)
  })
})
