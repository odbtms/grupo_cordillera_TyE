import { FORMATO_MONEDA } from '../../../utils/formatters';
import type { ItemCatalogoSucursal } from '../../../types';

type DatoSucursal = {
  sucursal: string;
  total: number;
};

type DetallePeriodo = {
  periodo: string;
  etiqueta: string;
  total: number;
  operaciones: number;
};

type AdminDashboardResumenVentasProps = {
  catalogoFiltrado: ItemCatalogoSucursal[];
  datosSucursalesFiltrados: DatoSucursal[];
  maxVentaSucursalFiltrada: number;
  detallesPeriodo: DetallePeriodo[];
  setFiltroSucursal: (val: string) => void;
};

export default function AdminDashboardResumenVentas({
  catalogoFiltrado,
  datosSucursalesFiltrados,
  maxVentaSucursalFiltrada,
  detallesPeriodo,
  setFiltroSucursal,
}: AdminDashboardResumenVentasProps) {
  return (
    <div className="resumen-grid">
      <article className="tarjeta-resumen" aria-label="Lista de sucursales">
        <div className="panel-head">
          <h2>Lista de Sucursales</h2>
          <span>{catalogoFiltrado.length} activas</span>
        </div>

        <div className="branch-table">
          <div className="branch-table-head">
            <span>Sucursal</span>
            <span>Zona</span>
            <span>Total</span>
          </div>
          {catalogoFiltrado.map((item) => (
            <div 
              key={item.sucursal} 
              className="branch-table-row" 
              onClick={() => setFiltroSucursal(item.sucursal)}
              style={{ cursor: 'pointer', transition: 'background 0.2s' }}
              title={`Ver stock de ${item.sucursal}`}
            >
              <span>{item.sucursal}</span>
              <span>{item.zona}</span>
              <strong>{FORMATO_MONEDA.format(item.total)}</strong>
            </div>
          ))}
          {!catalogoFiltrado.length && (
            <p className="empty-state">No hay sucursales para el filtro actual.</p>
          )}
        </div>
      </article>

      <article className="tarjeta-resumen" aria-label="Ventas por sucursal">
        <div className="panel-head">
          <h2>Ventas por Sucursal</h2>
          <span>Total filtrado</span>
        </div>

        <div className="branch-list">
          {datosSucursalesFiltrados.map((dato) => {
            const ancho =
              maxVentaSucursalFiltrada > 0
                ? (dato.total / maxVentaSucursalFiltrada) * 100
                : 0;
            return (
              <div 
                key={dato.sucursal} 
                className="branch-item"
                onClick={() => setFiltroSucursal(dato.sucursal)}
                style={{ cursor: 'pointer' }}
                title={`Ver stock de ${dato.sucursal}`}
              >
                <div className="branch-top">
                  <span>{dato.sucursal}</span>
                  <strong>{FORMATO_MONEDA.format(dato.total)}</strong>
                </div>
                <div className="branch-bar-bg">
                  <div
                    className="branch-bar-fill"
                    style={{ width: `${ancho}%` }}
                  />
                </div>
              </div>
            );
          })}
          {!datosSucursalesFiltrados.length && (
            <p className="empty-state">Sin ventas para los filtros seleccionados.</p>
          )}
        </div>
      </article>

      <article
        className="tarjeta-resumen tarjeta-ancha"
        aria-label="Detalle por periodo"
      >
        <div className="panel-head">
          <h2>Detalle de Ingresos por Periodo</h2>
          <span>Mensual</span>
        </div>

        <div className="period-table">
          <div className="period-table-head">
            <span>Periodo</span>
            <span>Operaciones</span>
            <span>Ingresos</span>
          </div>
          {detallesPeriodo.map((detalle) => (
            <div key={detalle.periodo} className="period-table-row">
              <span>{detalle.etiqueta}</span>
              <span>{detalle.operaciones}</span>
              <strong>{FORMATO_MONEDA.format(detalle.total)}</strong>
            </div>
          ))}
          {!detallesPeriodo.length && (
            <p className="empty-state">No existen ingresos en el periodo filtrado.</p>
          )}
        </div>
      </article>
    </div>
  );
}
