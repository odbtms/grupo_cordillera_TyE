package com.grupocordillera.datos.controller;

import com.grupocordillera.datos.model.StockItem;
import com.grupocordillera.datos.repository.StockRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la gestión del inventario (stock) de la empresa.
 * Proporciona endpoints para consultar y actualizar el stock de productos en
 * las sucursales.
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/stock")
public class StockController {

    private final StockRepository repository;

    public StockController(StockRepository repository) {
        this.repository = repository;
    }

    /**
     * Obtiene la lista del stock disponible.
     * Si se provee el parámetro 'sucursal', filtra los resultados por esa sucursal.
     * De lo contrario, retorna el inventario de todas las sucursales.
     * 
     * @param sucursal (Opcional) Nombre de la sucursal para filtrar.
     * @return Lista de items en stock.
     */
    @GetMapping
    public List<StockItem> listarStock(@RequestParam(required = false) String sucursal) {
        // Retorna todo si no hay filtro de sucursal
        if (sucursal == null || sucursal.isBlank()) {
            return repository.findAll();
        }
        // Filtra por el nombre de la sucursal ignorando mayúsculas/minúsculas
        return repository.findBySucursalIgnoreCase(sucursal);
    }

    /**
     * Endpoint para insertar o actualizar (upsert) la cantidad de un producto en
     * stock.
     * Busca si ya existe un registro con la misma sucursal, categoría y producto.
     * Si existe, actualiza la cantidad; si no, crea un nuevo registro.
     * 
     * @param payload Objeto StockItem con los datos a guardar.
     * @return El item de stock guardado o un error 400 si faltan datos.
     */
    @PostMapping
    public ResponseEntity<StockItem> upsertStock(@RequestBody StockItem payload) {
        // Validaciones de campos obligatorios para el upsert
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

        // Intenta buscar el item exacto en la base de datos
        StockItem item = repository
                .findBySucursalIgnoreCaseAndCategoriaIgnoreCaseAndProductoIgnoreCase(
                        payload.getSucursal(),
                        payload.getCategoria(),
                        payload.getProducto())
                .map(existing -> {
                    // Si existe, solo actualiza la cantidad
                    existing.setCantidad(payload.getCantidad());
                    return existing;
                })
                .orElseGet(() -> {
                    // Si no existe, crea una nueva entidad y la mapea
                    StockItem nuevo = new StockItem();
                    nuevo.setSucursal(payload.getSucursal().trim());
                    nuevo.setCategoria(payload.getCategoria().trim());
                    nuevo.setProducto(payload.getProducto().trim());
                    nuevo.setCantidad(payload.getCantidad());
                    return nuevo;
                });

        // Guarda el item (nuevo o actualizado) y lo retorna en la respuesta
        return ResponseEntity.ok(repository.save(item));
    }
}
