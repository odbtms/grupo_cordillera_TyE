package com.grupocordillera.auth.dto;

public record LoginResponse(String token, String usuario, String rol, String sucursal) {
}
