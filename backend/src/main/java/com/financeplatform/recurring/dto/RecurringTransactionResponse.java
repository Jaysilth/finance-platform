package com.financeplatform.recurring.dto;

import com.financeplatform.recurring.entity.RecurringFrequency;
import com.financeplatform.recurring.entity.RecurringTransaction;
import com.financeplatform.transaction.entity.TransactionType;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Builder
public record RecurringTransactionResponse(
        UUID id,
        UUID accountId,
        UUID transferAccountId,
        UUID categoryId,
        TransactionType type,
        BigDecimal amount,
        RecurringFrequency frequency,
        LocalDate startDate,
        LocalDate nextOccurrenceDate,
        LocalDate endDate,
        String description,
        String merchant,
        boolean active
) {
    public static RecurringTransactionResponse from(RecurringTransaction rt) {
        return RecurringTransactionResponse.builder()
                .id(rt.getId())
                .accountId(rt.getAccountId())
                .transferAccountId(rt.getTransferAccountId())
                .categoryId(rt.getCategoryId())
                .type(rt.getType())
                .amount(rt.getAmount())
                .frequency(rt.getFrequency())
                .startDate(rt.getStartDate())
                .nextOccurrenceDate(rt.getNextOccurrenceDate())
                .endDate(rt.getEndDate())
                .description(rt.getDescription())
                .merchant(rt.getMerchant())
                .active(rt.isActive())
                .build();
    }
}
