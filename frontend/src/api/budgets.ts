import { api } from './client'
import type { Budget, BudgetRequest } from '../types/api'

export async function listBudgets(): Promise<Budget[]> {
  const res = await api.get<Budget[]>('/api/budgets')
  return res.data
}

export async function createBudget(data: BudgetRequest): Promise<Budget> {
  const res = await api.post<Budget>('/api/budgets', data)
  return res.data
}

export async function updateBudget(id: string, data: BudgetRequest): Promise<Budget> {
  const res = await api.put<Budget>(`/api/budgets/${id}`, data)
  return res.data
}

export async function deleteBudget(id: string): Promise<void> {
  await api.delete(`/api/budgets/${id}`)
}
