import type { PublicCommunityTeaser } from './types'
import { getOperatorUrls } from '../config/runtime'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
  }
}

export async function apiFetch<T>(
  path: string,
  accessToken: string,
  options?: RequestInit,
  baseUrl?: string
): Promise<T> {
  const url = (baseUrl ?? getOperatorUrls()[0]) + path
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

// Calls the same path on all operators in parallel, merges results.
// Uses allSettled so a down operator doesn't block the others.
export async function apiFetchFromAll<T>(
  path: string,
  accessToken: string,
): Promise<{ data: T[]; operatorUrl: string }[]> {
  const results = await Promise.allSettled(
    getOperatorUrls().map(async (operatorUrl) => ({
      data: await apiFetch<T[]>(path, accessToken, undefined, operatorUrl),
      operatorUrl,
    }))
  )
  return results
    .filter(
      (r): r is PromiseFulfilledResult<{ data: T[]; operatorUrl: string }> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value)
}

export function fetchPublicCommunities(
  accessToken: string
): Promise<PublicCommunityTeaser[]> {
  return apiFetch<PublicCommunityTeaser[]>(
    '/v2/sharemember/me/communities/discover',
    accessToken
  )
}

export function joinOpenCommunity(
  communityId: string,
  accessToken: string,
  baseUrl?: string
): Promise<{
  communityId: string
  communityName: string
  frontendUrl: string | null
}> {
  return apiFetch(
    `/v2/sharemember/me/communities/${communityId}/join-open`,
    accessToken,
    { method: 'POST' },
    baseUrl
  )
}
