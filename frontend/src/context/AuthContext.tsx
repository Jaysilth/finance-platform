import { createContext, useContext, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'

interface CurrentUser {
  userId: string
  email: string
  fullName: string
}

interface AuthContextValue {
  user: CurrentUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): CurrentUser | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as CurrentUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(loadStoredUser)

  function persist(res: { token: string; userId: string; email: string; fullName: string }) {
    localStorage.setItem('token', res.token)
    const u = { userId: res.userId, email: res.email, fullName: res.fullName }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password })
    persist(res)
  }

  async function register(email: string, password: string, fullName: string) {
    const res = await authApi.register({ email, password, fullName })
    persist(res)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
