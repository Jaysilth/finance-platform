package com.financeplatform.budget.dto;

import com.financeplatform.budget.entity.BudgetPeriodType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public record BudgetRequest(
        @NotBlank String name,
        @NotNull BudgetPeriodType periodType,
        @NotNull @Positive BigDecimal amount,
        @NotNull LocalDate startDate,
        // Required and must be after startDate when periodType = CUSTOM.
        // Must be omitted when periodType = MONTHLY — a recurring budget
        // has no fixed end. Both rules are enforced in BudgetService, not
        // here, since they depend on the sibling periodType field.
        LocalDate endDate,
        @NotEmpty Set<UUID> categoryIds
) {
}
