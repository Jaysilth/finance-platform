package com.financeplatform.account.service;

import com.financeplatform.account.dto.AccountRequest;
import com.financeplatform.account.dto.AccountResponse;
import com.financeplatform.account.entity.Account;
import com.financeplatform.account.repository.AccountRepository;
import com.financeplatform.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public List<AccountResponse> listForUser(UUID userId) {
        return accountRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(AccountResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse getOwned(UUID accountId, UUID userId) {
        return AccountResponse.from(findOwned(accountId, userId));
    }

    @Transactional
    public AccountResponse create(AccountRequest request, UUID userId) {
        BigDecimal initial = request.initialBalance() != null ? request.initialBalance() : BigDecimal.ZERO;

        Account account = Account.builder()
                .userId(userId)
                .name(request.name())
                .type(request.type())
                .currency(request.currency().toUpperCase())
                .balance(initial)
                .institution(request.institution())
                .build();

        return AccountResponse.from(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse update(UUID accountId, AccountRequest request, UUID userId) {
        Account account = findOwned(accountId, userId);

        account.setName(request.name());
        account.setType(request.type());
        account.setCurrency(request.currency().toUpperCase());
        account.setInstitution(request.institution());
        // Deliberately not touching balance here — balance only moves via
        // transactions, never a direct account edit, so it can't drift from
        // the transaction history that explains it.

        return AccountResponse.from(accountRepository.save(account));
    }

    @Transactional
    public void deactivate(UUID accountId, UUID userId) {
        Account account = findOwned(accountId, userId);
        account.setActive(false);
        accountRepository.save(account);
    }

    // Public: TransactionService (different package) reuses this ownership-checked
    // lookup to get the live entity — not just the DTO — so it can adjust
    // balance inside the same DB transaction as the transaction write.
    public Account findOwned(UUID accountId, UUID userId) {
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    }
}
