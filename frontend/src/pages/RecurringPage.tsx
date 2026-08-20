import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2, Play, Pause } from 'lucide-react'
import * as recurringApi from '../api/recurring'
import * as accountsApi from '../api/accounts'
import * as categoriesApi from '../api/categories'
import type {
  RecurringFrequency,
  RecurringTransaction,
  RecurringTransactionRequest,
  TransactionType,
} from '../types/api'

function formatMoney(amount: number, currency = 'NGN') {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

const FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
}

export function RecurringPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)

  const { data: recurring, isLoading, error } = useQuery({
    queryKey: ['recurring'],
    queryFn: recurringApi.listRecurring,
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.listAccounts,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.listCategories,
  })

  const activeAccounts = (accounts ?? []).filter((a) => a.active)
  const accountNameById = new Map(activeAccounts.map((a) => [a.id, a.name]))
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]))

  const createMutation = useMutation({
    mutationFn: recurringApi.createRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
      setShowForm(false)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecurringTransactionRequest }) =>
      recurringApi.updateRecurring(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: recurringApi.deleteRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  })

  const runDueMutation = useMutation({
    mutationFn: recurringApi.runDueNow,
    onSuccess: (result) => {
      setRunResult(
        result.generated === 0
          ? 'Nothing was due — all caught up.'
          : `Generated ${result.generated} transaction${result.generated === 1 ? '' : 's'}.`
      )
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  function toggleActive(rt: RecurringTransaction) {
    toggleActiveMutation.mutate({
      id: rt.id,
      data: {
        accountId: rt.accountId,
        transferAccountId: rt.transferAccountId,
        categoryId: rt.categoryId,
        type: rt.type,
        amount: rt.amount,
        frequency: rt.frequency,
        startDate: rt.startDate,
        endDate: rt.endDate,
        description: rt.description ?? undefined,
        merchant: rt.merchant ?? undefined,
        active: !rt.active,
      },
    })
  }

  if (isLoading) return <p className="text-muted text-sm">Loading recurring transactions…</p>
  if (error)
    return (
      <p className="text-sm text-danger bg-danger/10 rounded-md px-3 py-2 inline-block">
        Couldn't load recurring transactions.
      </p>
    )

  if (activeAccounts.length === 0) {
    return <p className="text-muted text-sm">Add an account first.</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Recurring</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => runDueMutation.mutate()}
            disabled={runDueMutation.isPending}
            className="flex items-center gap-1.5 border border-line text-ink/70 text-sm font-medium px-3 py-2 rounded-md hover:bg-ink/5 disabled:opacity-50"
            title="Manually process anything due now, instead of waiting for the nightly job"
          >
            <Play size={14} />
            {runDueMutation.isPending ? 'Running…' : 'Run due now'}
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 bg-accent text-white text-sm font-medium px-3.5 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New recurring'}
          </button>
        </div>
      </div>

      {runResult && (
        <p className="text-xs text-accent bg-accent/10 rounded-md px-3 py-1.5 mb-4 inline-block">
          {runResult}
        </p>
      )}

      <p className="text-xs text-muted mb-6">
        Runs automatically every night. "Run due now" is for testing — it only processes your own
        overdue recurrences immediately instead of waiting.
      </p>

      {showForm && (
        <RecurringForm
          accounts={activeAccounts}
          categories={categories ?? []}
          onSubmit={(data) => createMutation.mutate(data)}
          submitting={createMutation.isPending}
          error={
            createMutation.isError
              ? (createMutation.error as any)?.response?.data?.message || 'Could not save.'
              : null
          }
        />
      )}

      {(recurring?.length ?? 0) === 0 && !showForm ? (
        <p className="text-muted text-sm">
          No recurring transactions yet — try "Netflix, ₦8,500, Monthly".
        </p>
      ) : (
        <div className="border border-line rounded-lg divide-y divide-line bg-white">
          {recurring?.map((rt) => (
            <div key={rt.id} className="flex items-center justify-between px-4 py-3">
              <div className={!rt.active ? 'opacity-50' : ''}>
                <p className="text-sm font-medium">
                  {rt.description || rt.merchant || accountNameById.get(rt.accountId) || 'Recurring'}
                </p>
                <p className="text-xs text-muted">
                  {FREQUENCY_LABEL[rt.frequency]} · {accountNameById.get(rt.accountId) ?? '—'}
                  {rt.categoryId ? ` · ${categoryNameById.get(rt.categoryId) ?? ''}` : ''}
                  {' · next '}
                  {rt.nextOccurrenceDate}
                  {!rt.active ? ' · paused' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={`mono-num font-medium ${!rt.active ? 'opacity-50' : ''} ${
                    rt.type === 'INCOME' ? 'text-accent' : rt.type === 'EXPENSE' ? 'text-danger' : 'text-ink/60'
                  }`}
                >
                  {formatMoney(rt.amount)}
                </p>
                <button
                  onClick={() => toggleActive(rt)}
                  className="text-muted hover:text-ink"
                  title={rt.active ? 'Pause' : 'Resume'}
                >
                  {rt.active ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(rt.id)}
                  className="text-muted hover:text-danger"
                  title="Delete"
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

function RecurringForm({
  accounts,
  categories,
  onSubmit,
  submitting,
  error,
}: {
  accounts: { id: string; name: string }[]
  categories: { id: string; name: string; type: string }[]
  onSubmit: (data: RecurringTransactionRequest) => void
  submitting: boolean
  error: string | null
}) {
  const [type, setType] = useState<TransactionType>('EXPENSE')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [transferAccountId, setTransferAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDate, setEndDate] = useState('')
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
      frequency,
      startDate,
      endDate: hasEndDate ? endDate : undefined,
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
          <label className="block text-xs text-ink/70 mb-1">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm bg-white"
          >
            {(Object.keys(FREQUENCY_LABEL) as RecurringFrequency[]).map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABEL[f]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-ink/70 mb-1">Starts</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm"
          />
        </div>

        <div className="col-span-2">
          <label className="flex items-center gap-1.5 text-xs text-ink/70 mb-1">
            <input
              type="checkbox"
              checked={hasEndDate}
              onChange={(e) => setHasEndDate(e.target.checked)}
            />
            Ends on a specific date
          </label>
          {hasEndDate && (
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-line rounded-md text-sm mt-1"
            />
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-ink/70 mb-1">Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Netflix"
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
        {submitting ? 'Saving…' : 'Save recurring transaction'}
      </button>
    </form>
  )
}
