import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2 } from 'lucide-react'
import * as transactionsApi from '../api/transactions'
import * as accountsApi from '../api/accounts'
import * as categoriesApi from '../api/categories'
import type { TransactionRequest, TransactionType } from '../types/api'

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

const TYPE_COLORS: Record<TransactionType, string> = {
  INCOME: 'text-accent',
  EXPENSE: 'text-danger',
  TRANSFER: 'text-ink/60',
}

const TYPE_SIGN: Record<TransactionType, string> = {
  INCOME: '+',
  EXPENSE: '−',
  TRANSFER: '⇄',
}

export function TransactionsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.listTransactions(0, 100),
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.listAccounts,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.listCategories,
  })

  const createMutation = useMutation({
    mutationFn: transactionsApi.createTransaction,
    onSuccess: () => {
      // Balances live on the account objects, so both caches need
      // invalidating — not just transactions — or the accounts page will
      // show a stale balance until the next unrelated refetch.
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const activeAccounts = (accounts ?? []).filter((a) => a.active)

  if (isLoading) return <p className="text-muted text-sm">Loading transactions…</p>
  if (error) return <p className="text-sm text-danger bg-danger/10 rounded-md px-3 py-2 inline-block">Couldn't load transactions.</p>

  if (activeAccounts.length === 0) {
    return (
      <p className="text-muted text-sm">
        Add an account first — transactions need somewhere to belong to.
      </p>
    )
  }

  const accountNameById = new Map(activeAccounts.map((a) => [a.id, a.name]))
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-accent text-white text-sm font-medium px-3.5 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New transaction'}
        </button>
      </div>

      {showForm && (
        <TransactionForm
          accounts={activeAccounts}
          categories={categories ?? []}
          onSubmit={(data) => createMutation.mutate(data)}
          submitting={createMutation.isPending}
          error={createMutation.isError ? 'Could not save transaction.' : null}
        />
      )}

      {(page?.content.length ?? 0) === 0 && !showForm ? (
        <p className="text-muted text-sm">No transactions yet.</p>
      ) : (
        <div className="border border-line rounded-lg divide-y divide-line bg-white">
          {page?.content.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 group">
              <div>
                <p className="text-sm font-medium">
                  {t.description || t.merchant || accountNameById.get(t.accountId) || 'Transaction'}
                </p>
                <p className="text-xs text-muted">
                  {t.date} · {accountNameById.get(t.accountId) ?? '—'}
                  {t.type === 'TRANSFER' && t.transferAccountId
                    ? ` → ${accountNameById.get(t.transferAccountId) ?? '—'}`
                    : ''}
                  {t.categoryId ? ` · ${categoryNameById.get(t.categoryId) ?? ''}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className={`mono-num font-medium ${TYPE_COLORS[t.type]}`}>
                  {TYPE_SIGN[t.type]} {formatMoney(t.amount, t.currency)}
                </p>
                <button
                  onClick={() => deleteMutation.mutate(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity"
                  aria-label="Delete transaction"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TransactionForm({
  accounts,
  categories,
  onSubmit,
  submitting,
  error,
}: {
  accounts: { id: string; name: string }[]
  categories: { id: string; name: string; type: string }[]
  onSubmit: (data: TransactionRequest) => void
  submitting: boolean
  error: string | null
}) {
  const [type, setType] = useState<TransactionType>('EXPENSE')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [transferAccountId, setTransferAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')

  const relevantCategories = categories.filter((c) => c.type === type)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      accountId,
      transferAccountId: type === 'TRANSFER' ? transferAccountId : undefined,
      categoryId: type !== 'TRANSFER' && categoryId ? categoryId : undefined,
      type,
      amount: Number(amount),
      date,
      description: description || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-lg p-4 bg-white mb-6 space-y-3">
      <div className="flex gap-2">
        {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
              type === t ? 'bg-ink text-white border-ink' : 'border-line text-ink/70'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink/70 mb-1">
            {type === 'TRANSFER' ? 'From account' : 'Account'}
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm bg-white"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {type === 'TRANSFER' ? (
          <div>
            <label className="block text-xs text-ink/70 mb-1">To account</label>
            <select
              required
              value={transferAccountId}
              onChange={(e) => setTransferAccountId(e.target.value)}
              className="w-full px-3 py-1.5 border border-line rounded-md text-sm bg-white"
            >
              <option value="">Select…</option>
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs text-ink/70 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-1.5 border border-line rounded-md text-sm bg-white"
            >
              <option value="">None</option>
              {relevantCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-ink/70 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/70 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-ink/70 mb-1">Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save transaction'}
      </button>
    </form>
  )
}
