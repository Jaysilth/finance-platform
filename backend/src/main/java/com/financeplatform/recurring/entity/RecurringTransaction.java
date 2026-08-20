package com.financeplatform.recurring.entity;

import com.financeplatform.transaction.entity.TransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "recurring_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringTransaction {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "transfer_account_id")
    private UUID transferAccountId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecurringFrequency frequency;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    // Drives the scheduler: the next date this recurrence is due. Starts
    // equal to startDate and advances every time an occurrence fires — see
    // RecurringTransactionService.advance(). This is mutable state, not
    // derived, so the scheduler doesn't need to recompute history on every
    // run — it only ever looks forward from here.
    @Column(name = "next_occurrence_date", nullable = false)
    private LocalDate nextOccurrenceDate;

    // Null = recurs indefinitely. When set and nextOccurrenceDate would
    // move past it, the recurrence deactivates itself instead of firing.
    @Column(name = "end_date")
    private LocalDate endDate;

    private String description;

    private String merchant;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
