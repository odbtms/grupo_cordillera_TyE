package com.grupocordillera.datos.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stock_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sucursal;
    private String categoria;
    private String producto;
    private Integer cantidad;
    private Double precioUnitario;
    private String vendedor;
    private String fechaRegistro;
}
