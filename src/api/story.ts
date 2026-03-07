import { apiFetch, ApiError } from './api'
import { getOperators } from '../config/runtime'
import type { Story, StorySummary, TrustChainPerson } from './types'

function deduplicateBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set<unknown>()
  return arr.filter((item) => {
    const k = item[key]
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function mergeStories(stories: Story[]): Story {
  const base = stories[0]
  return {
    ...base,
    signals: {
      activeCommunityCount: stories.reduce((sum, s) => sum + s.signals.activeCommunityCount, 0),
      activeSeats: stories.reduce((sum, s) => sum + s.signals.activeSeats, 0),
      longestSeatMonths: Math.max(...stories.map((s) => s.signals.longestSeatMonths)),
    },
    communities: stories.flatMap((s) => s.communities),
    timeline: stories
      .flatMap((s) => s.timeline)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30),
    trustChain: {
      vouchedBy: deduplicateBy(
        stories.flatMap((s) => s.trustChain.vouchedBy),
        'keycloakId' as keyof TrustChainPerson,
      ),
      vouchedFor: deduplicateBy(
        stories.flatMap((s) => s.trustChain.vouchedFor),
        'keycloakId' as keyof TrustChainPerson,
      ),
    },
  }
}

/** Fetch story from a single operator. */
export function fetchStoryFromOperator(
  operatorUrl: string,
  keycloakId: string,
  accessToken: string,
): Promise<Story> {
  return apiFetch<Story>(`/v2/sharemember/${keycloakId}/story`, accessToken, undefined, operatorUrl)
}

/** Fan out to all configured operators, merge community engagement across all of them. */
export async function fetchStory(keycloakId: string, accessToken: string): Promise<Story> {
  const operators = getOperators()
  const results = await Promise.allSettled(
    operators.map(({ url }) => fetchStoryFromOperator(url, keycloakId, accessToken)),
  )

  const stories = results
    .filter((r): r is PromiseFulfilledResult<Story> => r.status === 'fulfilled')
    .map((r) => r.value)

  if (stories.length === 0) {
    const firstRejection = results.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    )
    throw firstRejection?.reason ?? new ApiError(404, 'Member not found')
  }

  return mergeStories(stories)
}

export function fetchStorySummary(keycloakId: string, accessToken: string): Promise<StorySummary> {
  return apiFetch<StorySummary>(`/v2/sharemember/${keycloakId}/story/summary`, accessToken)
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
