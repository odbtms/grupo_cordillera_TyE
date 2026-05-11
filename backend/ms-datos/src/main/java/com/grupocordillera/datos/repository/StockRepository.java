package com.grupocordillera.datos.repository;

import com.grupocordillera.datos.model.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<StockItem, Long> {
    List<StockItem> findBySucursalIgnoreCase(String sucursal);

    Optional<StockItem> findBySucursalIgnoreCaseAndProductoIgnoreCase(String sucursal, String producto);

    Optional<StockItem> findBySucursalIgnoreCaseAndCategoriaIgnoreCaseAndProductoIgnoreCase(
            String sucursal,
            String categoria,
            String producto);
}
