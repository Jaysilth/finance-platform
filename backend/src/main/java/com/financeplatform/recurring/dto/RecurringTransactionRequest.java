package com.financeplatform.recurring.dto;

import com.financeplatform.recurring.entity.RecurringFrequency;
import com.financeplatform.transaction.entity.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RecurringTransactionRequest(
        @NotNull UUID accountId,
        // Required only when type = TRANSFER — validated in the service,
        // same pattern as TransactionRequest.
        UUID transferAccountId,
        UUID categoryId,
        @NotNull TransactionType type,
        @NotNull @Positive BigDecimal amount,
        @NotNull RecurringFrequency frequency,
        @NotNull LocalDate startDate,
        // Null = recurs indefinitely.
        LocalDate endDate,
        String description,
        String merchant,
        // Null on create defaults to true. On update, an explicit false
        // pauses the recurrence without deleting it — the frontend uses
        // this for a pause/resume toggle instead of a hard delete.
        Boolean active
) {
}
