package com.grupocordillera.reportes.controller;

import com.grupocordillera.reportes.model.PlantillaReporte;
import com.grupocordillera.reportes.repository.PlantillaReporteRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controlador REST para la gestión de plantillas de reportes.
 */
@RestController
@CrossOrigin(origins = "*")
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
        return repository.findAll();
    }
    
    /**
     * Crea y guarda una nueva plantilla de reporte.
     * @param plantilla Objeto PlantillaReporte con los datos a crear.
     * @return La plantilla guardada.
     */
    @PostMapping
    public PlantillaReporte crearPlantilla(@RequestBody PlantillaReporte plantilla) {
        return repository.save(plantilla);
    }

    /**
     * Realiza un borrado lógico de una plantilla de reporte cambiando su estado a "Inactivo".
     * @param id Identificador de la plantilla a eliminar lógicamente.
     */
    @DeleteMapping("/{id}")
    public void eliminarReporte(@PathVariable Long id) {
        // En tu informe sugerías borrado lógico, así que actualizamos el estado
        repository.findById(id).ifPresent(plantilla -> {
            plantilla.setEstado("Inactivo"); // Marcar como inactivo en vez de borrar de BD
            repository.save(plantilla);
        });
    }
}
