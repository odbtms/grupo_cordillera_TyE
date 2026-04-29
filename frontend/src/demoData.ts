import type { DashboardResponse, Kpi, Venta } from './types'

export const SUCURSALES_DEMO = [
  { sucursal: 'Santiago', base: 20000000 },
  { sucursal: 'Concepción', base: 12000000 },
  { sucursal: 'Valparaíso', base: 13800000 },
  { sucursal: 'Temuco', base: 9800000 },
  { sucursal: 'Antofagasta', base: 11400000 },
  { sucursal: 'La Serena', base: 9200000 },
  { sucursal: 'Rancagua', base: 8700000 },
  { sucursal: 'Talca', base: 8400000 },
  { sucursal: 'Puerto Montt', base: 9100000 },
  { sucursal: 'Osorno', base: 7600000 },
  { sucursal: 'Iquique', base: 7300000 },
  { sucursal: 'Arica', base: 6900000 },
  { sucursal: 'Copiapó', base: 7100000 },
  { sucursal: 'Curicó', base: 6800000 },
  { sucursal: 'Chillán', base: 7900000 },
  { sucursal: 'Los Ángeles', base: 8100000 },
  { sucursal: 'Punta Arenas', base: 7400000 },
  { sucursal: 'Coyhaique', base: 5900000 },
  { sucursal: 'Calama', base: 8300000 },
  { sucursal: 'San Antonio', base: 6600000 },
  { sucursal: 'Quillota', base: 6200000 },
  { sucursal: 'San Felipe', base: 6050000 },
  { sucursal: 'Melipilla', base: 6400000 },
  { sucursal: 'Maipú', base: 9500000 },
  { sucursal: 'Puente Alto', base: 9700000 },
  { sucursal: 'Las Condes', base: 11800000 },
  { sucursal: 'Ñuñoa', base: 10200000 },
  { sucursal: 'Providencia', base: 11000000 },
  { sucursal: 'Viña del Mar', base: 11500000 },
  { sucursal: 'Quilpué', base: 6300000 },
  { sucursal: 'Linares', base: 6000000 },
  { sucursal: 'Ovalle', base: 5750000 },
]

export function generarVentasDemo(): Venta[] {
  const factoresMensualesBase = [0.74, 0.82, 0.79, 0.9, 0.87, 1]
  const meses = [
    '2025-11-15T12:00:00',
    '2025-12-15T12:00:00',
    '2026-01-15T12:00:00',
    '2026-02-15T12:00:00',
    '2026-03-15T12:00:00',
    '2026-04-15T12:00:00',
  ]
  let id = 1

  return meses.flatMap((fechaVenta, indiceMes) =>
    SUCURSALES_DEMO.map(({ sucursal, base }, indiceSucursal) => {
      const desplazamientoSucursal = ((indiceSucursal % 7) - 3) * 0.03
      const variacionOndulada =
        Math.sin((indiceSucursal + 2) * (indiceMes + 1) * 0.65) * 0.05
      const ajusteCiclico = ((indiceSucursal + indiceMes) % 4 === 0 ? 0.05 : -0.02)
      const factor = Math.max(
        0.58,
        factoresMensualesBase[indiceMes] +
          desplazamientoSucursal +
          variacionOndulada +
          ajusteCiclico,
      )

      return {
        id: id++,
        fechaVenta,
        montoTotal: Math.round(base * factor + indiceSucursal * 28000),
        sistemaOrigen: indiceSucursal % 2 === 0 ? 'POS' : 'Ecommerce',
        sucursal,
      }
    }),
  )
}

export const VENTAS_DEMO: Venta[] = generarVentasDemo()

export const TOTAL_DEMO = VENTAS_DEMO.reduce((acum, item) => acum + item.montoTotal, 0)

export const KPIS_DEMO: Kpi[] = [
  {
    id: 1,
    nombre: 'Ventas Totales',
    formula: 'SUM(montoTotal)',
    valorCalculado: TOTAL_DEMO,
    fechaActualizacion: '2026-04-23T12:00:00',
  },
  {
    id: 2,
    nombre: 'Ticket Promedio',
    formula: 'SUM(montoTotal)/COUNT(*)',
    valorCalculado: TOTAL_DEMO / VENTAS_DEMO.length,
    fechaActualizacion: '2026-04-23T12:00:00',
  },
]

export const DASHBOARD_DEMO: DashboardResponse = {
  resumen: {
    totalVentas: TOTAL_DEMO,
    cantidadVentas: VENTAS_DEMO.length,
    cantidadSucursales: SUCURSALES_DEMO.length,
  },
  ventas: VENTAS_DEMO,
  ventasPorSucursal: [],
  kpis: KPIS_DEMO,
  alertas: ['Modo demo activo.'],
}
