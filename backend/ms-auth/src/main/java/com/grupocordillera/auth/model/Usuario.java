package com.grupocordillera.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
<<<<<<< HEAD
    private String email;
    private String password;
    private String rol;
    private String sucursal;
=======
    private String password;
    private String rol;
>>>>>>> 93e87e3276ccc1ff701331e8189e228a166448db
}
