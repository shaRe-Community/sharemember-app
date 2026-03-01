// src/api/keycloak-account.ts

import { ApiError } from './api'

const SSO_URL = import.meta.env.VITE_SSO_URL
const REALM = import.meta.env.VITE_KEYCLOAK_REALM
const BASE = `${SSO_URL}/realms/${REALM}/account`

export interface KcUserInfo {
  username: string
  firstName: string
  lastName: string
  email: string
}

export interface KcApiError {
  error: string
  errorMessage?: string
}

async function kcFetch<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T | void> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as KcApiError
    throw new ApiError(res.status, body.errorMessage ?? body.error ?? `KC API ${res.status}`)
  }
  // 204 No Content — return void
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : undefined
}

export async function getAccountInfo(token: string): Promise<KcUserInfo> {
  const result = await kcFetch<KcUserInfo>('', token)
  if (!result) throw new Error('Unexpected empty response from GET /account')
  return result
}

export function updateAccountInfo(token: string, info: KcUserInfo): Promise<void> {
  return kcFetch<void>('', token, {
    method: 'POST',
    body: JSON.stringify(info),
  }) as Promise<void>
}

export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return kcFetch<void>('/credentials/password', token, {
    method: 'PUT',
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmation: newPassword,
    }),
  }) as Promise<void>
}
