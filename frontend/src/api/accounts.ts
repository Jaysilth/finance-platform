import { api } from './client'
import type { Account, AccountRequest } from '../types/api'

export async function listAccounts(): Promise<Account[]> {
  const res = await api.get<Account[]>('/api/accounts')
  return res.data
}

export async function getAccount(id: string): Promise<Account> {
  const res = await api.get<Account>(`/api/accounts/${id}`)
  return res.data
}

export async function createAccount(data: AccountRequest): Promise<Account> {
  const res = await api.post<Account>('/api/accounts', data)
  return res.data
}

export async function updateAccount(id: string, data: AccountRequest): Promise<Account> {
  const res = await api.put<Account>(`/api/accounts/${id}`, data)
  return res.data
}

export async function deactivateAccount(id: string): Promise<void> {
  await api.delete(`/api/accounts/${id}`)
}
