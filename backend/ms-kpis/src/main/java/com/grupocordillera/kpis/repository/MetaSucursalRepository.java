package com.grupocordillera.kpis.repository;

import com.grupocordillera.kpis.model.MetaSucursal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MetaSucursalRepository extends JpaRepository<MetaSucursal, String> {
}
