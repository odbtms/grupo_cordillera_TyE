package com.grupocordillera.reportes.controller;

import com.grupocordillera.reportes.model.PlantillaReporte;
import com.grupocordillera.reportes.repository.PlantillaReporteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controlador REST para la gestión de plantillas de reportes.
 */
@RestController
@RequestMapping("/api/reportes/plantillas")
public class ReporteController {

    private final PlantillaReporteRepository repository;

    public ReporteController(PlantillaReporteRepository repository) {
        this.repository = repository;
    }

    /**
     * Obtiene el listado de todas las plantillas de reporte disponibles.
     * @return Lista de plantillas.
     */
    @GetMapping
    public List<PlantillaReporte> listarPlantillas() {
        return repository.findAll().stream()
                .filter(p -> !"Inactivo".equalsIgnoreCase(p.getEstado()))
                .filter(p -> p.getTitulo() == null || !p.getTitulo().toLowerCase().contains("healthcheck"))
                .toList();
    }
    
    /**
     * Crea y guarda una nueva plantilla de reporte.
     * @param plantilla Objeto PlantillaReporte con los datos a crear.
     * @return La plantilla guardada.
     */
    @PostMapping
    public PlantillaReporte crearPlantilla(@RequestBody PlantillaReporte plantilla) {
        if (plantilla.getEstado() == null || plantilla.getEstado().isBlank()) {
            plantilla.setEstado("Activo");
        }
        return repository.save(plantilla);
    }

    /**
     * Realiza un borrado lógico de una plantilla de reporte cambiando su estado a "Inactivo".
     * @param id Identificador de la plantilla a eliminar lógicamente.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarReporte(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
