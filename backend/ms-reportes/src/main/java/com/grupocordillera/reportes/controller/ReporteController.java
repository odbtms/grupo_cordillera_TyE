package com.grupocordillera.reportes.controller;

import com.grupocordillera.reportes.model.PlantillaReporte;
import com.grupocordillera.reportes.repository.PlantillaReporteRepository;
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
        return repository.findAll();
    }
    @PostMapping
    public PlantillaReporte crearPlantilla(@RequestBody PlantillaReporte plantilla) {
        return repository.save(plantilla);
    }

    @DeleteMapping("/{id}")
    public void eliminarReporte(@PathVariable Long id) {
        // En tu informe sugerías borrado lógico, así que actualizamos el estado
        repository.findById(id).ifPresent(plantilla -> {
            plantilla.setEstado("Inactivo");
            repository.save(plantilla);
        });
    }
}
