package com.grupocordillera.auth.controller;

import com.grupocordillera.auth.dto.LoginRequest;
import com.grupocordillera.auth.dto.LoginResponse;
import com.grupocordillera.auth.dto.RegisterRequest;
import com.grupocordillera.auth.model.Usuario;
import com.grupocordillera.auth.repository.UsuarioRepository;
import com.grupocordillera.auth.service.JwtService;
import io.jsonwebtoken.JwtException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository repository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            UsuarioRepository repository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> iniciarSesion(@RequestBody LoginRequest credentials) {
        return repository.findByUsername(credentials.username())
                .filter(u -> passwordEncoder.matches(credentials.password(), u.getPassword()))
                .map(u -> {
                    String token = jwtService.generateToken(u.getUsername(), u.getRol());
                    LoginResponse response = new LoginResponse(
                            token,
                            u.getUsername(),
                            u.getRol(),
                            u.getSucursal());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(401).build());
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> registrarUsuario(@RequestBody RegisterRequest request) {
        if (request.username() == null || request.username().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        if (repository.findByUsername(request.username()).isPresent()) {
            return ResponseEntity.status(409).build();
        }
        if (repository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(409).build();
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(request.username().trim());
        usuario.setEmail(request.email().trim());
        usuario.setPassword(passwordEncoder.encode(request.password()));
        
        String rolAsignado = request.rol() != null ? request.rol().trim().toUpperCase() : "";
        if (!rolAsignado.equals("ADMIN") && !rolAsignado.equals("EMPLEADO_TIENDA")) {
            return ResponseEntity.badRequest().build();
        }
        usuario.setRol(rolAsignado);

        usuario.setSucursal(request.sucursal() == null || request.sucursal().isBlank() 
                ? null 
                : request.sucursal().trim());

        Usuario saved = repository.save(usuario);

        String token = jwtService.generateToken(saved.getUsername(), saved.getRol());
        LoginResponse response = new LoginResponse(
                token,
                saved.getUsername(),
                saved.getRol(),
                saved.getSucursal());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validar")
    public ResponseEntity<LoginResponse> validarSesion(@RequestHeader("Authorization") String token) {
        String rawToken = token != null && token.startsWith("Bearer ")
                ? token.substring(7)
                : token;
        try {
            String username = jwtService.parseToken(rawToken).getBody().getSubject();
            return repository.findByUsername(username)
                    .map(u -> {
                        LoginResponse response = new LoginResponse(
                                rawToken,
                                u.getUsername(),
                                u.getRol(),
                                u.getSucursal());
                        return ResponseEntity.ok(response);
                    })
                    .orElse(ResponseEntity.status(401).build());
        } catch (JwtException | IllegalArgumentException ex) {
            return ResponseEntity.status(401).build();
        }
    }

    public record RolRequest(String rol) {}

    @PutMapping("/usuarios/{id}/rol")
    public ResponseEntity<Usuario> actualizarRol(@PathVariable Long id, @RequestBody RolRequest request) {
        if (request.rol() == null || (!request.rol().trim().toUpperCase().equals("ADMIN") && !request.rol().trim().toUpperCase().equals("EMPLEADO_TIENDA"))) {
            return ResponseEntity.badRequest().build();
        }
        return repository.findById(id).map(u -> {
            u.setRol(request.rol().trim().toUpperCase());
            return ResponseEntity.ok(repository.save(u));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/usuarios/username/{username}/rol")
    public ResponseEntity<Usuario> actualizarRolPorUsername(
            @PathVariable String username,
            @RequestBody RolRequest request) {
        if (request.rol() == null || (!request.rol().trim().toUpperCase().equals("ADMIN") && !request.rol().trim().toUpperCase().equals("EMPLEADO_TIENDA"))) {
            return ResponseEntity.badRequest().build();
        }
        return repository.findByUsername(username).map(u -> {
            u.setRol(request.rol().trim().toUpperCase());
            return ResponseEntity.ok(repository.save(u));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuarios")
    public ResponseEntity<java.util.List<Usuario>> listarUsuarios() {
        return ResponseEntity.ok(repository.findAll());
    }

}
