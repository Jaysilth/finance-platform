package com.financeplatform.recurring.repository;

import com.financeplatform.recurring.entity.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, UUID> {

    List<RecurringTransaction> findByUserIdOrderByNextOccurrenceDateAsc(UUID userId);

    Optional<RecurringTransaction> findByIdAndUserId(UUID id, UUID userId);

    // Used by the nightly scheduler — deliberately NOT scoped to one user,
    // since the job processes every user's due recurrences in one run.
    List<RecurringTransaction> findByActiveTrueAndNextOccurrenceDateLessThanEqual(LocalDate date);

    // Used by the manual "run due now" endpoint — scoped to one user so a
    // person can only ever trigger processing of their own recurrences.
    List<RecurringTransaction> findByUserIdAndActiveTrueAndNextOccurrenceDateLessThanEqual(
            UUID userId, LocalDate date);
}
