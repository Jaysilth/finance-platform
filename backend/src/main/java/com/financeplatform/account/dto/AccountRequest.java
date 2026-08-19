package com.financeplatform.account.dto;

import com.financeplatform.account.entity.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AccountRequest(
        @NotBlank String name,
        @NotNull AccountType type,
        @NotBlank String currency,
        BigDecimal initialBalance,
        String institution
) {
}
