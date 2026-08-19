CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    transfer_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    type                VARCHAR(20) NOT NULL,
    amount              NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    date                DATE NOT NULL,
    description         VARCHAR(500),
    merchant            VARCHAR(255),
    currency            VARCHAR(3) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ON DELETE RESTRICT on account_id/transfer_account_id is deliberate:
-- deleting an account with transaction history should fail loudly, not
-- silently orphan rows. The app only ever soft-deletes accounts (is_active
-- = false) for exactly this reason.

CREATE INDEX idx_transactions_user_id_date ON transactions (user_id, date DESC);
CREATE INDEX idx_transactions_account_id ON transactions (account_id);
CREATE INDEX idx_transactions_category_id ON transactions (category_id);
