CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(20)  NOT NULL,
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_user_id ON categories (user_id);

-- Shared default categories, visible to every user (user_id IS NULL).
INSERT INTO categories (name, type, is_default) VALUES
    ('Salary', 'INCOME', TRUE),
    ('Freelance', 'INCOME', TRUE),
    ('Business', 'INCOME', TRUE),
    ('Investments', 'INCOME', TRUE),
    ('Gifts', 'INCOME', TRUE),
    ('Other Income', 'INCOME', TRUE),
    ('Food', 'EXPENSE', TRUE),
    ('Transport', 'EXPENSE', TRUE),
    ('Rent', 'EXPENSE', TRUE),
    ('Utilities', 'EXPENSE', TRUE),
    ('Shopping', 'EXPENSE', TRUE),
    ('Entertainment', 'EXPENSE', TRUE),
    ('Health', 'EXPENSE', TRUE),
    ('Education', 'EXPENSE', TRUE),
    ('Subscriptions', 'EXPENSE', TRUE),
    ('Bills', 'EXPENSE', TRUE),
    ('Other Expense', 'EXPENSE', TRUE);
