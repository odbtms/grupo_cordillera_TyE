package com.grupocordillera.datos.repository;

import com.grupocordillera.datos.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
<<<<<<< HEAD
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
	List<Venta> findBySucursalIgnoreCase(String sucursal);
=======

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
}
