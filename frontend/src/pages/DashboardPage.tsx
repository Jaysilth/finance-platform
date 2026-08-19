import { useQuery } from '@tanstack/react-query'
import * as accountsApi from '../api/accounts'
import * as transactionsApi from '../api/transactions'

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

  const { data: page, isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.listTransactions(0, 200),
  })

  if (accountsLoading || txLoading) {
    return <p className="text-muted text-sm">Loading dashboard…</p>
  }

  const activeAccounts = (accounts ?? []).filter((a) => a.active)
  const transactions = page?.content ?? []

  // Multi-currency accounts would make a single summed total meaningless,
  // so this only sums when every active account shares one currency. With
  // more than one currency present, show a note instead of a wrong number.
  const currencies = new Set(activeAccounts.map((a) => a.currency))
  const singleCurrency = currencies.size <= 1 ? [...currencies][0] ?? 'NGN' : null
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0)

  const now = new Date()
  const thisMonth = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  // TRANSFER is deliberately excluded here — it's not income or expense,
  // it's money moving between the user's own accounts. Counting it would
  // double-count every transfer as both spending and earning.
  const monthIncome = thisMonth
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)
  const monthExpense = thisMonth
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

  const recentTransactions = transactions.slice(0, 8)
  const accountNameById = new Map(activeAccounts.map((a) => [a.id, a.name]))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total balance"
          value={
            singleCurrency
              ? formatMoney(totalBalance, singleCurrency)
              : 'Mixed currencies'
          }
        />
        <StatCard label="Income this month" value={formatMoney(monthIncome, singleCurrency ?? 'NGN')} accent="income" />
        <StatCard label="Expenses this month" value={formatMoney(monthExpense, singleCurrency ?? 'NGN')} accent="expense" />
      </div>

      <h2 className="text-sm font-medium text-ink/70 mb-3">Recent transactions</h2>
      {recentTransactions.length === 0 ? (
        <p className="text-muted text-sm">Nothing recorded yet.</p>
      ) : (
        <div className="border border-line rounded-lg divide-y divide-line bg-white">
          {recentTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {t.description || t.merchant || accountNameById.get(t.accountId) || 'Transaction'}
                </p>
                <p className="text-xs text-muted">
                  {t.date} · {accountNameById.get(t.accountId) ?? '—'}
                </p>
              </div>
              <p
                className={`mono-num text-sm font-medium ${
                  t.type === 'INCOME' ? 'text-accent' : t.type === 'EXPENSE' ? 'text-danger' : 'text-ink/60'
                }`}
              >
                {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '−' : '⇄'} {formatMoney(t.amount, t.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
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
