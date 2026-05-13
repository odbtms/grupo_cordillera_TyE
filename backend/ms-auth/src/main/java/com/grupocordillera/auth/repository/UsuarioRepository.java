package com.grupocordillera.auth.repository;

import com.grupocordillera.auth.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio para la gestión de acceso a datos de la entidad Usuario.
 * Extiende de JpaRepository para heredar operaciones CRUD y de paginación/ordenamiento.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    /**
     * Busca un usuario por su nombre de usuario.
     * @param username El nombre de usuario a buscar.
     * @return Un Optional que contiene el usuario si se encuentra.
     */
    Optional<Usuario> findByUsername(String username);
    
    /**
     * Busca un usuario por su correo electrónico.
     * @param email El correo electrónico a buscar.
     * @return Un Optional que contiene el usuario si se encuentra.
     */
    Optional<Usuario> findByEmail(String email);
}
