package com.grupocordillera.reportes.repository;

import com.grupocordillera.reportes.model.PlantillaReporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositorio de acceso a datos para la entidad PlantillaReporte.
 */
@Repository
public interface PlantillaReporteRepository extends JpaRepository<PlantillaReporte, Long> {
}
