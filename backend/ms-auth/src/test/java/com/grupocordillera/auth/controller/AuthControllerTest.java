package com.grupocordillera.auth.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.grupocordillera.auth.dto.LoginRequest;
import com.grupocordillera.auth.dto.LoginResponse;
import com.grupocordillera.auth.dto.RegisterRequest;
import com.grupocordillera.auth.model.Usuario;
import com.grupocordillera.auth.repository.UsuarioRepository;
import com.grupocordillera.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jws;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Pruebas unitarias del AuthController usando Mockito (sin levantar Spring).
 * Cubre login, registro, validación de token y gestión de roles/usuarios.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UsuarioRepository repository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthController controller;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setUsername("ana");
        usuario.setEmail("ana@cordillera.cl");
        usuario.setPassword("hash-guardado");
        usuario.setRol("ADMIN");
        usuario.setSucursal("Santiago");
    }

    // ---------- login ----------

    @Test
    void loginConCredencialesValidasRetornaTokenYDatos() {
        when(repository.findByUsername("ana")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("clave", "hash-guardado")).thenReturn(true);
        when(jwtService.generateToken("ana", "ADMIN")).thenReturn("token-123");

        ResponseEntity<LoginResponse> resp =
                controller.iniciarSesion(new LoginRequest("ana", "clave"));

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertEquals("token-123", resp.getBody().token());
        assertEquals("ana", resp.getBody().usuario());
        assertEquals("ADMIN", resp.getBody().rol());
        assertEquals("Santiago", resp.getBody().sucursal());
    }

    @Test
    void loginConPasswordIncorrectaRetorna401() {
        when(repository.findByUsername("ana")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("mala", "hash-guardado")).thenReturn(false);

        ResponseEntity<LoginResponse> resp =
                controller.iniciarSesion(new LoginRequest("ana", "mala"));

        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
    }

    @Test
    void loginConUsuarioInexistenteRetorna401() {
        when(repository.findByUsername("fantasma")).thenReturn(Optional.empty());

        ResponseEntity<LoginResponse> resp =
                controller.iniciarSesion(new LoginRequest("fantasma", "x"));

        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
    }

    // ---------- register ----------

    @Test
    void registroExitosoGuardaUsuarioEncriptaYDevuelveToken() {
        when(repository.findByUsername("nuevo")).thenReturn(Optional.empty());
        when(repository.findByEmail("nuevo@cl.cl")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secreta")).thenReturn("hash-secreta");
        when(repository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId(99L);
            return u;
        });
        when(jwtService.generateToken("nuevo", "EMPLEADO_TIENDA")).thenReturn("tk");

        ResponseEntity<LoginResponse> resp = controller.registrarUsuario(
                new RegisterRequest("nuevo", "nuevo@cl.cl", "secreta", "empleado_tienda", "Temuco"));

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("tk", resp.getBody().token());
        // La contraseña debe persistirse encriptada, nunca en texto plano
        verify(passwordEncoder).encode("secreta");
    }

    @Test
    void registroSinUsernameRetorna400() {
        ResponseEntity<LoginResponse> resp = controller.registrarUsuario(
                new RegisterRequest("  ", "a@a.cl", "p", "ADMIN", null));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void registroSinPasswordRetorna400() {
        ResponseEntity<LoginResponse> resp = controller.registrarUsuario(
                new RegisterRequest("u", "a@a.cl", "", "ADMIN", null));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void registroSinEmailRetorna400() {
        ResponseEntity<LoginResponse> resp = controller.registrarUsuario(
                new RegisterRequest("u", null, "p", "ADMIN", null));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void registroConUsernameDuplicadoRetorna409() {
        when(repository.findByUsername("ana")).thenReturn(Optional.of(usuario));

        ResponseEntity<LoginResponse> resp = controller.registrarUsuario(
                new RegisterRequest("ana", "x@x.cl", "p", "ADMIN", null));

        assertEquals(HttpStatus.CONFLICT, resp.getStatusCode());
    }

    @Test
    void registroConEmailDuplicadoRetorna409() {
        when(repository.findByUsername("otro")).thenReturn(Optional.empty());
        when(repository.findByEmail("ana@cordillera.cl")).thenReturn(Optional.of(usuario));

        ResponseEntity<LoginResponse> resp = controller.registrarUsuario(
                new RegisterRequest("otro", "ana@cordillera.cl", "p", "ADMIN", null));

        assertEquals(HttpStatus.CONFLICT, resp.getStatusCode());
    }

    @Test
    void registroConRolInvalidoRetorna400() {
        when(repository.findByUsername("u")).thenReturn(Optional.empty());
        when(repository.findByEmail("a@a.cl")).thenReturn(Optional.empty());

        ResponseEntity<LoginResponse> resp = controller.registrarUsuario(
                new RegisterRequest("u", "a@a.cl", "p", "SUPERVISOR", null));

        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        verify(repository, never()).save(any());
    }

    // ---------- validar ----------

    @Test
    @SuppressWarnings("unchecked")
    void validarTokenValidoConPrefijoBearerRetornaDatos() {
        Jws<Claims> jws = org.mockito.Mockito.mock(Jws.class);
        Claims claims = org.mockito.Mockito.mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.getSubject()).thenReturn("ana");
        when(jwtService.parseToken("token-puro")).thenReturn(jws);
        when(repository.findByUsername("ana")).thenReturn(Optional.of(usuario));

        ResponseEntity<LoginResponse> resp = controller.validarSesion("Bearer token-puro");

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("ana", resp.getBody().usuario());
    }

    @Test
    void validarTokenInvalidoRetorna401() {
        when(jwtService.parseToken(anyString())).thenThrow(new JwtException("malo"));

        ResponseEntity<LoginResponse> resp = controller.validarSesion("Bearer roto");

        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
    }

    // ---------- roles ----------

    @Test
    void actualizarRolValidoGuardaYRetornaUsuario() {
        when(repository.findById(1L)).thenReturn(Optional.of(usuario));
        when(repository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<Usuario> resp =
                controller.actualizarRol(1L, new AuthController.RolRequest("empleado_tienda"));

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("EMPLEADO_TIENDA", resp.getBody().getRol());
    }

    @Test
    void actualizarRolInvalidoRetorna400() {
        ResponseEntity<Usuario> resp =
                controller.actualizarRol(1L, new AuthController.RolRequest("REY"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void actualizarRolUsuarioInexistenteRetorna404() {
        when(repository.findById(7L)).thenReturn(Optional.empty());
        ResponseEntity<Usuario> resp =
                controller.actualizarRol(7L, new AuthController.RolRequest("ADMIN"));
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }

    @Test
    void actualizarRolPorUsernameValidoGuarda() {
        when(repository.findByUsername("ana")).thenReturn(Optional.of(usuario));
        when(repository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<Usuario> resp =
                controller.actualizarRolPorUsername("ana", new AuthController.RolRequest("ADMIN"));

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("ADMIN", resp.getBody().getRol());
    }

    @Test
    void actualizarRolPorUsernameConRolInvalidoRetorna400() {
        ResponseEntity<Usuario> resp =
                controller.actualizarRolPorUsername("ana", new AuthController.RolRequest("REY"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void actualizarRolPorUsernameInexistenteRetorna404() {
        when(repository.findByUsername("fantasma")).thenReturn(Optional.empty());
        ResponseEntity<Usuario> resp =
                controller.actualizarRolPorUsername("fantasma", new AuthController.RolRequest("ADMIN"));
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }

    @Test
    void actualizarRolConRolNullRetorna400() {
        ResponseEntity<Usuario> resp =
                controller.actualizarRol(1L, new AuthController.RolRequest(null));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    @SuppressWarnings("unchecked")
    void validarTokenValidoPeroUsuarioEliminadoRetorna401() {
        Jws<Claims> jws = org.mockito.Mockito.mock(Jws.class);
        Claims claims = org.mockito.Mockito.mock(Claims.class);
        when(jws.getBody()).thenReturn(claims);
        when(claims.getSubject()).thenReturn("ana");
        when(jwtService.parseToken("tk")).thenReturn(jws);
        when(repository.findByUsername("ana")).thenReturn(Optional.empty());

        ResponseEntity<LoginResponse> resp = controller.validarSesion("tk");

        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
    }

    // ---------- listar / eliminar ----------

    @Test
    void listarUsuariosRetornaLista() {
        when(repository.findAll()).thenReturn(java.util.List.of(usuario));
        ResponseEntity<java.util.List<Usuario>> resp = controller.listarUsuarios();
        assertEquals(1, resp.getBody().size());
    }

    @Test
    void eliminarUsuarioExistenteRetorna204() {
        when(repository.existsById(1L)).thenReturn(true);
        ResponseEntity<Void> resp = controller.eliminarUsuario(1L);
        assertEquals(HttpStatus.NO_CONTENT, resp.getStatusCode());
        verify(repository).deleteById(1L);
    }

    @Test
    void eliminarUsuarioInexistenteRetorna404() {
        when(repository.existsById(99L)).thenReturn(false);
        ResponseEntity<Void> resp = controller.eliminarUsuario(99L);
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
        verify(repository, never()).deleteById(eq(99L));
    }

    @Test
    void healthRetornaOk() {
        assertEquals("ok", controller.health().getBody());
    }
}
