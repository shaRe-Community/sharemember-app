import { apiFetch } from './api'
import type { Story, StorySummary } from './types'

export function fetchStory(shareMemberId: string, accessToken: string): Promise<Story> {
  return apiFetch<Story>(`/v2/sharemember/${shareMemberId}/story`, accessToken)
}

export function fetchStorySummary(shareMemberId: string, accessToken: string): Promise<StorySummary> {
  return apiFetch<StorySummary>(`/v2/sharemember/${shareMemberId}/story/summary`, accessToken)
}

export function searchMembers(
  q: string,
  accessToken: string,
  eidFilter?: string,
): Promise<StorySummary[]> {
  const params = new URLSearchParams({ q })
  if (eidFilter) params.set('eidFilter', eidFilter)
  return apiFetch<StorySummary[]>(`/v2/sharemember/search?${params.toString()}`, accessToken)
}
