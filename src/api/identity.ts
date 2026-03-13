import { apiFetch } from './api'
import { getIdentityServiceUrl } from '../config/runtime'

export interface TrustInfo {
  confirmationCount: number
  tier: 1 | 2 | 3
  confirmedByMe: boolean
}

export function fetchTrust(confirmeeId: string, accessToken: string): Promise<TrustInfo> {
  return apiFetch<TrustInfo>(
    `/v2/members/${confirmeeId}/trust`,
    accessToken,
    undefined,
    getIdentityServiceUrl(),
  )
}

export function confirmIdentity(confirmeeId: string, accessToken: string): Promise<TrustInfo> {
  return apiFetch<TrustInfo>(
    `/v2/members/${confirmeeId}/confirmations`,
    accessToken,
    { method: 'POST' },
    getIdentityServiceUrl(),
  )
}
