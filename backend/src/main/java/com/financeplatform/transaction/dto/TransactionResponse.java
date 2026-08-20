package com.financeplatform.transaction.dto;

import com.financeplatform.transaction.entity.Transaction;
import com.financeplatform.transaction.entity.TransactionType;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Builder
public record TransactionResponse(
        UUID id,
        UUID accountId,
        UUID transferAccountId,
        UUID categoryId,
        UUID recurringTransactionId,
        TransactionType type,
        BigDecimal amount,
        LocalDate date,
        String description,
        String merchant,
        String currency,
        Instant createdAt
) {
    public static TransactionResponse from(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .accountId(t.getAccountId())
                .transferAccountId(t.getTransferAccountId())
                .categoryId(t.getCategoryId())
                .recurringTransactionId(t.getRecurringTransactionId())
                .type(t.getType())
                .amount(t.getAmount())
                .date(t.getDate())
                .description(t.getDescription())
                .merchant(t.getMerchant())
                .currency(t.getCurrency())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
