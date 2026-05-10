import { obtenerKpis } from './kpisApi'
import { obtenerVentas } from './ventasApi'
import type { RespuestaDashboard } from '../types'

export async function obtenerDashboard(): Promise<RespuestaDashboard> {
  const [rawVentas, kpis] = await Promise.all([obtenerVentas(), obtenerKpis()])

  const ventas = rawVentas.filter(
    (venta) => !venta.sucursal.toLowerCase().includes('prueba')
  )

  const resumen = {
    totalVentas: ventas.reduce((acum, venta) => acum + venta.montoTotal, 0),
    cantidadVentas: ventas.length,
    cantidadSucursales: new Set(ventas.map((venta) => venta.sucursal)).size,
  }

  const mapa = new Map<string, number>()
  for (const venta of ventas) {
    mapa.set(venta.sucursal, (mapa.get(venta.sucursal) ?? 0) + venta.montoTotal)
  }

  const ventasPorSucursal = Array.from(mapa.entries()).map(([sucursal, total]) => ({
    sucursal,
    total,
  }))

  return {
    resumen,
    ventas,
    ventasPorSucursal,
    kpis,
    alertas: ventas.length ? ['Sin alertas críticas detectadas.'] : ['No hay ventas disponibles en ms-datos.'],
  }
}