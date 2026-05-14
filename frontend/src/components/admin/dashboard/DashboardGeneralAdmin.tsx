import { FORMATO_MONEDA } from '../../../utils/formatters';
import type { Kpi } from '../../../types';

type DatoSucursal = {
  sucursal: string;
  total: number;
};

type AdminDashboardGeneralProps = {
  ventasTotales: number;
  ventasCount: number;
  datosSucursales: DatoSucursal[];
  ticketPromedio: number;
  sucursalLider: DatoSucursal | undefined;
  kpis: Kpi[];
  alertas: string[];
};

export default function DashboardGeneralAdmin({
  ventasTotales,
  ventasCount,
  datosSucursales,
  ticketPromedio,
  sucursalLider,
  kpis,
  alertas,
}: AdminDashboardGeneralProps) {
  return (
    <section className="bloque" aria-label="Resumen de ventas totales">
      <h2>1. Dashboard general</h2>
      <div className="resumen-grid">
        <div className="tarjeta-resumen">
          <h3>Resumen de ventas totales</h3>
          <p className="valor-principal">{FORMATO_MONEDA.format(ventasTotales)}</p>
          <p>
            Registros: {ventasCount} | Sucursales con ventas:{' '}
            {datosSucursales.length}
          </p>
        </div>
        <div className="tarjeta-resumen">
          <h3>Comparacion entre sucursales</h3>
          <ul className="lista-simple">
            {datosSucursales.map((dato) => (
              <li key={dato.sucursal}>
                <span>{dato.sucursal}</span>
                <strong>{FORMATO_MONEDA.format(dato.total)}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="tarjeta-resumen">
          <h3>KPIs clave</h3>
          <ul className="lista-simple">
            <li>
              <span>Ticket promedio</span>
              <strong>{FORMATO_MONEDA.format(ticketPromedio)}</strong>
            </li>
            <li>
              <span>Sucursal lider</span>
              <strong>{sucursalLider?.sucursal ?? 'Sin datos'}</strong>
            </li>
            {kpis.slice(0, 2).map((kpi) => (
              <li key={kpi.id}>
                <span>{kpi.nombre}</span>
                <strong>{kpi.valorCalculado}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="tarjeta-resumen">
          <h3>Alertas o variaciones importantes</h3>
          <ul className="lista-alertas">
            {alertas.map((mensaje) => (
              <li key={mensaje}>{mensaje}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
