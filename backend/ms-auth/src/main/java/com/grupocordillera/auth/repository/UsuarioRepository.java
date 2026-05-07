package com.grupocordillera.auth.repository;

import com.grupocordillera.auth.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
<<<<<<< HEAD
    Optional<Usuario> findByEmail(String email);
=======
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
}
