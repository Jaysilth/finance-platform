import { api } from './client'
import type { RecurringTransaction, RecurringTransactionRequest } from '../types/api'

export async function listRecurring(): Promise<RecurringTransaction[]> {
  const res = await api.get<RecurringTransaction[]>('/api/recurring-transactions')
  return res.data
}

export async function createRecurring(data: RecurringTransactionRequest): Promise<RecurringTransaction> {
  const res = await api.post<RecurringTransaction>('/api/recurring-transactions', data)
  return res.data
}

export async function updateRecurring(
  id: string,
  data: RecurringTransactionRequest
): Promise<RecurringTransaction> {
  const res = await api.put<RecurringTransaction>(`/api/recurring-transactions/${id}`, data)
  return res.data
}

export async function deleteRecurring(id: string): Promise<void> {
  await api.delete(`/api/recurring-transactions/${id}`)
}

// Manually triggers processing of the current user's own due recurrences —
// for testing without waiting for the nightly 1am job. Returns how many
// transactions were generated.
export async function runDueNow(): Promise<{ generated: number }> {
  const res = await api.post<{ generated: number }>('/api/recurring-transactions/run-due')
  return res.data
}
