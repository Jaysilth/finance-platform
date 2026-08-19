package com.financeplatform.auth.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record AuthResponse(
        String token,
        UUID userId,
        String email,
        String fullName
) {
}
