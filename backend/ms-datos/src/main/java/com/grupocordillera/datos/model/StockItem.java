package com.grupocordillera.datos.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa un registro de inventario (Stock) de un producto.
 * Mapeada a la tabla "stock_items".
 */
@Entity
@Table(name = "stock_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // ID autogenerado

    private String sucursal; // Sucursal donde se encuentra el stock (ej. Santiago)
    private String categoria; // Categoría del producto (ej. Herramientas)
    private String producto; // Nombre del producto (ej. Taladro)
    private Integer cantidad; // Cantidad de unidades disponibles en stock
    private Double precioUnitario;
    private String vendedor;
    private String fechaRegistro;
}
