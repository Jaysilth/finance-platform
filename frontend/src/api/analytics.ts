import { api } from './client'
import type { AnalyticsSummary } from '../types/api'

export async function getSummary(from?: string, to?: string): Promise<AnalyticsSummary> {
  const res = await api.get<AnalyticsSummary>('/api/analytics/summary', {
    params: { from, to },
  })
  return res.data
}
