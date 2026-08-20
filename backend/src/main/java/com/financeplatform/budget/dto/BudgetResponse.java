package com.financeplatform.budget.dto;

import com.financeplatform.budget.entity.Budget;
import com.financeplatform.budget.entity.BudgetPeriodType;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Builder
public record BudgetResponse(
        UUID id,
        String name,
        BudgetPeriodType periodType,
        BigDecimal amount,
        LocalDate startDate,
        LocalDate endDate,
        Set<UUID> categoryIds,
        // The period actually evaluated to produce `spent` — for MONTHLY
        // this is the current calendar month, not startDate/endDate (which
        // stay fixed on the entity). Included so the frontend can show
        // "this covers Aug 1 - Aug 31" without recomputing that logic itself.
        LocalDate periodFrom,
        LocalDate periodTo,
        BigDecimal spent,
        BigDecimal remaining,
        // 0-100+, can exceed 100 when over budget. Frontend decides how to
        // render >100 (e.g. clamp a progress bar, but still show the real number).
        BigDecimal percentUsed,
        boolean active
) {
    public static BudgetResponse from(
            Budget b,
            LocalDate periodFrom,
            LocalDate periodTo,
            BigDecimal spent,
            boolean active
    ) {
        BigDecimal remaining = b.getAmount().subtract(spent);
        BigDecimal percentUsed = b.getAmount().signum() == 0
                ? BigDecimal.ZERO
                : spent.divide(b.getAmount(), 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));

        return BudgetResponse.builder()
                .id(b.getId())
                .name(b.getName())
                .periodType(b.getPeriodType())
                .amount(b.getAmount())
                .startDate(b.getStartDate())
                .endDate(b.getEndDate())
                .categoryIds(b.getCategoryIds())
                .periodFrom(periodFrom)
                .periodTo(periodTo)
                .spent(spent)
                .remaining(remaining)
                .percentUsed(percentUsed)
                .active(active)
                .build();
    }
}
