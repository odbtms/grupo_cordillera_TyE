package com.grupocordillera.kpis.controller;

import com.grupocordillera.kpis.model.Kpi;
import com.grupocordillera.kpis.repository.KpiRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/kpis")
public class KpiController {

    private final KpiRepository repository;

    public KpiController(KpiRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Kpi> listarKpis() {
        return repository.findAll();
    }

    @PutMapping("/{id}/formula")
    public Kpi actualizarFormula(@PathVariable Long id, @RequestBody Kpi request) {
        return repository.findById(id).map(kpi -> {
            kpi.setFormula(request.getFormula());
            kpi.setFechaActualizacion(LocalDateTime.now());
            return repository.save(kpi);
        }).orElseThrow(() -> new RuntimeException("KPI no encontrado"));
    }
}
