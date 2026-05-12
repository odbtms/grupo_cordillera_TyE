import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FORMATO_MONEDA, FORMATO_COMPACTO } from '../../utils/formatters';
import { COLORES_GRAFICO } from '../../constants/dashboardConfig';
import type { Kpi, Venta } from '../../types';

type DatoConsolidado = { periodo: string; total: number };
type Rendimiento = { sucursal: string; total: number; porcentaje: number };
type DatoSucursal = { sucursal: string; total: number };

type DashboardConsolidatedProps = {
  graficoConsolidado: DatoConsolidado[];
  ventasTotales: number;
  rendimientoSucursales: Rendimiento[];
  ventasPorSucursal: DatoSucursal[];
  ventas: Venta[];
  kpis: Kpi[];
};

export default function ConsolidadoDashboard({
  graficoConsolidado,
  ventasTotales,
  rendimientoSucursales,
  ventasPorSucursal,
  ventas,
  kpis,
}: DashboardConsolidatedProps) {
  return (
    <>
      <section className="panel-graficos">
        <article className="tarjeta-panel grafico-principal">
          <h3>Venta consolidada (todas las sucursales)</h3>
          <div className="contenedor-grafico">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={graficoConsolidado}
                margin={{ top: 8, right: 18, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis
                  width={70}
                  tickFormatter={(valor) => FORMATO_COMPACTO.format(Number(valor))}
                />
                <Tooltip formatter={(valor) => FORMATO_MONEDA.format(Number(valor))} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mensaje-demo">Total consolidado: {FORMATO_MONEDA.format(ventasTotales)}</p>
        </article>

        <article className="tarjeta-panel grafico-rendimiento">
          <h3>Rendimiento por sucursal</h3>
          <div className="contenedor-grafico">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={rendimientoSucursales}
                  dataKey="porcentaje"
                  nameKey="sucursal"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={1}
                >
                  {rendimientoSucursales.map((item, index) => (
                    <Cell
                      key={item.sucursal}
                      fill={COLORES_GRAFICO[index % COLORES_GRAFICO.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(valor, _, item) => {
                    const total = item?.payload?.total ?? 0;
                    return [
                      `${Number(valor).toFixed(2)}% • ${FORMATO_MONEDA.format(total)}`,
                      'Participación',
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="lista-sucursales-resumen">
            {rendimientoSucursales.slice(0, 8).map((item) => (
              <p key={item.sucursal}>
                <strong>{item.sucursal}:</strong> {item.porcentaje.toFixed(1)}%
              </p>
            ))}
          </div>
        </article>
      </section>

      <section className="tarjeta-panel">
        <h3>Resumen rápido</h3>
        <div className="rejilla-kpi">
          <article className="tarjeta-kpi">
            <h3>Ventas Totales</h3>
            <p>{FORMATO_MONEDA.format(ventasTotales)}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Ventas registradas</h3>
            <p>{ventas.length}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Sucursales activas</h3>
            <p>{ventasPorSucursal.length}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>KPIs disponibles</h3>
            <p>{kpis.length}</p>
          </article>
        </div>
      </section>
    </>
  );
}
