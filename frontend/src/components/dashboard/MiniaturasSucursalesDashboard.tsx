import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FORMATO_MONEDA } from '../../utils/formatters';

type SerieSucursal = { periodo: string; total: number }[];

type TarjetaSucursal = {
  sucursal: string;
  total: number;
  serie: SerieSucursal;
};

type DashboardMiniBranchesProps = {
  tarjetasVisibles: TarjetaSucursal[];
  paginaSucursales: number;
  totalPaginasSucursales: number;
  paginaAnteriorSucursales: () => void;
  paginaSiguienteSucursales: () => void;
  setSucursalActiva: (sucursal: string) => void;
  inicioPagina: number;
};

export default function MiniaturasSucursalesDashboard({
  tarjetasVisibles,
  paginaSucursales,
  totalPaginasSucursales,
  paginaAnteriorSucursales,
  paginaSiguienteSucursales,
  setSucursalActiva,
  inicioPagina,
}: DashboardMiniBranchesProps) {
  return (
    <section className="tarjeta-panel">
      <div className="encabezado-mini-sucursales">
        <h3>Ventas por sucursal</h3>
        <div className="controles-mini-sucursales">
          <button type="button" onClick={paginaAnteriorSucursales} aria-label="Página anterior">
            ◀
          </button>
          <span>
            {Math.min(paginaSucursales + 1, totalPaginasSucursales)} / {totalPaginasSucursales}
          </span>
          <button type="button" onClick={paginaSiguienteSucursales} aria-label="Página siguiente">
            ▶
          </button>
        </div>
      </div>

      <p className="mensaje">
        Ejemplo: Santiago {FORMATO_MONEDA.format(20000000)} y Concepción{' '}
        {FORMATO_MONEDA.format(12000000)}.
      </p>

      <div className="rejilla-mini-sucursales">
        {tarjetasVisibles.map((item, index) => {
          const miniId = `mini-${inicioPagina + index}`
          return (
            <article className="tarjeta-mini-sucursal" key={item.sucursal}>
              <button
                type="button"
                className="boton-mini-sucursal"
                onClick={() => setSucursalActiva(item.sucursal)}
              >
                <h4>{item.sucursal}</h4>
                <p>{FORMATO_MONEDA.format(item.total)}</p>
                <div className="mini-grafico-sucursal">
                  <ResponsiveContainer width="100%" height={90}>
                    <AreaChart data={item.serie}>
                      <defs>
                        <linearGradient id={miniId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="periodo" hide />
                      <YAxis hide />
                      <Tooltip formatter={(valor) => FORMATO_MONEDA.format(Number(valor))} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#0f766e"
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: '#ffffff', stroke: '#0f766e', strokeWidth: 1.5 }}
                        activeDot={{ r: 4 }}
                        fillOpacity={1}
                        fill={`url(#${miniId})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </button>
            </article>
          )
        })}
      </div>
    </section>
  );
}
