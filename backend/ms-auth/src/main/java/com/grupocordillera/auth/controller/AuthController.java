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

/**
 * Controlador principal para la autenticación y gestión de usuarios.
 * Proporciona endpoints para iniciar sesión, registrarse, validar tokens
 * y actualizar los roles de los usuarios.
 */
@RestController
@CrossOrigin(origins = "*")
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

    /**
     * Endpoint para iniciar sesión.
     * Valida las credenciales y, si son correctas, retorna un JWT junto a los datos
     * básicos del usuario.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> iniciarSesion(@RequestBody LoginRequest credentials) {
        // Busca el usuario por username y valida que la contraseña coincida
        return repository.findByUsername(credentials.username())
                .filter(u -> passwordEncoder.matches(credentials.password(), u.getPassword()))
                .map(u -> {
                    // Genera el token JWT
                    String token = jwtService.generateToken(u.getUsername(), u.getRol());
                    LoginResponse response = new LoginResponse(
                            token,
                            u.getUsername(),
                            u.getRol(),
                            u.getSucursal());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(401).build()); // Retorna 401 si las credenciales son inválidas
    }

    /**
     * Endpoint para registrar un nuevo usuario en el sistema.
     * Valida que los datos obligatorios estén presentes y que el usuario o email no
     * existan previamente.
     */
    @PostMapping("/register")
    public ResponseEntity<LoginResponse> registrarUsuario(@RequestBody RegisterRequest request) {
        // Validaciones básicas de campos obligatorios
        if (request.username() == null || request.username().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Verifica si ya existe un usuario con el mismo username o email para evitar
        // duplicados (409 Conflict)
        if (repository.findByUsername(request.username()).isPresent()) {
            return ResponseEntity.status(409).build();
        }
        if (repository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(409).build();
        }

        // Crea y configura la nueva entidad de Usuario
        Usuario usuario = new Usuario();
        usuario.setUsername(request.username().trim());
        usuario.setEmail(request.email().trim());
        usuario.setPassword(passwordEncoder.encode(request.password())); // Encripta la contraseña
        // Asigna un rol por defecto si no se proporciona uno
        usuario.setRol(request.rol() == null || request.rol().isBlank()
                ? "EJECUTIVO"
                : request.rol().trim().toUpperCase());
        usuario.setSucursal(request.sucursal() == null || request.sucursal().isBlank()
                ? null
                : request.sucursal().trim());

        // Guarda el usuario en la base de datos
        Usuario saved = repository.save(usuario);

        // Genera el token para que el usuario quede autenticado tras registrarse
        String token = jwtService.generateToken(saved.getUsername(), saved.getRol());
        LoginResponse response = new LoginResponse(
                token,
                saved.getUsername(),
                saved.getRol(),
                saved.getSucursal());
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint para validar si un token JWT enviado en el header Authorization es
     * válido.
     */
    @GetMapping("/validar")
    public ResponseEntity<String> validarSesion(@RequestHeader("Authorization") String token) {
        // Remueve el prefijo 'Bearer ' si está presente
        String rawToken = token != null && token.startsWith("Bearer ")
                ? token.substring(7)
                : token;
        try {
            // Intenta parsear el token; si tiene éxito, es válido
            String subject = jwtService.parseToken(rawToken).getBody().getSubject();
            return ResponseEntity.ok("Token valido: " + subject);
        } catch (JwtException | IllegalArgumentException ex) {
            // Si hay excepción (expirado, modificado, etc.), retorna 401
            return ResponseEntity.status(401).body("Token invalido");
        }
    }

    /**
     * Endpoint para actualizar el rol de un usuario buscando por su ID.
     */
    @PutMapping("/usuarios/{id}/rol")
    public Usuario actualizarRol(@PathVariable Long id, @RequestBody Usuario request) {
        // Busca al usuario, actualiza el rol y lo guarda, o lanza excepción si no lo
        // encuentra
        return repository.findById(id).map(u -> {
            u.setRol(request.getRol());
            return repository.save(u);
        }).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    /**
     * Endpoint para actualizar el rol de un usuario buscando por su username.
     */
    @PutMapping("/usuarios/username/{username}/rol")
    public Usuario actualizarRolPorUsername(
            @PathVariable String username,
            @RequestBody Usuario request) {
        // Busca al usuario por username, actualiza el rol y lo guarda
        return repository.findByUsername(username).map(u -> {
            u.setRol(request.getRol());
            return repository.save(u);
        }).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

}
