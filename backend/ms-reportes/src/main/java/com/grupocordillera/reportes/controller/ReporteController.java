package com.grupocordillera.reportes.controller;

import com.grupocordillera.reportes.model.PlantillaReporte;
import com.grupocordillera.reportes.repository.PlantillaReporteRepository;
import org.springframework.web.bind.annotation.*;
<<<<<<< HEAD
import java.util.List;
=======
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/reportes/plantillas")
public class ReporteController {

    private final PlantillaReporteRepository repository;

    public ReporteController(PlantillaReporteRepository repository) {
        this.repository = repository;
    }

<<<<<<< HEAD
    @GetMapping
    public List<PlantillaReporte> listarPlantillas() {
        return repository.findAll();
    }

=======
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
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
