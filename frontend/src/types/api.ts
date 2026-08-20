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
  recurringTransactionId: string | null
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

export interface CategoryTotal {
  categoryId: string | null
  type: 'INCOME' | 'EXPENSE'
  total: number
}

export interface AnalyticsSummary {
  from: string
  to: string
  totalIncome: number
  totalExpense: number
  net: number
  categoryBreakdown: CategoryTotal[]
}

export interface AuthResponse {
  token: string
  userId: string
  email: string
  fullName: string
}

export type BudgetPeriodType = 'MONTHLY' | 'CUSTOM'

export interface Budget {
  id: string
  name: string
  periodType: BudgetPeriodType
  amount: number
  startDate: string
  endDate: string | null
  categoryIds: string[]
  periodFrom: string
  periodTo: string
  spent: number
  remaining: number
  percentUsed: number
  active: boolean
}

export interface BudgetRequest {
  name: string
  periodType: BudgetPeriodType
  amount: number
  startDate: string
  endDate?: string | null
  categoryIds: string[]
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurringTransaction {
  id: string
  accountId: string
  transferAccountId: string | null
  categoryId: string | null
  type: TransactionType
  amount: number
  frequency: RecurringFrequency
  startDate: string
  nextOccurrenceDate: string
  endDate: string | null
  description: string | null
  merchant: string | null
  active: boolean
}

export interface RecurringTransactionRequest {
  accountId: string
  transferAccountId?: string | null
  categoryId?: string | null
  type: TransactionType
  amount: number
  frequency: RecurringFrequency
  startDate: string
  endDate?: string | null
  description?: string
  merchant?: string
  active?: boolean
}
