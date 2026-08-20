CREATE TABLE recurring_transactions (
                                        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                        user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                        account_id            UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
                                        transfer_account_id   UUID REFERENCES accounts(id) ON DELETE RESTRICT,
                                        category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
                                        type                  VARCHAR(20) NOT NULL,
                                        amount                NUMERIC(19,4) NOT NULL CHECK (amount > 0),
                                        frequency             VARCHAR(20) NOT NULL,
                                        start_date            DATE NOT NULL,
                                        next_occurrence_date  DATE NOT NULL,
                                        end_date              DATE,
                                        description           VARCHAR(500),
                                        merchant              VARCHAR(255),
                                        active                BOOLEAN NOT NULL DEFAULT TRUE,
                                        created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
                                        updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions (user_id);

-- Powers the scheduler's core query: "every active recurrence due on or
-- before today", across all users, every night.
CREATE INDEX idx_recurring_transactions_due
    ON recurring_transactions (active, next_occurrence_date)
    WHERE active = TRUE;

-- Traceability link from a generated transaction back to the recurring
-- definition that created it. ON DELETE SET NULL (not CASCADE): deleting
-- the recurring definition must never delete transaction history that
-- already happened — see the comment on Transaction.recurringTransactionId.
ALTER TABLE transactions
    ADD COLUMN recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_recurring_transaction_id ON transactions (recurring_transaction_id);
