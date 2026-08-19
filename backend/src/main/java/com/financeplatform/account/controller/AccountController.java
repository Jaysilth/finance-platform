package com.financeplatform.account.controller;

import com.financeplatform.account.dto.AccountRequest;
import com.financeplatform.account.dto.AccountResponse;
import com.financeplatform.account.service.AccountService;
import com.financeplatform.common.util.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public List<AccountResponse> list() {
        return accountService.listForUser(CurrentUser.id());
    }

    @GetMapping("/{id}")
    public AccountResponse get(@PathVariable UUID id) {
        // id here comes from the URL, but every downstream call is also
        // scoped by CurrentUser.id() — that's what stops a user from
        // reading another user's account by guessing/incrementing an id.
        return accountService.getOwned(id, CurrentUser.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(@Valid @RequestBody AccountRequest request) {
        return accountService.create(request, CurrentUser.id());
    }

    @PutMapping("/{id}")
    public AccountResponse update(@PathVariable UUID id, @Valid @RequestBody AccountRequest request) {
        return accountService.update(id, request, CurrentUser.id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        // Soft delete only: financial history should never disappear outright,
        // and transactions FK-reference this account.
        accountService.deactivate(id, CurrentUser.id());
    }
}
