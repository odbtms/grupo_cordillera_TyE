import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FORMATO_MONEDA, FORMATO_COMPACTO } from '../../utils/formatters';
import type { StockItem } from '../../types';
import TablaStock from '../empleado/TablaStock';

type SerieMes = { periodo: string; total: number };

type ResumenActiva = {
  total: number;
  promedioMensual: number;
  mejorMes: { periodo: string; total: number } | null;
  registros: number;
};

type DashboardBranchDetailProps = {
  sucursalActiva: string;
  setSucursalActiva: (val: string | null) => void;
  serieSucursalActiva: SerieMes[];
  setPeriodoAnalisis: (val: string) => void;
  periodoAnalisis: string;
  resumenSucursalActiva: ResumenActiva | null;
  ventasAnalisis: number;
  stockSucursal: StockItem[];
};

export default function DetalleSucursalDashboard({
  sucursalActiva,
  setSucursalActiva,
  serieSucursalActiva,
  setPeriodoAnalisis,
  periodoAnalisis,
  resumenSucursalActiva,
  ventasAnalisis,
  stockSucursal,
}: DashboardBranchDetailProps) {
  return (
    <>
      <section className="tarjeta-panel">
        <div className="encabezado-mini-sucursales">
          <h3>Rendimiento de {sucursalActiva} (últimos 6 meses)</h3>
          <button
            type="button"
            className="boton-volver-general"
            onClick={() => setSucursalActiva(null)}
          >
            Volver al general
          </button>
        </div>

        <div className="contenedor-grafico">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={serieSucursalActiva}
              onClick={(evento: any) => {
                const etiqueta = evento?.activeLabel;
                if (etiqueta) {
                  setPeriodoAnalisis(etiqueta);
                }
              }}
              margin={{ top: 8, right: 18, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSucursalDetalle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0.06} />
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
                stroke="#0f766e"
                dot={{ r: 3, fill: '#ffffff', stroke: '#0f766e', strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
                fillOpacity={1}
                fill="url(#colorSucursalDetalle)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="tarjeta-panel">
        <h3>Resumen rápido ({sucursalActiva})</h3>

        <div className="rejilla-kpi">
          <article className="tarjeta-kpi">
            <h3>{periodoAnalisis === 'GENERAL' ? 'Ventas 6 meses' : 'Ventas del mes'}</h3>
            <p>{FORMATO_MONEDA.format(ventasAnalisis)}</p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Promedio mensual</h3>
            <p>
              {FORMATO_MONEDA.format(resumenSucursalActiva?.promedioMensual ?? 0)}
            </p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Mejor mes</h3>
            <p>
              {resumenSucursalActiva?.mejorMes?.periodo ?? '-'}
            </p>
          </article>

          <article className="tarjeta-kpi">
            <h3>Registros de venta</h3>
            <p>
              {resumenSucursalActiva?.registros ?? 0}
            </p>
          </article>
        </div>
      </section>

      <TablaStock stock={stockSucursal} />
    </>
  );
}
