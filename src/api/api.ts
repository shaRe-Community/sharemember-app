import type { PublicCommunityTeaser } from './types'

const API_URL = import.meta.env.VITE_API_URL

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
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
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
  accessToken: string
): Promise<{
  communityId: string
  communityName: string
  frontendUrl: string | null
}> {
  return apiFetch(
    `/v2/sharemember/me/communities/${communityId}/join-open`,
    accessToken,
    { method: 'POST' }
  )
}
