package com.grupocordillera.datos.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad que representa una Venta realizada en el sistema.
 * Mapeada a la tabla "ventas" en la base de datos.
 */
@Entity
@Table(name = "ventas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Identificador único de la venta

    private LocalDateTime fechaVenta; // Fecha y hora exacta en que ocurrió la venta

    private Double montoTotal; // Monto total recaudado en la venta

    // Ej: "Punto de Venta 1", "Ecommerce"
    private String sistemaOrigen; // Origen desde donde se registró la transacción

    private String sucursal; // Sucursal donde se efectuó la venta
}
