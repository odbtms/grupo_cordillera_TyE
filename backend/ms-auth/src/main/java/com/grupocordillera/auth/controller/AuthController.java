package com.grupocordillera.auth.controller;

import com.grupocordillera.auth.model.Usuario;
import com.grupocordillera.auth.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository repository;

    public AuthController(UsuarioRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/login")
    public ResponseEntity<String> iniciarSesion(@RequestBody Usuario credentials) {
        // Simulación de generacion JWT según requerimiento
        return repository.findByUsername(credentials.getUsername())
                .filter(u -> u.getPassword().equals(credentials.getPassword()))
                .map(u -> ResponseEntity.ok("fake-jwt-token-para-" + u.getUsername()))
                .orElse(ResponseEntity.status(401).body("Credenciales invalidas"));
    }

    @GetMapping("/validar")
    public ResponseEntity<String> validarSesion(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok("Token valido: " + token);
    }

    @PutMapping("/usuarios/{id}/rol")
    public Usuario actualizarRol(@PathVariable Long id, @RequestBody Usuario request) {
        return repository.findById(id).map(u -> {
            u.setRol(request.getRol());
            return repository.save(u);
        }).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}
