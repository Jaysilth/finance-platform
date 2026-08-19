// These mirror the backend DTOs field-for-field. If you change a field name
// or type on the backend (AccountRequest, TransactionResponse, etc.), update
// it here too — there's no shared schema between the two, so drift here is
// silent until a form submit fails with a 400.

export type AccountType =
  | 'BANK'
  | 'CASH'
  | 'WALLET'
  | 'CREDIT_CARD'
  | 'INVESTMENT'
  | 'CRYPTO'
  | 'OTHER'

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export type CategoryType = 'INCOME' | 'EXPENSE'

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: string
  balance: number
  institution: string | null
  active: boolean
  createdAt: string
}

export interface AccountRequest {
  name: string
  type: AccountType
  currency: string
  initialBalance?: number
  institution?: string
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  isDefault: boolean
}

export interface CategoryRequest {
  name: string
  type: CategoryType
}

export interface Transaction {
  id: string
  accountId: string
  transferAccountId: string | null
  categoryId: string | null
  type: TransactionType
  amount: number
  date: string
  description: string | null
  merchant: string | null
  currency: string
  createdAt: string
}

export interface TransactionRequest {
  accountId: string
  transferAccountId?: string | null
  categoryId?: string | null
  type: TransactionType
  amount: number
  date: string
  description?: string
  merchant?: string
}

// Spring's Page<T> shape
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface AuthResponse {
  token: string
  userId: string
  email: string
  fullName: string
}
