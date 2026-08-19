package com.financeplatform.account.dto;

import com.financeplatform.account.entity.Account;
import com.financeplatform.account.entity.AccountType;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Builder
public record AccountResponse(
        UUID id,
        String name,
        AccountType type,
        String currency,
        BigDecimal balance,
        String institution,
        boolean active,
        Instant createdAt
) {
    public static AccountResponse from(Account a) {
        return AccountResponse.builder()
                .id(a.getId())
                .name(a.getName())
                .type(a.getType())
                .currency(a.getCurrency())
                .balance(a.getBalance())
                .institution(a.getInstitution())
                .active(a.isActive())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
