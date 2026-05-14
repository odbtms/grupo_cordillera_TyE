package com.grupocordillera.kpis.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entidad que representa un Indicador Clave de Rendimiento (KPI).
 * Mapeada a la tabla "kpis" en la base de datos.
 */
@Entity
@Table(name = "kpis")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Kpi {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Identificador único del KPI
    
    private String nombre; // Nombre del indicador (ej. Ventas Totales)
    
    private String formula; // Fórmula matemática o lógica de negocio para su cálculo
    
    private Double meta;

    private Double valorCalculado; // Último valor numérico resultante del cálculo
    
    private LocalDateTime fechaActualizacion; // Fecha en la que se actualizó el valor o la fórmula
}
