package com.grupocordillera.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jws;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "clave-super-segura-de-32-caracteres";

    @Test
    void generaTokenYPermiteLeerSubject() {
        JwtService jwtService = new JwtService(SECRET, 30, "ms-auth");

        String token = jwtService.generateToken("usuario-demo", "ADMIN");
        assertNotNull(token);

        Jws<Claims> parsed = jwtService.parseToken(token);
        assertEquals("usuario-demo", parsed.getBody().getSubject());
        assertEquals("ADMIN", parsed.getBody().get("rol", String.class));
    }

    @Test
    void secretoMenorA32CaracteresLanzaExcepcion() {
        assertThrows(IllegalArgumentException.class,
                () -> new JwtService("corto", 30, "ms-auth"));
    }

    @Test
    void tokenExpiradoEsRechazado() {
        // expiración de 0 minutos => el token nace ya expirado
        JwtService jwtService = new JwtService(SECRET, 0, "ms-auth");
        String token = jwtService.generateToken("ana", "ADMIN");

        assertThrows(JwtException.class, () -> jwtService.parseToken(token));
    }

    @Test
    void tokenConIssuerDistintoEsRechazado() {
        JwtService emisor = new JwtService(SECRET, 30, "otro-emisor");
        String token = emisor.generateToken("ana", "ADMIN");

        JwtService validador = new JwtService(SECRET, 30, "ms-auth");
        assertThrows(JwtException.class, () -> validador.parseToken(token));
    }

    @Test
    void tokenFirmadoConOtraClaveEsRechazado() {
        JwtService firmante = new JwtService("otra-clave-distinta-de-32-caracteres!!", 30, "ms-auth");
        String token = firmante.generateToken("ana", "ADMIN");

        JwtService validador = new JwtService(SECRET, 30, "ms-auth");
        assertThrows(JwtException.class, () -> validador.parseToken(token));
    }

    @Test
    void tokenMalformadoLanzaExcepcion() {
        JwtService jwtService = new JwtService(SECRET, 30, "ms-auth");
        assertThrows(Exception.class, () -> jwtService.parseToken("esto-no-es-un-jwt"));
    }
}
