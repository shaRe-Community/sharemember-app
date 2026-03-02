import { apiFetch } from './api'

export interface VouchRequest {
  id: string
  requestedAt: string
  requestee: {
    shareMemberId: string
    name: string
    pictureUrl: string | null
  }
}

export function fetchVouchRequest(
  requestId: string,
  accessToken: string,
): Promise<VouchRequest> {
  return apiFetch<VouchRequest>(
    `/v2/sharemember/vouch-requests/${requestId}`,
    accessToken,
  )
}

export function fetchPendingVouchRequests(
  accessToken: string,
): Promise<VouchRequest[]> {
  return apiFetch<VouchRequest[]>(
    '/v2/sharemember/vouch-requests',
    accessToken,
  )
}

export function confirmVouch(requestId: string, accessToken: string): Promise<void> {
  return apiFetch(
    `/v2/sharemember/vouch-requests/${requestId}/confirm`,
    accessToken,
    { method: 'POST' },
  )
}

export function declineVouch(requestId: string, accessToken: string): Promise<void> {
  return apiFetch(
    `/v2/sharemember/vouch-requests/${requestId}/decline`,
    accessToken,
    { method: 'POST' },
  )
}
