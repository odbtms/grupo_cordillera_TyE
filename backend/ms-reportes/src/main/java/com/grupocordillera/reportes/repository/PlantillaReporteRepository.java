package com.grupocordillera.reportes.repository;

import com.grupocordillera.reportes.model.PlantillaReporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlantillaReporteRepository extends JpaRepository<PlantillaReporte, Long> {
}
