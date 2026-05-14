import type { StockItem } from '../../../types';
import { FORMATO_MONEDA } from '../../../utils/formatters';

type AdminDashboardFiltrosProps = {
  fechaDesde: string;
  setFechaDesde: (val: string) => void;
  fechaHasta: string;
  setFechaHasta: (val: string) => void;
  filtroZona: string;
  setFiltroZona: (val: string) => void;
  opcionesZona: string[];
  filtroOrigen: string;
  setFiltroOrigen: (val: string) => void;
  filtroSucursal: string;
  setFiltroSucursal: (val: string) => void;
  stock: StockItem[];
  ventasFiltradasCount: number;
  totalFiltrado: number;
};

export default function FiltrosDashboardAdmin({
  fechaDesde, setFechaDesde,
  fechaHasta, setFechaHasta,
  filtroZona, setFiltroZona, opcionesZona,
  filtroOrigen, setFiltroOrigen,
  filtroSucursal, setFiltroSucursal, stock,
  ventasFiltradasCount, totalFiltrado
}: AdminDashboardFiltrosProps) {
  return (
    <div className="filtros-simples">
      <div className="filters-grid">
        <label>
          Fecha desde
          <input
            type="date"
            value={fechaDesde}
            onChange={(evento) => setFechaDesde(evento.target.value)}
          />
        </label>

        <label>
          Fecha hasta
          <input
            type="date"
            value={fechaHasta}
            onChange={(evento) => setFechaHasta(evento.target.value)}
          />
        </label>

        <label>
          Zona
          <select
            value={filtroZona}
            onChange={(evento) => setFiltroZona(evento.target.value)}
          >
            {opcionesZona.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sistema Origen
          <select value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="POS">POS</option>
            <option value="WEB">WEB</option>
            <option value="APP">APP</option>
          </select>
        </label>

        <label>
          Sucursal Específica
          <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}>
            <option value="Todas">Todas las sucursales</option>
            {Array.from(new Set(stock.map(s => s.sucursal))).map(nombre => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="filters-summary">
        <span>{ventasFiltradasCount} ventas filtradas</span>
        <strong>{FORMATO_MONEDA.format(totalFiltrado)}</strong>
        <button
          type="button"
          onClick={() => {
            setFechaDesde('')
            setFechaHasta('')
            setFiltroZona('Todas')
            setFiltroOrigen('Todos')
          }}
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
