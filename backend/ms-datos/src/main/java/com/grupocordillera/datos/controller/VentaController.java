package com.grupocordillera.datos.controller;

import com.grupocordillera.datos.model.Venta;
import com.grupocordillera.datos.repository.VentaRepository;
import com.grupocordillera.datos.repository.SucursalRepository;
import com.grupocordillera.datos.repository.StockRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaRepository repository;
    private final SucursalRepository sucursalRepository;
    private final StockRepository stockRepository;

    public VentaController(VentaRepository repository,
                           SucursalRepository sucursalRepository,
                           StockRepository stockRepository) {
        this.repository = repository;
        this.sucursalRepository = sucursalRepository;
        this.stockRepository = stockRepository;
    }

    @PostMapping("/registrar")
    public ResponseEntity<Venta> registrarVenta(@RequestBody Venta venta) {
        if (venta.getFechaVenta() == null) {
            venta.setFechaVenta(LocalDateTime.now());
        } else {
            LocalDateTime seisMesesAtras = LocalDateTime.now().minusMonths(6);
            if (venta.getFechaVenta().isAfter(LocalDateTime.now()) || venta.getFechaVenta().isBefore(seisMesesAtras)) {
                return ResponseEntity.badRequest().build();
            }
        }

        if (venta.getMontoTotal() == null || venta.getMontoTotal() < 0) {
            return ResponseEntity.badRequest().build();
        }

        if (venta.getSucursal() == null || !sucursalRepository.existsByNombreIgnoreCase(venta.getSucursal())) {
            return ResponseEntity.badRequest().build();
        }

        // Descontar stock automáticamente
        if (venta.getProducto() != null && venta.getCantidad() != null) {
            stockRepository.findBySucursalIgnoreCaseAndProductoIgnoreCase(venta.getSucursal(), venta.getProducto())
                    .ifPresent(stock -> {
                        int nuevoStock = stock.getCantidad() - venta.getCantidad();
                        stock.setCantidad(Math.max(0, nuevoStock)); // No permitir stock negativo
                        stockRepository.save(stock);
                    });
        }

        return ResponseEntity.ok(repository.save(venta));
    }

    @GetMapping
    public List<Venta> listarVentas() {
        return repository.findAll();
    }

    @GetMapping("/sucursal/{sucursal}")
    public List<Venta> listarVentasPorSucursal(@PathVariable String sucursal) {
        return repository.findBySucursalIgnoreCase(sucursal);
    }
}
