package com.grupocordillera.kpis.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "metas_sucursal")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MetaSucursal {
    @Id
    private String nombreSucursal;
    private Double metaVenta;
}
