package com.financeplatform.budget.controller;

import com.financeplatform.budget.dto.BudgetRequest;
import com.financeplatform.budget.dto.BudgetResponse;
import com.financeplatform.budget.service.BudgetService;
import com.financeplatform.common.util.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public List<BudgetResponse> list() {
        return budgetService.list(CurrentUser.id());
    }

    @GetMapping("/{id}")
    public BudgetResponse get(@PathVariable UUID id) {
        return budgetService.getOwned(id, CurrentUser.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetResponse create(@Valid @RequestBody BudgetRequest request) {
        return budgetService.create(request, CurrentUser.id());
    }

    @PutMapping("/{id}")
    public BudgetResponse update(@PathVariable UUID id, @Valid @RequestBody BudgetRequest request) {
        return budgetService.update(id, request, CurrentUser.id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        budgetService.delete(id, CurrentUser.id());
    }
}
