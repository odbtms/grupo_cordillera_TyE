package com.grupocordillera.kpis.controller;

import com.grupocordillera.kpis.model.Kpi;
import com.grupocordillera.kpis.repository.KpiRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controlador REST para la gestión de Indicadores Clave de Rendimiento (KPIs).
 */
@RestController
@RequestMapping("/api/kpis")
public class KpiController {

    private final KpiRepository repository;

    public KpiController(KpiRepository repository) {
        this.repository = repository;
    }

    /**
     * Obtiene el listado de todos los KPIs registrados en el sistema.
     * @return Lista de KPIs con sus fórmulas y valores actuales.
     */
    @GetMapping
    public List<Kpi> listarKpis() {
        return repository.findAll();
    }

    /**
     * Actualiza la fórmula de cálculo de un KPI específico.
     * También actualiza la fecha de modificación al momento actual.
     * 
     * @param id Identificador del KPI a modificar.
     * @param request Objeto que contiene la nueva fórmula.
     * @return El KPI actualizado.
     */
    @PutMapping("/{id}/formula")
    public ResponseEntity<Kpi> actualizarFormula(@PathVariable Long id, @RequestBody Kpi request) {
        // Busca el KPI por ID, actualiza su fórmula y fecha, luego lo guarda
        if (request.getFormula() == null || request.getFormula().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return repository.findById(id).map(kpi -> {
            if (request.getFormula() != null) kpi.setFormula(request.getFormula());
            if (request.getMeta() != null) kpi.setMeta(request.getMeta());
            kpi.setFechaActualizacion(LocalDateTime.now());
            return ResponseEntity.ok(repository.save(kpi));
        }).orElse(ResponseEntity.notFound().build()); // Retorna 404 si no existe
    }
}
