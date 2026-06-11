package com.grupocordillera.datos.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.grupocordillera.datos.model.Sucursal;
import com.grupocordillera.datos.repository.StockRepository;
import com.grupocordillera.datos.repository.SucursalRepository;
import com.grupocordillera.datos.repository.VentaRepository;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class SucursalControllerTest {

    @Mock
    private SucursalRepository repository;
    @Mock
    private VentaRepository ventaRepository;
    @Mock
    private StockRepository stockRepository;

    @InjectMocks
    private SucursalController controller;

    @Test
    void registrarSinNombreRetorna400() {
        Sucursal s = new Sucursal();
        s.setNombre("   ");
        assertEquals(HttpStatus.BAD_REQUEST, controller.registrarSucursal(s).getStatusCode());
    }

    @Test
    void registrarSucursalNuevaLaGuarda() {
        Sucursal s = new Sucursal();
        s.setNombre("Iquique");
        when(repository.findByNombreIgnoreCase("Iquique")).thenReturn(Optional.empty());
        when(repository.save(s)).thenReturn(s);

        ResponseEntity<Sucursal> resp = controller.registrarSucursal(s);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        verify(repository).save(s);
    }

    @Test
    void registrarSucursalExistenteActualizaMeta() {
        Sucursal entrante = new Sucursal();
        entrante.setNombre("Santiago");
        entrante.setMetaVenta(5000.0);
        entrante.setUbicacion("Centro");
        Sucursal existente = new Sucursal();
        existente.setId(1L);
        existente.setNombre("Santiago");
        when(repository.findByNombreIgnoreCase("Santiago")).thenReturn(Optional.of(existente));
        when(repository.save(any(Sucursal.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<Sucursal> resp = controller.registrarSucursal(entrante);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(5000.0, resp.getBody().getMetaVenta());
        assertEquals(1L, resp.getBody().getId());
    }

    @Test
    void actualizarMetaDeSucursalExistente() {
        Sucursal s = new Sucursal();
        s.setId(2L);
        when(repository.findById(2L)).thenReturn(Optional.of(s));
        when(repository.save(any(Sucursal.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<Sucursal> resp = controller.actualizarMeta(2L, 8000.0);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(8000.0, resp.getBody().getMetaVenta());
    }

    @Test
    void actualizarMetaSucursalInexistenteRetorna404() {
        when(repository.findById(9L)).thenReturn(Optional.empty());
        assertEquals(HttpStatus.NOT_FOUND, controller.actualizarMeta(9L, 1.0).getStatusCode());
    }

    @Test
    void renombrarSinNombreRetorna400() {
        ResponseEntity<Sucursal> resp = controller.renombrarSucursal(1L, Map.of("nombre", ""));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void renombrarPropagaCambioAVentasYStock() {
        Sucursal s = new Sucursal();
        s.setId(1L);
        s.setNombre("Santiago");
        when(repository.findById(1L)).thenReturn(Optional.of(s));
        when(repository.save(any(Sucursal.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<Sucursal> resp =
                controller.renombrarSucursal(1L, Map.of("nombre", "Santiago Centro"));

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("Santiago Centro", resp.getBody().getNombre());
        verify(ventaRepository).renombrarSucursal("Santiago", "Santiago Centro");
        verify(stockRepository).renombrarSucursal("Santiago", "Santiago Centro");
    }

    @Test
    void renombrarSucursalInexistenteRetorna404() {
        when(repository.findById(9L)).thenReturn(Optional.empty());
        ResponseEntity<Sucursal> resp =
                controller.renombrarSucursal(9L, Map.of("nombre", "X"));
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }

    @Test
    void eliminarSucursalExistenteRetorna204() {
        when(repository.existsById(1L)).thenReturn(true);
        assertEquals(HttpStatus.NO_CONTENT, controller.eliminarSucursal(1L).getStatusCode());
        verify(repository).deleteById(1L);
    }

    @Test
    void eliminarSucursalInexistenteRetorna404() {
        when(repository.existsById(9L)).thenReturn(false);
        assertEquals(HttpStatus.NOT_FOUND, controller.eliminarSucursal(9L).getStatusCode());
        verify(repository, never()).deleteById(any());
    }
}
