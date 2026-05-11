package com.grupocordillera.kpis.controller;

import com.grupocordillera.kpis.model.Kpi;
import com.grupocordillera.kpis.repository.KpiRepository;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Kpi> actualizarFormula(@PathVariable Long id, @RequestBody Kpi request) {
        if (request.getFormula() == null || request.getFormula().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return repository.findById(id).map(kpi -> {
            if (request.getFormula() != null) kpi.setFormula(request.getFormula());
            if (request.getMeta() != null) kpi.setMeta(request.getMeta());
            kpi.setFechaActualizacion(LocalDateTime.now());
            return ResponseEntity.ok(repository.save(kpi));
        }).orElse(ResponseEntity.notFound().build());
    }
}
