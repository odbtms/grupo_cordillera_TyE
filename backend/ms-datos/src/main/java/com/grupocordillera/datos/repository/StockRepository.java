package com.grupocordillera.datos.repository;

import com.grupocordillera.datos.model.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<StockItem, Long> {
    
    /**
     * Busca todos los registros de stock filtrando por sucursal (ignora mayúsculas).
     */
    List<StockItem> findBySucursalIgnoreCase(String sucursal);

    Optional<StockItem> findBySucursalIgnoreCaseAndProductoIgnoreCase(String sucursal, String producto);

    /**
     * Busca un item de stock específico combinando sucursal, categoría y producto.
     * Útil para validar existencias al realizar un upsert.
     */
    Optional<StockItem> findBySucursalIgnoreCaseAndCategoriaIgnoreCaseAndProductoIgnoreCase(
            String sucursal,
            String categoria,
            String producto);

    @Modifying
    @Query("UPDATE StockItem s SET s.sucursal = :nuevo WHERE LOWER(s.sucursal) = LOWER(:antiguo)")
    void renombrarSucursal(@Param("antiguo") String antiguo, @Param("nuevo") String nuevo);
}
