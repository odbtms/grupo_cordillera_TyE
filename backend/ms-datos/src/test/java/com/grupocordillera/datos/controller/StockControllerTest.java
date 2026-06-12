package com.grupocordillera.datos.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.grupocordillera.datos.model.StockItem;
import com.grupocordillera.datos.repository.StockRepository;
import com.grupocordillera.datos.repository.SucursalRepository;
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
class StockControllerTest {

    @Mock
    private StockRepository repository;
    @Mock
    private SucursalRepository sucursalRepository;

    @InjectMocks
    private StockController controller;

    private StockItem payloadValido() {
        StockItem s = new StockItem();
        s.setSucursal("Santiago");
        s.setCategoria("Electronica");
        s.setProducto("Mouse");
        s.setCantidad(20);
        return s;
    }

    @Test
    void listarSinSucursalRetornaTodo() {
        when(repository.findAll()).thenReturn(List.of(new StockItem(), new StockItem()));
        assertEquals(2, controller.listarStock(null).size());
    }

    @Test
    void listarConSucursalFiltra() {
        when(repository.findBySucursalIgnoreCase("Temuco")).thenReturn(List.of(new StockItem()));
        assertEquals(1, controller.listarStock("Temuco").size());
    }

    @Test
    void upsertSinSucursalRetorna400() {
        StockItem p = payloadValido();
        p.setSucursal("  ");
        assertEquals(HttpStatus.BAD_REQUEST, controller.upsertStock(p).getStatusCode());
    }

    @Test
    void upsertConSucursalInexistenteRetorna400() {
        StockItem p = payloadValido();
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(false);
        assertEquals(HttpStatus.BAD_REQUEST, controller.upsertStock(p).getStatusCode());
    }

    @Test
    void upsertConCategoriaInvalidaRetorna400() {
        StockItem p = payloadValido();
        p.setCategoria("Juguetes");
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(true);
        assertEquals(HttpStatus.BAD_REQUEST, controller.upsertStock(p).getStatusCode());
    }

    @Test
    void upsertSinProductoRetorna400() {
        StockItem p = payloadValido();
        p.setProducto(null);
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(true);
        assertEquals(HttpStatus.BAD_REQUEST, controller.upsertStock(p).getStatusCode());
    }

    @Test
    void upsertConCantidadNegativaRetorna400() {
        StockItem p = payloadValido();
        p.setCantidad(-5);
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(true);
        assertEquals(HttpStatus.BAD_REQUEST, controller.upsertStock(p).getStatusCode());
    }

    @Test
    void upsertNuevoCreaRegistro() {
        StockItem p = payloadValido();
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(true);
        when(repository.findBySucursalIgnoreCaseAndCategoriaIgnoreCaseAndProductoIgnoreCase(
                "Santiago", "Electronica", "Mouse")).thenReturn(Optional.empty());
        when(repository.save(any(StockItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<StockItem> resp = controller.upsertStock(p);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(20, resp.getBody().getCantidad());
    }

    @Test
    void upsertExistenteActualizaCantidad() {
        StockItem p = payloadValido();
        p.setCantidad(99);
        p.setPrecioUnitario(1500.0);
        p.setFechaRegistro("2026-01-01");
        p.setVendedor("Lucia");
        StockItem existente = payloadValido();
        existente.setId(3L);
        existente.setCantidad(20);
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(true);
        when(repository.findBySucursalIgnoreCaseAndCategoriaIgnoreCaseAndProductoIgnoreCase(
                "Santiago", "Electronica", "Mouse")).thenReturn(Optional.of(existente));
        when(repository.save(any(StockItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<StockItem> resp = controller.upsertStock(p);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(99, resp.getBody().getCantidad());
        assertEquals(3L, resp.getBody().getId()); // reutiliza el registro existente
    }
}
