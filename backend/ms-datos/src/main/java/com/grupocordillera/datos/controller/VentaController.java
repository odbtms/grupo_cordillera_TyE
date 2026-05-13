package com.grupocordillera.datos.controller;

import com.grupocordillera.datos.model.Venta;
import com.grupocordillera.datos.repository.VentaRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controlador REST para manejar el registro y consulta de ventas.
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaRepository repository;

    public VentaController(VentaRepository repository) {
        this.repository = repository;
    }

    /**
     * Endpoint para registrar una nueva venta en el sistema.
     * Si no se especifica la fecha de la venta, se asigna la fecha y hora actual.
     * 
     * @param venta Objeto Venta con los datos (monto, sucursal, etc.).
     * @return La venta guardada con su ID generado.
     */
    @PostMapping("/registrar")
    public Venta registrarVenta(@RequestBody Venta venta) {
        // Asigna la fecha actual si la petición no incluye una
        if (venta.getFechaVenta() == null) {
            venta.setFechaVenta(LocalDateTime.now());
        }
        // Guarda en base de datos
        return repository.save(venta);
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
