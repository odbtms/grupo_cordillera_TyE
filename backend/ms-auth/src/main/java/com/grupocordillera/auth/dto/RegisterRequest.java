package com.grupocordillera.auth.dto;

public record RegisterRequest(String username, String email, String password, String rol, String sucursal) {
}
