package com.grupocordillera.reportes.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa la configuración visual y metadata de un reporte (Dashboard).
 * Mapeada a la tabla "plantillas_reporte".
 */
@Entity
@Table(name = "plantillas_reporte")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantillaReporte {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // ID autogenerado
    
    private String titulo; // Título visible del reporte
    
    private String configuracionVisual; // Objeto JSON o String con la configuración de gráficos
    
    private String estado; // Estado de la plantilla (ej. Activo, Inactivo)
}
