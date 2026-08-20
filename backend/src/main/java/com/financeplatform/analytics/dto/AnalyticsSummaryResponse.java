package com.financeplatform.analytics.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Builder
public record AnalyticsSummaryResponse(
        java.time.LocalDate from,
        java.time.LocalDate to,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        // Signed: income minus expense. Deliberately not calling this
        // "savings" — net cash flow and savings aren't the same thing once
        // transfers into a savings account exist, and this endpoint doesn't
        // know about savings goals at all yet.
        BigDecimal net,
        List<CategoryTotal> categoryBreakdown
) {
    @Builder
    public record CategoryTotal(
            UUID categoryId,
            String type,
            BigDecimal total
    ) {
    }
}
