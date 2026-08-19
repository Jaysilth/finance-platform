import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import * as accountsApi from '../api/accounts'
import type { Account, AccountRequest, AccountType } from '../types/api'

const ACCOUNT_TYPES: AccountType[] = [
  'BANK',
  'CASH',
  'WALLET',
  'CREDIT_CARD',
  'INVESTMENT',
  'CRYPTO',
  'OTHER',
]

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
  } catch {
    // Falls back if currency code isn't ISO-recognized by Intl
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function AccountsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.listAccounts,
  })

  const createMutation = useMutation({
    mutationFn: accountsApi.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setShowForm(false)
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: accountsApi.deactivateAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })

  if (isLoading) return <p className="text-muted text-sm">Loading accounts…</p>
  if (error) return <ErrorState message="Couldn't load accounts." />

  const activeAccounts = (accounts ?? []).filter((a) => a.active)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-accent text-white text-sm font-medium px-3.5 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New account'}
        </button>
      </div>

      {showForm && (
        <AccountForm
          onSubmit={(data) => createMutation.mutate(data)}
          submitting={createMutation.isPending}
          error={createMutation.isError ? 'Could not create account.' : null}
        />
      )}

      {activeAccounts.length === 0 && !showForm ? (
        <p className="text-muted text-sm">
          No accounts yet. Add the accounts your money actually lives in — bank, cash, wallet — to start tracking transactions.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onDeactivate={() => deactivateMutation.mutate(account.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AccountCard({ account, onDeactivate }: { account: Account; onDeactivate: () => void }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="border border-line rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide">
            {account.type.replace('_', ' ')}
            {account.institution ? ` · ${account.institution}` : ''}
          </p>
          <p className="font-medium">{account.name}</p>
        </div>
        {confirming ? (
          <div className="flex gap-1.5">
            <button
              onClick={onDeactivate}
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
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-muted hover:text-danger"
          >
            Remove
          </button>
        )}
      </div>
      <p className="mono-num text-2xl font-semibold mt-3">
        {formatMoney(account.balance, account.currency)}
      </p>
    </div>
  )
}

function AccountForm({
  onSubmit,
  submitting,
  error,
}: {
  onSubmit: (data: AccountRequest) => void
  submitting: boolean
  error: string | null
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('BANK')
  const [currency, setCurrency] = useState('NGN')
  const [institution, setInstitution] = useState('')
  const [initialBalance, setInitialBalance] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      type,
      currency,
      institution: institution || undefined,
      initialBalance: initialBalance ? Number(initialBalance) : 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-lg p-4 bg-white mb-6 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink/70 mb-1">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GTBank"
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/70 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm bg-white"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink/70 mb-1">Currency</label>
          <input
            required
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm uppercase"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/70 mb-1">Starting balance</label>
          <input
            type="number"
            step="0.01"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-1.5 border border-line rounded-md text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-ink/70 mb-1">Institution (optional)</label>
          <input
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
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
        {submitting ? 'Adding…' : 'Add account'}
      </button>
    </form>
  )
}

function ErrorState({ message }: { message: string }) {
  return <p className="text-sm text-danger bg-danger/10 rounded-md px-3 py-2 inline-block">{message}</p>
}
