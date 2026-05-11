package com.grupocordillera.kpis.controller;

import com.grupocordillera.kpis.model.MetaSucursal;
import com.grupocordillera.kpis.repository.MetaSucursalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kpis/metas")
public class MetaSucursalController {

    private final MetaSucursalRepository repository;

    public MetaSucursalController(MetaSucursalRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<MetaSucursal> listarMetas() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<MetaSucursal> upsertMeta(@RequestBody MetaSucursal request) {
        if (request.getNombreSucursal() == null || request.getNombreSucursal().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.getMetaVenta() == null || request.getMetaVenta() < 0) {
            return ResponseEntity.badRequest().build();
        }

        MetaSucursal meta = repository.findById(request.getNombreSucursal()).orElse(new MetaSucursal());
        meta.setNombreSucursal(request.getNombreSucursal().trim());
        meta.setMetaVenta(request.getMetaVenta());

        return ResponseEntity.ok(repository.save(meta));
    }
}
