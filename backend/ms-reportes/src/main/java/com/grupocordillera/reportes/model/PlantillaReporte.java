package com.grupocordillera.reportes.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "plantillas_reporte")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantillaReporte {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titulo;
    private String configuracionVisual;
    private String estado;
}
