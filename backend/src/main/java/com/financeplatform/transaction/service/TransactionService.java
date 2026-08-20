package com.financeplatform.transaction.service;

import com.financeplatform.account.entity.Account;
import com.financeplatform.account.service.AccountService;
import com.financeplatform.common.exception.InvalidRequestException;
import com.financeplatform.common.exception.ResourceNotFoundException;
import com.financeplatform.transaction.dto.TransactionRequest;
import com.financeplatform.transaction.dto.TransactionResponse;
import com.financeplatform.transaction.entity.Transaction;
import com.financeplatform.transaction.entity.TransactionType;
import com.financeplatform.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Owns the only code path allowed to move money between account balances.
 * Every create/update/delete here runs inside a single DB transaction so a
 * transaction row and its balance effect can never go out of sync.
 *
 * IMPORTANT (matches the plan's called-out business rule): TRANSFER moves
 * money between two of the user's own accounts and must never be counted as
 * income or expense in analytics/reporting — see the analytics module,
 * which filters TRANSFER out of income/expense sums.
 */
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountService accountService;

    @Transactional(readOnly = true)
    public Page<TransactionResponse> list(UUID userId, Pageable pageable) {
        return transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc(userId, pageable)
                .map(TransactionResponse::from);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getOwned(UUID id, UUID userId) {
        return TransactionResponse.from(findOwned(id, userId));
    }

    @Transactional
    public TransactionResponse create(TransactionRequest request, UUID userId) {
        Transaction transaction = buildAndApply(request, userId, null);
        return TransactionResponse.from(transactionRepository.save(transaction));
    }

    /**
     * Used only by RecurringTransactionScheduler / the manual "run due now"
     * endpoint. Identical to create() except it stamps recurringTransactionId
     * so the generated row is traceable back to its definition — see the
     * comment on Transaction.recurringTransactionId.
     */
    @Transactional
    public TransactionResponse createFromRecurrence(TransactionRequest request, UUID userId, UUID recurringTransactionId) {
        Transaction transaction = buildAndApply(request, userId, recurringTransactionId);
        return TransactionResponse.from(transactionRepository.save(transaction));
    }

    private Transaction buildAndApply(TransactionRequest request, UUID userId, UUID recurringTransactionId) {
        Account source = accountService.findOwned(request.accountId(), userId);

        Account destination = null;
        if (request.type() == TransactionType.TRANSFER) {
            if (request.transferAccountId() == null) {
                throw new InvalidRequestException("transferAccountId is required for TRANSFER transactions");
            }
            if (request.transferAccountId().equals(request.accountId())) {
                throw new InvalidRequestException("Cannot transfer an account to itself");
            }
            destination = accountService.findOwned(request.transferAccountId(), userId);
        } else if (request.transferAccountId() != null) {
            throw new InvalidRequestException("transferAccountId must be empty unless type is TRANSFER");
        }

        Transaction transaction = Transaction.builder()
                .userId(userId)
                .accountId(request.accountId())
                .transferAccountId(request.transferAccountId())
                .categoryId(request.categoryId())
                .recurringTransactionId(recurringTransactionId)
                .type(request.type())
                .amount(request.amount())
                .date(request.date())
                .description(request.description())
                .merchant(request.merchant())
                .currency(source.getCurrency())
                .build();

        applyBalanceEffect(source, destination, transaction, 1);
        return transaction;
    }

    @Transactional
    public TransactionResponse update(UUID id, TransactionRequest request, UUID userId) {
        Transaction existing = findOwned(id, userId);

        // Reverse the old effect first, against the accounts it originally touched.
        Account oldSource = accountService.findOwned(existing.getAccountId(), userId);
        Account oldDestination = existing.getTransferAccountId() != null
                ? accountService.findOwned(existing.getTransferAccountId(), userId)
                : null;
        applyBalanceEffect(oldSource, oldDestination, existing, -1);

        Account newSource = accountService.findOwned(request.accountId(), userId);
        Account newDestination = null;
        if (request.type() == TransactionType.TRANSFER) {
            if (request.transferAccountId() == null) {
                throw new InvalidRequestException("transferAccountId is required for TRANSFER transactions");
            }
            newDestination = accountService.findOwned(request.transferAccountId(), userId);
        }

        existing.setAccountId(request.accountId());
        existing.setTransferAccountId(request.transferAccountId());
        existing.setCategoryId(request.categoryId());
        existing.setType(request.type());
        existing.setAmount(request.amount());
        existing.setDate(request.date());
        existing.setDescription(request.description());
        existing.setMerchant(request.merchant());
        existing.setCurrency(newSource.getCurrency());

        applyBalanceEffect(newSource, newDestination, existing, 1);

        return TransactionResponse.from(transactionRepository.save(existing));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        Transaction existing = findOwned(id, userId);

        Account source = accountService.findOwned(existing.getAccountId(), userId);
        Account destination = existing.getTransferAccountId() != null
                ? accountService.findOwned(existing.getTransferAccountId(), userId)
                : null;

        applyBalanceEffect(source, destination, existing, -1);
        transactionRepository.delete(existing);
    }

    /**
     * direction = 1 to apply the transaction's effect, -1 to reverse it.
     * INCOME adds to the account; EXPENSE subtracts; TRANSFER subtracts from
     * source and adds to destination — net zero across the user's accounts,
     * which is exactly why transfers must be excluded from income/expense totals.
     */
    private void applyBalanceEffect(Account source, Account destination, Transaction t, int direction) {
        BigDecimal signedAmount = t.getAmount().multiply(BigDecimal.valueOf(direction));

        switch (t.getType()) {
            case INCOME -> source.setBalance(source.getBalance().add(signedAmount));
            case EXPENSE -> source.setBalance(source.getBalance().subtract(signedAmount));
            case TRANSFER -> {
                source.setBalance(source.getBalance().subtract(signedAmount));
                if (destination != null) {
                    destination.setBalance(destination.getBalance().add(signedAmount));
                }
            }
        }
    }

    private Transaction findOwned(UUID id, UUID userId) {
        return transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    }
}
