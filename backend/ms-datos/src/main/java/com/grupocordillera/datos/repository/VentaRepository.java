package com.grupocordillera.datos.repository;

import com.grupocordillera.datos.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {

    List<Venta> findBySucursalIgnoreCase(String sucursal);

    @Modifying
    @Query("UPDATE Venta v SET v.sucursal = :nuevo WHERE LOWER(v.sucursal) = LOWER(:antiguo)")
    void renombrarSucursal(@Param("antiguo") String antiguo, @Param("nuevo") String nuevo);
}
