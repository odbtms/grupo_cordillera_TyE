package com.grupocordillera.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Servicio encargado de la creación, firma y validación de tokens JWT (JSON Web Tokens).
 * Utiliza el algoritmo HS256 para firmar los tokens de forma segura.
 */
@Service
public class JwtService {
    private static final int MIN_SECRET_LENGTH = 32;

    private final SecretKey secretKey;
    private final long expirationMillis;
    private final String issuer;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-minutes:30}") long expirationMinutes,
            @Value("${jwt.issuer:ms-auth}") String issuer) {
        // Valida que la clave secreta cumpla con el largo mínimo para seguridad
        if (secret == null || secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalArgumentException(
                    "El jwt.secret debe tener al menos 32 caracteres para HS256.");
        }
        // Inicializa la clave de encriptación usando HMAC-SHA
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = Duration.ofMinutes(expirationMinutes).toMillis();
        this.issuer = issuer;
    }

    /**
     * Genera un token JWT para un usuario específico.
     * @param subject  Username o identificador principal del usuario.
     * @param rol      Rol asociado al usuario (ej. ADMIN, EJECUTIVO).
     * @return         String con el token firmado.
     */
    public String generateToken(String subject, String rol) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(subject) // Establece el usuario
                .setIssuer(issuer)   // Establece el emisor del token
                .setIssuedAt(Date.from(now)) // Fecha de emisión
                .setExpiration(Date.from(now.plusMillis(expirationMillis))) // Fecha de expiración
                .claim("rol", rol)   // Agrega el rol como un claim personalizado
                .signWith(secretKey, SignatureAlgorithm.HS256) // Firma el token
                .compact();
    }

    /**
     * Parsea y valida un token JWT.
     * @param token    El token en crudo recibido del cliente.
     * @return         Un objeto Jws conteniendo los claims si el token es válido.
     * @throws JwtException Si el token es inválido, expirado o su firma es incorrecta.
     */
    public Jws<Claims> parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey) // Llave para validar la firma
                .requireIssuer(issuer)    // Obliga a que coincida el emisor
                .build()
                .parseClaimsJws(token);
    }
}
