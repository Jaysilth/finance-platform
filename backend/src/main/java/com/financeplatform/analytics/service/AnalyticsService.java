package com.financeplatform.analytics.service;

import com.financeplatform.analytics.dto.AnalyticsSummaryResponse;
import com.financeplatform.analytics.dto.AnalyticsSummaryResponse.CategoryTotal;
import com.financeplatform.transaction.entity.TransactionType;
import com.financeplatform.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public AnalyticsSummaryResponse getSummary(UUID userId, LocalDate from, LocalDate to) {
        List<Object[]> rows = transactionRepository.aggregateByCategoryAndType(userId, from, to);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        List<CategoryTotal> breakdown = new java.util.ArrayList<>();

        for (Object[] row : rows) {
            UUID categoryId = (UUID) row[0]; // nullable — uncategorized transactions group here
            TransactionType type = (TransactionType) row[1];
            BigDecimal sum = (BigDecimal) row[2];

            if (type == TransactionType.INCOME) {
                totalIncome = totalIncome.add(sum);
            } else if (type == TransactionType.EXPENSE) {
                totalExpense = totalExpense.add(sum);
            }
            // TRANSFER never appears here — filtered out at the query level.

            breakdown.add(CategoryTotal.builder()
                    .categoryId(categoryId)
                    .type(type.name())
                    .total(sum)
                    .build());
        }

        return AnalyticsSummaryResponse.builder()
                .from(from)
                .to(to)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .net(totalIncome.subtract(totalExpense))
                .categoryBreakdown(breakdown)
                .build();
    }
}
