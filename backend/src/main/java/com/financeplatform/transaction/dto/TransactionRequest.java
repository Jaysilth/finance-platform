package com.financeplatform.transaction.dto;

import com.financeplatform.transaction.entity.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
        @NotNull UUID accountId,
        // Required only when type = TRANSFER; validated in the service, not
        // here, since @NotNull can't be conditional on a sibling field.
        UUID transferAccountId,
        UUID categoryId,
        @NotNull TransactionType type,
        @NotNull @Positive BigDecimal amount,
        @NotNull LocalDate date,
        String description,
        String merchant
) {
}
