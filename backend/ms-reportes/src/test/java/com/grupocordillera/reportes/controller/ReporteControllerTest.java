package com.grupocordillera.reportes.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.grupocordillera.reportes.model.PlantillaReporte;
import com.grupocordillera.reportes.repository.PlantillaReporteRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class ReporteControllerTest {

    @Mock
    private PlantillaReporteRepository repository;

    @InjectMocks
    private ReporteController controller;

    private PlantillaReporte plantilla(Long id, String titulo, String estado) {
        PlantillaReporte p = new PlantillaReporte();
        p.setId(id);
        p.setTitulo(titulo);
        p.setEstado(estado);
        return p;
    }

    @Test
    void listarFiltraInactivasYHealthcheck() {
        when(repository.findAll()).thenReturn(List.of(
                plantilla(1L, "Ventas Mensuales", "Activo"),
                plantilla(2L, "Reporte viejo", "Inactivo"),
                plantilla(3L, "healthcheck-ping", "Activo")));

        List<PlantillaReporte> visibles = controller.listarPlantillas();

        assertEquals(1, visibles.size());
        assertEquals("Ventas Mensuales", visibles.get(0).getTitulo());
    }

    @Test
    void crearPlantillaSinEstadoAsignaActivo() {
        PlantillaReporte p = new PlantillaReporte();
        p.setTitulo("Nueva");
        when(repository.save(any(PlantillaReporte.class))).thenAnswer(inv -> inv.getArgument(0));

        PlantillaReporte guardada = controller.crearPlantilla(p);

        assertEquals("Activo", guardada.getEstado());
    }

    @Test
    void crearPlantillaRespetaEstadoProvisto() {
        PlantillaReporte p = plantilla(null, "Nueva", "Borrador");
        when(repository.save(any(PlantillaReporte.class))).thenAnswer(inv -> inv.getArgument(0));

        PlantillaReporte guardada = controller.crearPlantilla(p);

        assertEquals("Borrador", guardada.getEstado());
    }

    @Test
    void eliminarPlantillaExistenteRetornaOk() {
        when(repository.existsById(5L)).thenReturn(true);
        ResponseEntity<Void> resp = controller.eliminarReporte(5L);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        verify(repository).deleteById(5L);
    }

    @Test
    void eliminarPlantillaInexistenteRetorna404() {
        when(repository.existsById(5L)).thenReturn(false);
        ResponseEntity<Void> resp = controller.eliminarReporte(5L);
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
        verify(repository, never()).deleteById(any());
    }
}
