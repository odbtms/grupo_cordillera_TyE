import type { Kpi } from '../../types';

type AdminKpiFormulaManagerProps = {
  kpiSeleccionadoId: number | null;
  setKpiSeleccionadoId: (id: number) => void;
  kpis: Kpi[];
  nuevaFormula: string;
  setNuevaFormula: (formula: string) => void;
  guardarFormulaKpi: () => void;
  mensajeKpi: string;
};

export default function GestorFormulasKpiAdmin({
  kpiSeleccionadoId,
  setKpiSeleccionadoId,
  kpis,
  nuevaFormula,
  setNuevaFormula,
  guardarFormulaKpi,
  mensajeKpi,
}: AdminKpiFormulaManagerProps) {
  return (
    <section className="tarjeta-panel">
      <h3>Actualizar Fórmulas de KPI</h3>
      <p className="mensaje">Modifica cómo se procesan las métricas en tiempo real.</p>
      
      <div className="formulario-simple">
        <label>
          Seleccionar KPI
          <select className="input-bonito"
            value={kpiSeleccionadoId ?? ''}
            onChange={(evento) => setKpiSeleccionadoId(Number(evento.target.value))}
          >
            <option value="">Seleccione un KPI</option>
            {kpis.map((kpi) => (
              <option key={kpi.id} value={kpi.id}>
                {kpi.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Nueva fórmula
          <input
            className="input-bonito"
            type="text"
            placeholder="Ej: (v.montoTotal * 0.95)"
            value={nuevaFormula}
            onChange={(evento) => setNuevaFormula(evento.target.value)}
          />
        </label>

        <button 
          type="button" 
          onClick={guardarFormulaKpi}
          style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Guardar Cambios
        </button>
      </div>

      <div className="tabla-simple" style={{ marginTop: 20 }}>
        <div className="fila fila-encabezado">
          <span>Nombre del KPI</span>
          <span>Fórmula Actual</span>
          <span>Umbral/Meta</span>
        </div>
        {kpis.map(kpi => (
          <div key={kpi.id} className="fila">
            <span>{kpi.nombre}</span>
            <span><code>{kpi.formula}</code></span>
            <span>{kpi.meta}</span>
          </div>
        ))}
      </div>

      {mensajeKpi && <p style={{ marginTop: '10px', color: '#4f46e5' }}>{mensajeKpi}</p>}
    </section>
  );
}
