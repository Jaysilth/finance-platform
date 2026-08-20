package com.financeplatform.recurring.controller;

import com.financeplatform.common.util.CurrentUser;
import com.financeplatform.recurring.dto.RecurringTransactionRequest;
import com.financeplatform.recurring.dto.RecurringTransactionResponse;
import com.financeplatform.recurring.service.RecurringTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/recurring-transactions")
@RequiredArgsConstructor
public class RecurringTransactionController {

    private final RecurringTransactionService recurringTransactionService;

    @GetMapping
    public List<RecurringTransactionResponse> list() {
        return recurringTransactionService.list(CurrentUser.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecurringTransactionResponse create(@Valid @RequestBody RecurringTransactionRequest request) {
        return recurringTransactionService.create(request, CurrentUser.id());
    }

    @PutMapping("/{id}")
    public RecurringTransactionResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody RecurringTransactionRequest request
    ) {
        return recurringTransactionService.update(id, request, CurrentUser.id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        recurringTransactionService.delete(id, CurrentUser.id());
    }

    // Manual trigger for testing: processes only the caller's own due
    // recurrences, immediately, instead of waiting for the 1am job. Safe to
    // call repeatedly — an occurrence that already fired won't fire again,
    // since nextOccurrenceDate has already advanced past it.
    @PostMapping("/run-due")
    public Map<String, Integer> runDueNow() {
        int generated = recurringTransactionService.processDueForUser(CurrentUser.id(), LocalDate.now());
        return Map.of("generated", generated);
    }
}
