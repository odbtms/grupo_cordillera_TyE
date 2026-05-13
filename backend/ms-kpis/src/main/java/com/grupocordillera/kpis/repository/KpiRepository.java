package com.grupocordillera.kpis.repository;

import com.grupocordillera.kpis.model.Kpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositorio de acceso a datos para la entidad Kpi.
 */
@Repository
public interface KpiRepository extends JpaRepository<Kpi, Long> {
}
