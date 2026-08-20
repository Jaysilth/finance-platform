import { useQuery } from '@tanstack/react-query'
import * as accountsApi from '../api/accounts'
import * as transactionsApi from '../api/transactions'
import * as analyticsApi from '../api/analytics'
import * as categoriesApi from '../api/categories'

function formatMoney(amount: number, currency = 'NGN') {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function DashboardPage() {
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.listAccounts,
  })

  // Recent transactions list still comes straight from the transactions
  // endpoint — that's display-only and doesn't need aggregation.
  const { data: page, isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.listTransactions(0, 8),
  })

  // Totals now come from the backend, computed once server-side instead of
  // summed here from whatever page of transactions happened to be loaded.
  // No date range passed = backend defaults to the current calendar month.
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.listCategories,
  })

  if (accountsLoading || txLoading || summaryLoading) {
    return <p className="text-muted text-sm">Loading dashboard…</p>
  }

  const activeAccounts = (accounts ?? []).filter((a) => a.active)
  const recentTransactions = page?.content ?? []
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]))

  // Multi-currency accounts would make a single summed total meaningless,
  // so this only sums when every active account shares one currency. With
  // more than one currency present, show a note instead of a wrong number.
  const currencies = new Set(activeAccounts.map((a) => a.currency))
  const singleCurrency = currencies.size <= 1 ? [...currencies][0] ?? 'NGN' : null
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0)

  const displayCurrency = singleCurrency ?? 'NGN'

  const topExpenseCategories = (summary?.categoryBreakdown ?? [])
    .filter((c) => c.type === 'EXPENSE')
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
      <p className="text-xs text-muted mb-6">
        {summary?.from} to {summary?.to}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total balance"
          value={singleCurrency ? formatMoney(totalBalance, singleCurrency) : 'Mixed currencies'}
        />
        <StatCard
          label="Income this month"
          value={formatMoney(summary?.totalIncome ?? 0, displayCurrency)}
          accent="income"
        />
        <StatCard
          label="Expenses this month"
          value={formatMoney(summary?.totalExpense ?? 0, displayCurrency)}
          accent="expense"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-medium text-ink/70 mb-3">Recent transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-muted text-sm">Nothing recorded yet.</p>
          ) : (
            <div className="border border-line rounded-lg divide-y divide-line bg-white">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {t.description || t.merchant || 'Transaction'}
                    </p>
                    <p className="text-xs text-muted">{t.date}</p>
                  </div>
                  <p
                    className={`mono-num text-sm font-medium ${
                      t.type === 'INCOME'
                        ? 'text-accent'
                        : t.type === 'EXPENSE'
                        ? 'text-danger'
                        : 'text-ink/60'
                    }`}
                  >
                    {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '−' : '⇄'}{' '}
                    {formatMoney(t.amount, t.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-ink/70 mb-3">Top spending categories</h2>
          {topExpenseCategories.length === 0 ? (
            <p className="text-muted text-sm">No expenses recorded this month yet.</p>
          ) : (
            <div className="border border-line rounded-lg divide-y divide-line bg-white">
              {topExpenseCategories.map((c) => (
                <div
                  key={c.categoryId ?? 'uncategorized'}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <p className="text-sm">
                    {c.categoryId ? categoryNameById.get(c.categoryId) ?? 'Unknown' : 'Uncategorized'}
                  </p>
                  <p className="mono-num text-sm font-medium text-danger">
                    {formatMoney(c.total, displayCurrency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'income' | 'expense'
}) {
  return (
    <div className="border border-line rounded-lg p-4 bg-white">
      <p className="text-xs text-muted uppercase tracking-wide mb-1.5">{label}</p>
      <p
        className={`mono-num text-2xl font-semibold ${
          accent === 'income' ? 'text-accent' : accent === 'expense' ? 'text-danger' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}
