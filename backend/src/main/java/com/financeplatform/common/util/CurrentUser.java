package com.financeplatform.common.util;

import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Reads the authenticated user's id from the SecurityContext, where
 * JwtAuthFilter placed it as the principal. All feature modules (accounts,
 * transactions, etc.) must scope their queries using this id, not an id
 * taken from the URL/body — that ownership check is what stops a user from
 * reading or modifying another user's data by changing an id.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static UUID id() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UUID uuid) {
            return uuid;
        }
        throw new IllegalStateException("No authenticated user id found in security context");
    }
}
