package com.financeplatform.budget.entity;

public enum BudgetPeriodType {
    // Recurring: no fixed end — evaluated against whatever the current
    // calendar month is every time status is computed. startDate marks
    // when the budget became active; a MONTHLY budget with a future
    // startDate isn't active yet.
    MONTHLY,
    // Fixed one-off range: startDate and endDate are both required and
    // never move. Never recurs.
    CUSTOM
}
