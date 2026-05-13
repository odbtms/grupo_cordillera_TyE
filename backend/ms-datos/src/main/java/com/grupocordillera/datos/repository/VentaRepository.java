package com.grupocordillera.datos.repository;

import com.grupocordillera.datos.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repositorio de acceso a datos para la entidad Venta.
 */
@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    
    /**
     * Busca todas las ventas filtrando por sucursal (ignora mayúsculas/minúsculas).
     */
	List<Venta> findBySucursalIgnoreCase(String sucursal);
}
