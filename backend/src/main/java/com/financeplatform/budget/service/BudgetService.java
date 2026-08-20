package com.financeplatform.budget.service;

import com.financeplatform.budget.dto.BudgetRequest;
import com.financeplatform.budget.dto.BudgetResponse;
import com.financeplatform.budget.entity.Budget;
import com.financeplatform.budget.entity.BudgetPeriodType;
import com.financeplatform.budget.repository.BudgetRepository;
import com.financeplatform.common.exception.InvalidRequestException;
import com.financeplatform.common.exception.ResourceNotFoundException;
import com.financeplatform.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public List<BudgetResponse> list(UUID userId) {
        return budgetRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponseWithStatus)
                .toList();
    }

    @Transactional(readOnly = true)
    public BudgetResponse getOwned(UUID id, UUID userId) {
        return toResponseWithStatus(findOwned(id, userId));
    }

    @Transactional
    public BudgetResponse create(BudgetRequest request, UUID userId) {
        validate(request);

        Budget budget = Budget.builder()
                .userId(userId)
                .name(request.name())
                .periodType(request.periodType())
                .amount(request.amount())
                .startDate(request.startDate())
                .endDate(request.periodType() == BudgetPeriodType.CUSTOM ? request.endDate() : null)
                .categoryIds(request.categoryIds())
                .build();

        return toResponseWithStatus(budgetRepository.save(budget));
    }

    @Transactional
    public BudgetResponse update(UUID id, BudgetRequest request, UUID userId) {
        validate(request);
        Budget budget = findOwned(id, userId);

        budget.setName(request.name());
        budget.setPeriodType(request.periodType());
        budget.setAmount(request.amount());
        budget.setStartDate(request.startDate());
        budget.setEndDate(request.periodType() == BudgetPeriodType.CUSTOM ? request.endDate() : null);
        budget.setCategoryIds(request.categoryIds());

        return toResponseWithStatus(budgetRepository.save(budget));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        Budget budget = findOwned(id, userId);
        budgetRepository.delete(budget);
    }

    private void validate(BudgetRequest request) {
        if (request.periodType() == BudgetPeriodType.CUSTOM) {
            if (request.endDate() == null) {
                throw new InvalidRequestException("endDate is required when periodType is CUSTOM");
            }
            if (!request.endDate().isAfter(request.startDate())) {
                throw new InvalidRequestException("endDate must be after startDate");
            }
        } else if (request.periodType() == BudgetPeriodType.MONTHLY && request.endDate() != null) {
            throw new InvalidRequestException("endDate must be omitted when periodType is MONTHLY — it recurs every month with no fixed end");
        }
    }

    /**
     * MONTHLY budgets are evaluated against whatever the current calendar
     * month is, every time this runs — that's what "recurring" means here.
     * A MONTHLY budget whose startDate is in the future isn't active yet
     * (spent = 0, active = false) rather than showing a misleading status.
     * CUSTOM budgets always evaluate against their fixed startDate/endDate.
     */
    private BudgetResponse toResponseWithStatus(Budget budget) {
        LocalDate today = LocalDate.now();
        LocalDate periodFrom;
        LocalDate periodTo;
        boolean active;

        if (budget.getPeriodType() == BudgetPeriodType.MONTHLY) {
            YearMonth currentMonth = YearMonth.from(today);
            periodFrom = currentMonth.atDay(1);
            periodTo = currentMonth.atEndOfMonth();
            active = !budget.getStartDate().isAfter(today);
        } else {
            periodFrom = budget.getStartDate();
            periodTo = budget.getEndDate();
            active = !today.isBefore(periodFrom) && !today.isAfter(periodTo);
        }

        BigDecimal spent = active
                ? transactionRepository.sumExpensesByCategoriesAndDateRange(
                        budget.getUserId(), budget.getCategoryIds(), periodFrom, periodTo)
                : BigDecimal.ZERO;

        return BudgetResponse.from(budget, periodFrom, periodTo, spent, active);
    }

    private Budget findOwned(UUID id, UUID userId) {
        return budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
    }
}
