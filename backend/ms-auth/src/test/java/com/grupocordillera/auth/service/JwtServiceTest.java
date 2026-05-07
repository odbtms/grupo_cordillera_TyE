package com.grupocordillera.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    @Test
    void generaTokenYPermiteLeerSubject() {
        String secret = "clave-super-segura-de-32-caracteres";
        JwtService jwtService = new JwtService(secret, 30, "ms-auth");

        String token = jwtService.generateToken("usuario-demo", "ADMIN");
        assertNotNull(token);

        Jws<Claims> parsed = jwtService.parseToken(token);
        assertEquals("usuario-demo", parsed.getBody().getSubject());
        assertEquals("ADMIN", parsed.getBody().get("rol", String.class));
    }
}
