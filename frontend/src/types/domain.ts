export type Venta = {
  id: number
  fechaVenta: string
  montoTotal: number
  sistemaOrigen: string
  sucursal: string
}

export type Kpi = {
  id: number
  nombre: string
  formula: string
  valorCalculado: number
  fechaActualizacion: string
}

export type ResumenSucursal = {
  sucursal: string
  total: number
}

export type ItemCatalogoSucursal = {
  sucursal: string
  zona: string
  total: number
}

export type NivelAlerta = 'alta' | 'media' | 'info'

export type AlertaDashboard = {
  titulo: string
  mensaje: string
  nivel: NivelAlerta
}

export type StockItem = {
  id: number
  sucursal: string
  categoria: string
  producto: string
  cantidad: number
}

export type RespuestaLogin = {
  token: string
  usuario: string
  rol: string
  sucursal: string | null
}

export type VentaPorSucursal = {
  sucursal: string
  total: number
}

export type ResumenDashboard = {
  totalVentas: number
  cantidadVentas: number
  cantidadSucursales: number
}

export type RespuestaDashboard = {
  resumen: ResumenDashboard
  ventas: Venta[]
  ventasPorSucursal: VentaPorSucursal[]
  kpis: Kpi[]
  alertas: string[]
}
