import { SUCURSALES_DEMO } from '../demoData'

export const PRODUCTOS_BASE = [
  { nombre: 'Celulares', categoria: 'Electrónica', base: 120 },
  { nombre: 'Mouse', categoria: 'Electrónica', base: 60 },
  { nombre: 'Computadores', categoria: 'Electrónica', base: 45 },
  { nombre: 'Teclados', categoria: 'Electrónica', base: 80 },
  { nombre: 'Audífonos', categoria: 'Electrónica', base: 150 },
  { nombre: 'Tablets', categoria: 'Electrónica', base: 70 },
  { nombre: 'Smartwatches', categoria: 'Electrónica', base: 90 },
  { nombre: 'Monitores', categoria: 'Electrónica', base: 40 },
  { nombre: 'Hervidores', categoria: 'Hogar', base: 80 },
  { nombre: 'Ollas', categoria: 'Hogar', base: 65 },
  { ventiladores: 'Ventiladores', categoria: 'Hogar', base: 100 },
  { nombre: 'Licuadoras', categoria: 'Hogar', base: 75 },
  { nombre: 'Aspiradoras', categoria: 'Hogar', base: 50 },
  { nombre: 'Microondas', categoria: 'Hogar', base: 40 },
  { nombre: 'Planchas', categoria: 'Hogar', base: 85 },
  { nombre: 'Cafeteras', categoria: 'Hogar', base: 55 },
]

export type RegistroStock = {
  categoria: string
  producto: string
  stockInicial: number
  vendidos: number
  stockRestante: number
}

function hashTexto(texto: string) {
  return Array.from(texto).reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Calcula el stock inicial de un producto para una sucursal y un mes usando un hash determinista.
 */
function calcularStockInicial(sucursal: string, producto: string, base: number, mes: string) {
  const hash = hashTexto(normalizarTexto(sucursal) + producto + mes)
  // factor between 0.5 and 1.5
  const factor = 0.5 + (hash % 100) / 100
  return Math.max(10, Math.round(base * factor))
}

/**
 * Calcula cuántos items se vendieron de un producto en un mes específico en una sucursal.
 */
function calcularVendidosMes(sucursal: string, producto: string, mes: string, stockInicial: number) {
  const hash = hashTexto(normalizarTexto(sucursal) + producto + mes)
  // Sell between 2% and 15% of initial stock each month
  const porcentajeVendido = 0.02 + (hash % 13) / 100
  return Math.round(stockInicial * porcentajeVendido)
}

export function obtenerDetalleStock(
  sucursalActiva: string | null,
  periodoAnalisis: string,
  periodosDisponibles: string[],
): RegistroStock[] {
  // Determine which branches to calculate for
  const sucursalesAProcesar = sucursalActiva
    ? [sucursalActiva]
    : SUCURSALES_DEMO.map((s) => s.sucursal)

  // Determine which months are included in the analysis
  const mesesAProcesar =
    periodoAnalisis === 'GENERAL' ? periodosDisponibles : [periodoAnalisis]

  const mapaProductos = new Map<string, RegistroStock>()

  for (const prod of PRODUCTOS_BASE) {
    const nombreProd = prod.nombre || prod.ventiladores || 'Producto' // fallback for the typo in array
    
    let totalStockInicial = 0
    let totalVendidos = 0

    for (const sucursal of sucursalesAProcesar) {
      for (const mes of mesesAProcesar) {
        const stockInicialMensual = calcularStockInicial(sucursal, nombreProd, prod.base, mes)
        totalStockInicial += stockInicialMensual
        totalVendidos += calcularVendidosMes(sucursal, nombreProd, mes, stockInicialMensual)
      }
    }

    mapaProductos.set(nombreProd, {
      categoria: prod.categoria,
      producto: nombreProd,
      stockInicial: totalStockInicial,
      vendidos: totalVendidos,
      stockRestante: totalStockInicial - totalVendidos,
    })
  }

  // Convert to array and sort
  return Array.from(mapaProductos.values()).sort((a, b) =>
    a.producto.localeCompare(b.producto),
  )
}
