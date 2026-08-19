import { api } from './client'
import type { Page, Transaction, TransactionRequest } from '../types/api'

export async function listTransactions(page = 0, size = 50): Promise<Page<Transaction>> {
  const res = await api.get<Page<Transaction>>('/api/transactions', {
    params: { page, size, sort: 'date,desc' },
  })
  return res.data
}

export async function createTransaction(data: TransactionRequest): Promise<Transaction> {
  const res = await api.post<Transaction>('/api/transactions', data)
  return res.data
}

export async function updateTransaction(id: string, data: TransactionRequest): Promise<Transaction> {
  const res = await api.put<Transaction>(`/api/transactions/${id}`, data)
  return res.data
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/api/transactions/${id}`)
}
