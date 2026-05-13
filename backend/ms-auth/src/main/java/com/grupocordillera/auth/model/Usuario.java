package com.grupocordillera.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa a un Usuario dentro del sistema.
 * Está mapeada a la tabla "usuarios" en la base de datos relacional.
 */
@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Identificador único auto-generado
    
    private String username; // Nombre de usuario para inicio de sesión
    private String email;    // Correo electrónico del usuario
    private String password; // Contraseña encriptada
    private String rol;      // Rol de acceso en el sistema (ej. ADMIN, EJECUTIVO)
    private String sucursal; // Sucursal a la cual está asignado el usuario (si aplica)
}
