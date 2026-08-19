import { api } from './client'
import type { AuthResponse } from '../types/api'

export async function register(data: {
  email: string
  password: string
  fullName: string
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/register', data)
  return res.data
}

export async function login(data: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/login', data)
  return res.data
}
