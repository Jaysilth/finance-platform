package com.financeplatform.transaction.repository;

import com.financeplatform.transaction.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Page<Transaction> findByUserIdOrderByDateDescCreatedAtDesc(UUID userId, Pageable pageable);

    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
            SELECT t FROM Transaction t
            WHERE t.userId = :userId
            AND t.date BETWEEN :from AND :to
            ORDER BY t.date DESC, t.createdAt DESC
            """)
    java.util.List<Transaction> findByUserIdAndDateBetween(
            @Param("userId") UUID userId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    // Powers the analytics summary. TRANSFER is deliberately excluded by the
    // `t.type <> 'TRANSFER'` filter — this is the same rule enforced in
    // TransactionService's balance logic, restated here because this query
    // bypasses that service and reads straight from the DB. If a future
    // TransactionType is ever added, revisit this filter explicitly rather
    // than assuming it's still correct.
    @Query("""
            SELECT t.categoryId, t.type, SUM(t.amount)
            FROM Transaction t
            WHERE t.userId = :userId
            AND t.date BETWEEN :from AND :to
            AND t.type <> com.financeplatform.transaction.entity.TransactionType.TRANSFER
            GROUP BY t.categoryId, t.type
            """)
    java.util.List<Object[]> aggregateByCategoryAndType(
            @Param("userId") UUID userId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    // Powers budget status. Deliberately EXPENSE-only and TRANSFER-excluded
    // by construction — a budget tracks spending, never income or transfers
    // between the user's own accounts. Returns 0 (via COALESCE), not null,
    // when nothing matches, so callers don't need a null check.
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.userId = :userId
            AND t.type = com.financeplatform.transaction.entity.TransactionType.EXPENSE
            AND t.categoryId IN :categoryIds
            AND t.date BETWEEN :from AND :to
            """)
    java.math.BigDecimal sumExpensesByCategoriesAndDateRange(
            @Param("userId") UUID userId,
            @Param("categoryIds") java.util.Set<UUID> categoryIds,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
}
