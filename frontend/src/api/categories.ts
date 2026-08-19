import { api } from './client'
import type { Category, CategoryRequest } from '../types/api'

export async function listCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>('/api/categories')
  return res.data
}

export async function createCategory(data: CategoryRequest): Promise<Category> {
  const res = await api.post<Category>('/api/categories', data)
  return res.data
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/api/categories/${id}`)
}
