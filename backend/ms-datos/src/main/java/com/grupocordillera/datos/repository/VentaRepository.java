package com.grupocordillera.datos.repository;

import com.grupocordillera.datos.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
	List<Venta> findBySucursalIgnoreCase(String sucursal);
}
