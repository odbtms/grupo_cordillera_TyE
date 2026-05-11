package com.grupocordillera.reportes.controller;

import com.grupocordillera.reportes.model.PlantillaReporte;
import com.grupocordillera.reportes.repository.PlantillaReporteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reportes/plantillas")
public class ReporteController {

    private final PlantillaReporteRepository repository;

    public ReporteController(PlantillaReporteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<PlantillaReporte> listarPlantillas() {
        return repository.findAll().stream()
                .filter(p -> !"Inactivo".equalsIgnoreCase(p.getEstado()))
                .filter(p -> p.getTitulo() == null || !p.getTitulo().toLowerCase().contains("healthcheck"))
                .toList();
    }
    
    @PostMapping
    public PlantillaReporte crearPlantilla(@RequestBody PlantillaReporte plantilla) {
        if (plantilla.getEstado() == null || plantilla.getEstado().isBlank()) {
            plantilla.setEstado("Activo");
        }
        return repository.save(plantilla);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarReporte(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
