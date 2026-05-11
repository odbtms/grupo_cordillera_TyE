package com.grupocordillera.datos.controller;

import com.grupocordillera.datos.model.StockItem;
import com.grupocordillera.datos.repository.StockRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventas/stock")
public class StockController {

    private final StockRepository repository;

    public StockController(StockRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<StockItem> listarStock(@RequestParam(required = false) String sucursal) {
        if (sucursal == null || sucursal.isBlank()) {
            return repository.findAll();
        }
        return repository.findBySucursalIgnoreCase(sucursal);
    }

    @PostMapping
    public ResponseEntity<StockItem> upsertStock(@RequestBody StockItem payload) {
        if (payload.getSucursal() == null || payload.getSucursal().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (payload.getCategoria() == null || payload.getCategoria().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (payload.getProducto() == null || payload.getProducto().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (payload.getCantidad() == null || payload.getCantidad() < 0) {
            return ResponseEntity.badRequest().build();
        }

        StockItem item = repository
                .findBySucursalIgnoreCaseAndCategoriaIgnoreCaseAndProductoIgnoreCase(
                        payload.getSucursal(),
                        payload.getCategoria(),
                        payload.getProducto())
                .map(existing -> {
                    existing.setCantidad(payload.getCantidad());
                    return existing;
                })
                .orElseGet(() -> {
                    StockItem nuevo = new StockItem();
                    nuevo.setSucursal(payload.getSucursal().trim());
                    nuevo.setCategoria(payload.getCategoria().trim());
                    nuevo.setProducto(payload.getProducto().trim());
                    nuevo.setCantidad(payload.getCantidad());
                    return nuevo;
                });

        return ResponseEntity.ok(repository.save(item));
    }
}
