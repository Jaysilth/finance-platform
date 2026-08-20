package com.financeplatform.budget.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "budgets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false)
    private BudgetPeriodType periodType;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    // Required for CUSTOM, null for MONTHLY (see BudgetPeriodType). Enforced
    // in BudgetService, not here — Bean Validation can't express "required
    // only when a sibling field has a specific value".
    @Column(name = "end_date")
    private LocalDate endDate;

    // A budget can span multiple categories (e.g. one "Discretionary"
    // budget covering Food + Entertainment). Stored as a plain join table
    // rather than a bidirectional JPA relation, matching how the rest of
    // this codebase references categories by raw id (see Transaction.categoryId)
    // instead of an @ManyToOne — keeps category deletion simple and avoids
    // N+1 fetches this app doesn't need yet.
    @ElementCollection
    @CollectionTable(name = "budget_categories", joinColumns = @JoinColumn(name = "budget_id"))
    @Column(name = "category_id", nullable = false)
    @Builder.Default
    private Set<UUID> categoryIds = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
