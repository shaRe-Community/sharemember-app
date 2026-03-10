import { apiFetch } from './api'
import { getIdentityServiceUrl } from '../config/runtime'

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
  accessToken: string
): Promise<VouchRequest> {
  return apiFetch<VouchRequest>(
    `/v2/vouch-requests/${requestId}`,
    accessToken,
    undefined,
    getIdentityServiceUrl()
  )
}

export function fetchPendingVouchRequests(
  accessToken: string
): Promise<VouchRequest[]> {
  return apiFetch<VouchRequest[]>(
    '/v2/vouch-requests/pending',
    accessToken,
    undefined,
    getIdentityServiceUrl()
  )
}

export function confirmVouch(
  requestId: string,
  accessToken: string
): Promise<void> {
  return apiFetch<void>(
    `/v2/vouch-requests/${requestId}/confirm`,
    accessToken,
    { method: 'POST' },
    getIdentityServiceUrl()
  )
}

export function declineVouch(
  requestId: string,
  accessToken: string
): Promise<void> {
  return apiFetch<void>(
    `/v2/vouch-requests/${requestId}/decline`,
    accessToken,
    { method: 'POST' },
    getIdentityServiceUrl()
  )
}

export function createOpenVouchRequest(
  accessToken: string
): Promise<VouchRequest> {
  return apiFetch<VouchRequest>(
    '/v2/vouch-requests/open',
    accessToken,
    { method: 'POST' },
    getIdentityServiceUrl()
  )
}

export function fetchRequestStatus(
  requestId: string,
  accessToken: string
): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(
    `/v2/vouch-requests/${requestId}/status`,
    accessToken,
    undefined,
    getIdentityServiceUrl()
  )
}

export function createVouchRequest(
  targetEmail: string,
  accessToken: string
): Promise<VouchRequest> {
  return apiFetch<VouchRequest>(
    '/v2/vouch-requests',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ targetEmail }),
    },
    getIdentityServiceUrl()
  )
}
