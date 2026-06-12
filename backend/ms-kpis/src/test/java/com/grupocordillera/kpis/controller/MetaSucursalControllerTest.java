package com.grupocordillera.kpis.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.grupocordillera.kpis.model.MetaSucursal;
import com.grupocordillera.kpis.repository.MetaSucursalRepository;
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
class MetaSucursalControllerTest {

    @Mock
    private MetaSucursalRepository repository;

    @InjectMocks
    private MetaSucursalController controller;

    @Test
    void listarMetasDelega() {
        when(repository.findAll()).thenReturn(List.of(new MetaSucursal()));
        assertEquals(1, controller.listarMetas().size());
    }

    @Test
    void upsertSinNombreRetorna400() {
        MetaSucursal req = new MetaSucursal();
        req.setNombreSucursal(" ");
        req.setMetaVenta(100.0);
        assertEquals(HttpStatus.BAD_REQUEST, controller.upsertMeta(req).getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void upsertConMetaNegativaRetorna400() {
        MetaSucursal req = new MetaSucursal();
        req.setNombreSucursal("Santiago");
        req.setMetaVenta(-1.0);
        assertEquals(HttpStatus.BAD_REQUEST, controller.upsertMeta(req).getStatusCode());
    }

    @Test
    void upsertNuevaMetaLaGuarda() {
        MetaSucursal req = new MetaSucursal();
        req.setNombreSucursal("Temuco");
        req.setMetaVenta(3000.0);
        when(repository.findById("Temuco")).thenReturn(Optional.empty());
        when(repository.save(any(MetaSucursal.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<MetaSucursal> resp = controller.upsertMeta(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("Temuco", resp.getBody().getNombreSucursal());
        assertEquals(3000.0, resp.getBody().getMetaVenta());
    }

    @Test
    void upsertMetaExistenteActualizaValor() {
        MetaSucursal existente = new MetaSucursal();
        existente.setNombreSucursal("Santiago");
        existente.setMetaVenta(1000.0);
        when(repository.findById("Santiago")).thenReturn(Optional.of(existente));
        when(repository.save(any(MetaSucursal.class))).thenAnswer(inv -> inv.getArgument(0));

        MetaSucursal req = new MetaSucursal();
        req.setNombreSucursal("Santiago");
        req.setMetaVenta(9999.0);

        ResponseEntity<MetaSucursal> resp = controller.upsertMeta(req);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(9999.0, resp.getBody().getMetaVenta());
    }
}
