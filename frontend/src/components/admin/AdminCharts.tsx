import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { FORMATO_MONEDA } from '../../utils/formatters';

type AnaliticaItem = { name: string; value: number };

type AdminChartsProps = {
  analiticaStockSucursales: AnaliticaItem[];
  analiticaCategorias: AnaliticaItem[];
  colores: string[];
};

export default function AdminCharts({ 
  analiticaStockSucursales, 
  analiticaCategorias, 
  colores 
}: AdminChartsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      <article className="tarjeta-resumen">
        <h3>Stock Total por Sucursal</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={analiticaStockSucursales}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(val: any) => [`${Number(val).toLocaleString()} unidades`, 'Stock Disp.']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {analiticaStockSucursales.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </article>

      <article className="tarjeta-resumen">
        <h3>Ventas por Categoría</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={analiticaCategorias}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {analiticaCategorias.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colores[(index + 2) % colores.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: any) => FORMATO_MONEDA.format(Number(val) || 0)} />
          </PieChart>
        </ResponsiveContainer>
      </article>
    </div>
  );
}
