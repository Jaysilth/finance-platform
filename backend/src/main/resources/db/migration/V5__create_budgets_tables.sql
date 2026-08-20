CREATE TABLE budgets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    period_type  VARCHAR(20) NOT NULL,
    amount       NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    start_date   DATE NOT NULL,
    -- Required for CUSTOM, NULL for MONTHLY (recurring, no fixed end).
    -- Enforced in BudgetService, not as a DB constraint, since Postgres
    -- CHECK constraints can't easily express "required only when a sibling
    -- column has a specific value" without a trigger — not worth it here.
    end_date     DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_budgets_user_id ON budgets (user_id);

-- Join table for the many-to-many between budgets and categories. No FK to
-- categories(id) with CASCADE here on purpose: deleting a category the
-- normal way (CategoryService.delete) already blocks default categories
-- and only allows deleting a user's own unused-by-budget categories would
-- need its own check later — for now, ON DELETE CASCADE keeps this table
-- from ever holding an orphaned reference if that changes.
CREATE TABLE budget_categories (
    budget_id    UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (budget_id, category_id)
);
