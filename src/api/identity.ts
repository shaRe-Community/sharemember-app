import { getIdentityServiceUrl } from '../config/runtime'

export interface TrustInfo {
  confirmationCount: number
  tier: 1 | 2 | 3
  confirmedByMe: boolean
}

export async function fetchTrust(
  confirmeeId: string,
  accessToken: string
): Promise<TrustInfo> {
  const res = await fetch(
    `${getIdentityServiceUrl()}/v2/members/${confirmeeId}/trust`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`fetchTrust failed: ${res.status}`)
  return res.json() as Promise<TrustInfo>
}

export async function confirmIdentity(
  confirmeeId: string,
  accessToken: string
): Promise<TrustInfo> {
  const res = await fetch(
    `${getIdentityServiceUrl()}/v2/members/${confirmeeId}/confirmations`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  )
  if (!res.ok) throw new Error(`confirmIdentity failed: ${res.status}`)
  return res.json() as Promise<TrustInfo>
}
