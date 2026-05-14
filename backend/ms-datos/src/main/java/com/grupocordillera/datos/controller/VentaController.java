package com.grupocordillera.datos.controller;

import com.grupocordillera.datos.model.Venta;
import com.grupocordillera.datos.repository.VentaRepository;
import com.grupocordillera.datos.repository.SucursalRepository;
import com.grupocordillera.datos.repository.StockRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controlador REST para manejar el registro y consulta de ventas.
 */
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

    /**
     * Endpoint para registrar una nueva venta en el sistema.
     * Si no se especifica la fecha de la venta, se asigna la fecha y hora actual.
     * 
     * @param venta Objeto Venta con los datos (monto, sucursal, etc.).
     * @return La venta guardada con su ID generado.
     */
    @PostMapping("/registrar")
    public ResponseEntity<Venta> registrarVenta(@RequestBody Venta venta) {
        // Asigna la fecha actual si la petición no incluye una
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

        // Descontar stock automáticamente con validación estricta
        if (venta.getProducto() != null && venta.getCantidad() != null) {
            var stockOpt = stockRepository.findBySucursalIgnoreCaseAndProductoIgnoreCase(venta.getSucursal(), venta.getProducto());
            
            if (stockOpt.isEmpty() || stockOpt.get().getCantidad() < venta.getCantidad()) {
                return ResponseEntity.badRequest().build(); // No hay stock suficiente
            }
            
            stockOpt.ifPresent(stock -> {
                stock.setCantidad(stock.getCantidad() - venta.getCantidad());
                stockRepository.save(stock);
            });
        }

        // Guarda en base de datos
        return ResponseEntity.ok(repository.save(venta));
    }

    /**
     * Obtiene el listado completo de todas las ventas registradas.
     * @return Lista de ventas.
     */
    @GetMapping
    public List<Venta> listarVentas() {
        return repository.findAll();
    }

    /**
     * Obtiene el listado de ventas filtrado por una sucursal específica.
     * 
     * @param sucursal El nombre de la sucursal a consultar.
     * @return Lista de ventas correspondientes a la sucursal indicada.
     */
    @GetMapping("/sucursal/{sucursal}")
    public List<Venta> listarVentasPorSucursal(@PathVariable String sucursal) {
        return repository.findBySucursalIgnoreCase(sucursal);
    }
}
