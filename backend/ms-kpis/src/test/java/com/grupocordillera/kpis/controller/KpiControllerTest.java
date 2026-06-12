package com.grupocordillera.kpis.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.grupocordillera.kpis.model.Kpi;
import com.grupocordillera.kpis.repository.KpiRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class KpiControllerTest {

    @Mock
    private KpiRepository repository;

    @InjectMocks
    private KpiController controller;

    @Test
    void listarKpisDelegaEnRepositorio() {
        when(repository.findAll()).thenReturn(List.of(new Kpi(), new Kpi()));
        assertEquals(2, controller.listarKpis().size());
    }

    @Test
    void actualizarFormulaConFormulaVaciaRetorna400() {
        Kpi req = new Kpi();
        req.setFormula("  ");
        ResponseEntity<Kpi> resp = controller.actualizarFormula(1L, req);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void actualizarFormulaDeKpiInexistenteRetorna404() {
        Kpi req = new Kpi();
        req.setFormula("ventas/costos");
        when(repository.findById(7L)).thenReturn(Optional.empty());
        ResponseEntity<Kpi> resp = controller.actualizarFormula(7L, req);
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }

    @Test
    void actualizarFormulaActualizaCamposYFecha() {
        Kpi existente = new Kpi();
        existente.setId(1L);
        existente.setFormula("vieja");
        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        when(repository.save(any(Kpi.class))).thenAnswer(inv -> inv.getArgument(0));

        Kpi req = new Kpi();
        req.setFormula("ventas-costos");
        req.setMeta(95.0);

        ResponseEntity<Kpi> resp = controller.actualizarFormula(1L, req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("ventas-costos", resp.getBody().getFormula());
        assertEquals(95.0, resp.getBody().getMeta());
        assertNotNull(resp.getBody().getFechaActualizacion());
    }
}
