package com.grupocordillera.datos.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.grupocordillera.datos.model.StockItem;
import com.grupocordillera.datos.model.Venta;
import com.grupocordillera.datos.repository.StockRepository;
import com.grupocordillera.datos.repository.SucursalRepository;
import com.grupocordillera.datos.repository.VentaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class VentaControllerTest {

    @Mock
    private VentaRepository repository;
    @Mock
    private SucursalRepository sucursalRepository;
    @Mock
    private StockRepository stockRepository;

    @InjectMocks
    private VentaController controller;

    private Venta ventaValida() {
        Venta v = new Venta();
        v.setFechaVenta(LocalDateTime.now().minusDays(1));
        v.setMontoTotal(1000.0);
        v.setSucursal("Santiago");
        return v;
    }

    @Test
    void asignaFechaSiNoVieneEnElPayload() {
        Venta venta = new Venta();
        venta.setFechaVenta(null);
        venta.setMontoTotal(1000.0);
        venta.setSucursal("Santiago");
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(true);
        when(repository.save(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));

        controller.registrarVenta(venta);

        ArgumentCaptor<Venta> captor = ArgumentCaptor.forClass(Venta.class);
        verify(repository).save(captor.capture());
        assertNotNull(captor.getValue().getFechaVenta());
    }

    @Test
    void rechazaFechaEnElFuturo() {
        Venta venta = ventaValida();
        venta.setFechaVenta(LocalDateTime.now().plusDays(2));

        ResponseEntity<Venta> resp = controller.registrarVenta(venta);

        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void rechazaFechaDeMasDeSeisMeses() {
        Venta venta = ventaValida();
        venta.setFechaVenta(LocalDateTime.now().minusMonths(7));

        ResponseEntity<Venta> resp = controller.registrarVenta(venta);

        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void rechazaMontoNegativo() {
        Venta venta = ventaValida();
        venta.setMontoTotal(-1.0);

        ResponseEntity<Venta> resp = controller.registrarVenta(venta);

        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void rechazaSucursalInexistente() {
        Venta venta = ventaValida();
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(false);

        ResponseEntity<Venta> resp = controller.registrarVenta(venta);

        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void rechazaVentaSiNoHayStockSuficiente() {
        Venta venta = ventaValida();
        venta.setProducto("Mouse");
        venta.setCantidad(5);
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(true);
        StockItem stock = new StockItem();
        stock.setCantidad(2);
        when(stockRepository.findBySucursalIgnoreCaseAndProductoIgnoreCase("Santiago", "Mouse"))
                .thenReturn(Optional.of(stock));

        ResponseEntity<Venta> resp = controller.registrarVenta(venta);

        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void descuentaStockEnVentaValida() {
        Venta venta = ventaValida();
        venta.setProducto("Mouse");
        venta.setCantidad(3);
        when(sucursalRepository.existsByNombreIgnoreCase("Santiago")).thenReturn(true);
        StockItem stock = new StockItem();
        stock.setCantidad(10);
        when(stockRepository.findBySucursalIgnoreCaseAndProductoIgnoreCase("Santiago", "Mouse"))
                .thenReturn(Optional.of(stock));
        when(repository.save(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<Venta> resp = controller.registrarVenta(venta);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(7, stock.getCantidad()); // 10 - 3
        verify(stockRepository).save(stock);
    }

    @Test
    void listarVentasDelegaEnRepositorio() {
        when(repository.findAll()).thenReturn(List.of(new Venta(), new Venta()));
        assertEquals(2, controller.listarVentas().size());
    }

    @Test
    void listarVentasPorSucursalDelega() {
        when(repository.findBySucursalIgnoreCase("Temuco")).thenReturn(List.of(new Venta()));
        assertEquals(1, controller.listarVentasPorSucursal("Temuco").size());
    }

    @Test
    void editarVentaInexistenteRetorna404() {
        when(repository.findById(50L)).thenReturn(Optional.empty());
        ResponseEntity<Venta> resp = controller.editarVenta(50L, new Venta());
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }

    @Test
    void editarVentaActualizaCampos() {
        Venta existente = ventaValida();
        existente.setId(5L);
        when(repository.findById(5L)).thenReturn(Optional.of(existente));
        when(repository.save(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));

        Venta cambios = new Venta();
        cambios.setMontoTotal(2000.0);
        cambios.setFechaVenta(LocalDateTime.now().minusDays(2));
        cambios.setSucursal("Temuco");
        cambios.setVendedor("Pedro");
        cambios.setCategoria("Hogar");
        cambios.setProducto("Olla");
        cambios.setPrecioUnitario(999.0);

        ResponseEntity<Venta> resp = controller.editarVenta(5L, cambios);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(2000.0, resp.getBody().getMontoTotal());
        assertEquals("Temuco", resp.getBody().getSucursal());
        assertEquals("Pedro", resp.getBody().getVendedor());
        assertEquals("Hogar", resp.getBody().getCategoria());
        assertEquals("Olla", resp.getBody().getProducto());
        assertEquals(999.0, resp.getBody().getPrecioUnitario());
    }

    @Test
    void editarVentaRestauraStockOriginalYDescuentaElNuevo() {
        Venta existente = ventaValida();
        existente.setId(5L);
        existente.setProducto("Mouse");
        existente.setCantidad(2);
        when(repository.findById(5L)).thenReturn(Optional.of(existente));
        StockItem stock = new StockItem();
        stock.setCantidad(10);
        when(stockRepository.findBySucursalIgnoreCaseAndProductoIgnoreCase("Santiago", "Mouse"))
                .thenReturn(Optional.of(stock));
        when(repository.save(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));

        Venta cambios = new Venta();
        cambios.setCantidad(5); // antes 2 -> restaura +2 (12), luego descuenta 5 (7)

        ResponseEntity<Venta> resp = controller.editarVenta(5L, cambios);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(7, stock.getCantidad());
    }

    @Test
    void eliminarVentaConProductoRestauraStock() {
        Venta v = ventaValida();
        v.setId(8L);
        v.setProducto("Mouse");
        v.setCantidad(4);
        when(repository.findById(8L)).thenReturn(Optional.of(v));
        StockItem stock = new StockItem();
        stock.setCantidad(6);
        when(stockRepository.findBySucursalIgnoreCaseAndProductoIgnoreCase("Santiago", "Mouse"))
                .thenReturn(Optional.of(stock));

        ResponseEntity<Void> resp = controller.eliminarVenta(8L);

        assertEquals(HttpStatus.NO_CONTENT, resp.getStatusCode());
        assertEquals(10, stock.getCantidad()); // 6 + 4 restaurado
        verify(repository).delete(v);
    }

    @Test
    void eliminarVentaExistenteRetorna204() {
        Venta v = ventaValida();
        v.setId(8L);
        when(repository.findById(8L)).thenReturn(Optional.of(v));

        ResponseEntity<Void> resp = controller.eliminarVenta(8L);

        assertEquals(HttpStatus.NO_CONTENT, resp.getStatusCode());
        verify(repository).delete(v);
    }

    @Test
    void eliminarVentaInexistenteRetorna404() {
        when(repository.findById(8L)).thenReturn(Optional.empty());
        ResponseEntity<Void> resp = controller.eliminarVenta(8L);
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }
}
