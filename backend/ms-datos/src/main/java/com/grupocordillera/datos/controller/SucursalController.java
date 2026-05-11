package com.grupocordillera.datos.controller;

import com.grupocordillera.datos.model.Sucursal;
import com.grupocordillera.datos.repository.SucursalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventas/sucursales")
public class SucursalController {

    private final SucursalRepository repository;

    public SucursalController(SucursalRepository repository) {
        this.repository = repository;
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
                    if (sucursal.getMetaVenta() != null) {
                        existente.setMetaVenta(sucursal.getMetaVenta());
                    }
                    if (sucursal.getUbicacion() != null) {
                        existente.setUbicacion(sucursal.getUbicacion());
                    }
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
}
