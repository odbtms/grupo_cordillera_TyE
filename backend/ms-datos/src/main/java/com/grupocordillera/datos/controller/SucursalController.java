package com.grupocordillera.datos.controller;

import com.grupocordillera.datos.model.Sucursal;
import com.grupocordillera.datos.repository.SucursalRepository;
import com.grupocordillera.datos.repository.VentaRepository;
import com.grupocordillera.datos.repository.StockRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ventas/sucursales")
public class SucursalController {

    private final SucursalRepository repository;
    private final VentaRepository ventaRepository;
    private final StockRepository stockRepository;

    public SucursalController(SucursalRepository repository, VentaRepository ventaRepository, StockRepository stockRepository) {
        this.repository = repository;
        this.ventaRepository = ventaRepository;
        this.stockRepository = stockRepository;
    }

    @GetMapping
    public List<Sucursal> listarSucursales() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<Sucursal> registrarSucursal(@RequestBody Sucursal sucursal) {
        if (sucursal.getNombre() == null || sucursal.getNombre().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return repository.findByNombreIgnoreCase(sucursal.getNombre())
                .map(existente -> {
                    if (sucursal.getMetaVenta() != null) existente.setMetaVenta(sucursal.getMetaVenta());
                    if (sucursal.getUbicacion() != null) existente.setUbicacion(sucursal.getUbicacion());
                    return ResponseEntity.ok(repository.save(existente));
                })
                .orElseGet(() -> ResponseEntity.ok(repository.save(sucursal)));
    }

    @PutMapping("/{id}/meta")
    public ResponseEntity<Sucursal> actualizarMeta(@PathVariable Long id, @RequestBody Double meta) {
        return repository.findById(id).map(s -> {
            s.setMetaVenta(meta);
            return ResponseEntity.ok(repository.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @PutMapping("/{id}/nombre")
    public ResponseEntity<Sucursal> renombrarSucursal(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String nuevoNombre = body.get("nombre");
        if (nuevoNombre == null || nuevoNombre.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return repository.findById(id).map(s -> {
            String nombreAntiguo = s.getNombre();
            s.setNombre(nuevoNombre);
            Sucursal guardada = repository.save(s);
            ventaRepository.renombrarSucursal(nombreAntiguo, nuevoNombre);
            stockRepository.renombrarSucursal(nombreAntiguo, nuevoNombre);
            return ResponseEntity.ok(guardada);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarSucursal(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
