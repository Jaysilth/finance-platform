import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2 } from 'lucide-react'
import * as budgetsApi from '../api/budgets'
import * as categoriesApi from '../api/categories'
import type { Budget, BudgetPeriodType, BudgetRequest } from '../types/api'

function formatMoney(amount: number, currency = 'NGN') {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function BudgetsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: budgets, isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetsApi.listBudgets,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.listCategories,
  })

  const createMutation = useMutation({
    mutationFn: budgetsApi.createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: budgetsApi.deleteBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  })

  const expenseCategories = (categories ?? []).filter((c) => c.type === 'EXPENSE')
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]))

  if (isLoading) return <p className="text-muted text-sm">Loading budgets…</p>
  if (error)
    return (
      <p className="text-sm text-danger bg-danger/10 rounded-md px-3 py-2 inline-block">
        Couldn't load budgets.
      </p>
    )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-accent text-white text-sm font-medium px-3.5 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New budget'}
        </button>
      </div>

      {showForm && (
        <BudgetForm
          categories={expenseCategories}
          onSubmit={(data) => createMutation.mutate(data)}
          submitting={createMutation.isPending}
          error={createMutation.isError ? 'Could not save budget. Check the fields and try again.' : null}
        />
      )}

      {(budgets?.length ?? 0) === 0 && !showForm ? (
        <p className="text-muted text-sm">
          No budgets yet. A budget covers one or more expense categories over a period — try "Food: ₦100,000/month" to start.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {budgets?.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              categoryNameById={categoryNameById}
              onDelete={() => deleteMutation.mutate(budget.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BudgetCard({
  budget,
  categoryNameById,
  onDelete,
}: {
  budget: Budget
  categoryNameById: Map<string, string>
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const pct = Math.min(budget.percentUsed, 100)
  const overBudget = budget.percentUsed > 100
  const nearLimit = budget.percentUsed >= 80 && !overBudget

  const barColor = overBudget ? 'bg-danger' : nearLimit ? 'bg-amber-500' : 'bg-accent'
  const categoryNames = budget.categoryIds.map((id) => categoryNameById.get(id) ?? '—').join(', ')

  return (
    <div className="border border-line rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="font-medium">{budget.name}</p>
          <p className="text-xs text-muted">{categoryNames}</p>
        </div>
        {confirming ? (
          <div className="flex gap-1.5">
            <button
              onClick={onDelete}
              className="text-xs text-danger font-medium px-2 py-1 rounded hover:bg-danger/10"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-muted px-2 py-1 rounded hover:bg-ink/5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-muted hover:text-danger">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {!budget.active ? (
        <p className="text-xs text-muted mt-3">
          Not active yet — starts {budget.startDate}
        </p>
      ) : (
        <>
          <div className="flex items-baseline justify-between mt-3 mb-1.5">
            <p className="mono-num text-sm">
              <span className={overBudget ? 'text-danger font-semibold' : 'font-semibold'}>
                {formatMoney(budget.spent)}
              </span>
              <span className="text-muted"> / {formatMoney(budget.amount)}</span>
            </p>
            <p className={`text-xs font-medium ${overBudget ? 'text-danger' : 'text-muted'}`}>
              {budget.percentUsed.toFixed(0)}%
            </p>
          </div>
          <div className="h-1.5 bg-line rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2">
            {budget.periodType === 'MONTHLY' ? 'Monthly' : 'Custom range'} · {budget.periodFrom} – {budget.periodTo}
          </p>
        </>
      )}
    </div>
  )
}

function BudgetForm({
  categories,
  onSubmit,
  submitting,
  error,
}: {
  categories: { id: string; name: string }[]
  onSubmit: (data: BudgetRequest) => void
  submitting: boolean
  error: string | null
}) {
  const [name, setName] = useState('')
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('MONTHLY')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      periodType,
      amount: Number(amount),
      startDate,
      endDate: periodType === 'CUSTOM' ? endDate : undefined,
      categoryIds: selectedCategoryIds,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-lg p-4 bg-white mb-6 space-y-3">
      <div>
        <label className="block text-xs text-ink/70 mb-1">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Food, or Discretionary"
          className="w-full px-3 py-1.5 border border-line rounded-md text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-ink/70 mb-1.5">Categories</label>
        {categories.length === 0 ? (
          <p className="text-xs text-muted">No expense categories available.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`px-2.5 py-1 rounded-full text-xs border ${
                  selectedCategoryIds.includes(c.id)
                    ? 'bg-ink text-white border-ink'
                    : 'border-line text-ink/70'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        {selectedCategoryIds.length === 0 && (
          <p className="text-xs text-muted mt-1">Select at least one category.</p>
        )}
      </div>

      <div className="flex gap-2">
        {(['MONTHLY', 'CUSTOM'] as BudgetPeriodType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setPeriodType(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
              periodType === t ? 'bg-ink text-white border-ink' : 'border-line text-ink/70'
            }`}
          >
            {t === 'MONTHLY' ? 'Monthly (recurring)' : 'Custom range'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
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
          <label className="block text-xs text-ink/70 mb-1">
            {periodType === 'MONTHLY' ? 'Starts' : 'From'}
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm"
          />
        </div>
        {periodType === 'CUSTOM' && (
          <div className="col-span-2">
            <label className="block text-xs text-ink/70 mb-1">To</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-line rounded-md text-sm"
            />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting || selectedCategoryIds.length === 0}
        className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save budget'}
      </button>
    </form>
  )
}
