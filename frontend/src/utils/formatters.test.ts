import { describe, expect, it } from 'vitest'
import { normalizarTexto, FORMATO_MONEDA } from './formatters'

describe('normalizarTexto', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(normalizarTexto('Concepción')).toBe('concepcion')
    expect(normalizarTexto('Valparaíso')).toBe('valparaiso')
  })

  it('recorta espacios al inicio y final', () => {
    expect(normalizarTexto('  Santiago  ')).toBe('santiago')
  })

  it('deja igual un texto ya normalizado', () => {
    expect(normalizarTexto('temuco')).toBe('temuco')
  })
})

describe('FORMATO_MONEDA', () => {
  it('formatea como peso chileno sin decimales', () => {
    const resultado = FORMATO_MONEDA.format(1500)
    // El símbolo y separador pueden variar; validamos que incluya los dígitos agrupados
    expect(resultado).toContain('1.500')
    expect(resultado).not.toContain(',00')
  })
})
