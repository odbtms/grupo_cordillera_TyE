package com.grupocordillera.datos.controller;

import com.grupocordillera.datos.model.Venta;
import com.grupocordillera.datos.repository.VentaRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaRepository repository;

    public VentaController(VentaRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/registrar")
    public Venta registrarVenta(@RequestBody Venta venta) {
        if (venta.getFechaVenta() == null) {
            venta.setFechaVenta(LocalDateTime.now());
        }
        return repository.save(venta);
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
