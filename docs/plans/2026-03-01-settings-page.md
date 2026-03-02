# Settings Page (SM-6ih) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/settings` page to sharemember-app where users can update their name/email and change their password — all via the Keycloak Account REST API, with no operator-ts involvement.

**Architecture:** sharemember-app talks directly to `GET/POST /realms/{realm}/account` (personal info) and `PUT /realms/{realm}/account/credentials/password` (password). Bearer token is `user.accessToken` from AuthContext. A new `src/api/keycloak-account.ts` module encapsulates all KC Account API calls. The Settings page is a new protected route `/settings`.

**Tech Stack:** React, react-i18next, existing CSS form classes (`form-field`, `form-label`, `form-input`), Keycloak Account REST API v26.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/api/api.ts` | Existing `apiFetch` pattern to follow |
| `src/pages/HubPage.tsx` | API call + loading/error state pattern |
| `src/pages/JoinPage.tsx` | Form submit + success/error feedback pattern |
| `src/App.tsx` | Route registration |
| `src/components/AppShell.tsx` | Nav link addition |
| `src/i18n/locales/en.json` | Add `settings.*` keys |
| `src/i18n/locales/de.json` | Add `settings.*` keys |
| `src/App.css` | Reuse `.form-field`, `.form-label`, `.form-input`, `.profile-card` |

## Keycloak Account REST API

Base URL: `${VITE_SSO_URL}/realms/${VITE_KEYCLOAK_REALM}/account`

```
GET  /account                        → { firstName, lastName, email, username, ... }
POST /account                        → body: { firstName, lastName, email, username }
                                       → 204 No Content on success
PUT  /account/credentials/password   → body: { currentPassword, newPassword, confirmation }
                                       → 204 No Content on success
                                       → 400 { error, errorMessage } on failure
```

**Auth:** `Authorization: Bearer {user.accessToken}` on all requests.

**Potential gotcha:** If the KC client `prod-sharemember-app` doesn't include `account` audience, the API returns 401. In that case, add `account` to the client's audience mapper in Keycloak Admin. The plan handles this with a clear 401 error message.

---

## Task 1: Keycloak Account API module

**Files:**
- Create: `src/api/keycloak-account.ts`

**Step 1: Create the module**

```typescript
// src/api/keycloak-account.ts

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
    throw new Error(body.errorMessage ?? body.error ?? `KC API ${res.status}`)
  }
  // 204 No Content — return void
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : undefined
}

export function getAccountInfo(token: string): Promise<KcUserInfo | void> {
  return kcFetch<KcUserInfo>('', token)
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
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/api/keycloak-account.ts
git commit -m "feat(SM-6ih): add Keycloak Account REST API module"
```

---

## Task 2: i18n strings

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/de.json`

**Step 1: Add `settings` section to en.json**

Add after the `"profile"` block:

```json
"settings": {
  "title": "Settings",
  "personal_info_title": "Personal Information",
  "first_name": "First name",
  "last_name": "Last name",
  "email": "Email address",
  "save": "Save changes",
  "saving": "Saving…",
  "save_success": "Changes saved.",
  "password_title": "Change Password",
  "current_password": "Current password",
  "new_password": "New password",
  "confirm_password": "Confirm new password",
  "password_mismatch": "Passwords do not match.",
  "change_password": "Change password",
  "changing_password": "Changing…",
  "password_success": "Password changed successfully.",
  "error_generic": "Something went wrong. Please try again.",
  "error_401": "Session expired. Please sign out and sign back in."
}
```

Also add to `"nav"` section: `"settings": "Settings"`

**Step 2: Add `settings` section to de.json**

Add after the `"profile"` block:

```json
"settings": {
  "title": "Einstellungen",
  "personal_info_title": "Persönliche Daten",
  "first_name": "Vorname",
  "last_name": "Nachname",
  "email": "E-Mail-Adresse",
  "save": "Änderungen speichern",
  "saving": "Speichern…",
  "save_success": "Änderungen gespeichert.",
  "password_title": "Passwort ändern",
  "current_password": "Aktuelles Passwort",
  "new_password": "Neues Passwort",
  "confirm_password": "Neues Passwort bestätigen",
  "password_mismatch": "Passwörter stimmen nicht überein.",
  "change_password": "Passwort ändern",
  "changing_password": "Wird geändert…",
  "password_success": "Passwort erfolgreich geändert.",
  "error_generic": "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  "error_401": "Sitzung abgelaufen. Bitte ab- und neu anmelden."
}
```

Also add to `"nav"` section: `"settings": "Einstellungen"`

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/de.json
git commit -m "feat(SM-6ih): add settings i18n strings EN + DE"
```

---

## Task 3: SettingsPage component

**Files:**
- Create: `src/pages/SettingsPage.tsx`

**Step 1: Create the page**

```typescript
// src/pages/SettingsPage.tsx
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import {
  getAccountInfo,
  updateAccountInfo,
  changePassword,
  type KcUserInfo,
} from '../api/keycloak-account'

export function SettingsPage(): JSX.Element {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <AppShell>
      <div className="settings-container">
        <h1 className="settings-title">{t('settings.title')}</h1>
        <PersonalInfoSection token={user!.accessToken} />
        <PasswordSection token={user!.accessToken} />
      </div>
    </AppShell>
  )
}

// ── Personal Info ──────────────────────────────────────────────────────────

function PersonalInfoSection({ token }: { token: string }): JSX.Element {
  const { t } = useTranslation()
  const [form, setForm] = useState<KcUserInfo>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAccountInfo(token)
      .then((info) => {
        if (info) setForm(info)
      })
      .catch(() => setError(t('settings.error_generic')))
      .finally(() => setIsLoading(false))
  }, [token, t])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    setError(null)
    try {
      await updateAccountInfo(token, form)
      setSuccess(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.includes('401') ? t('settings.error_401') : t('settings.error_generic'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="settings-card"><p>{t('nav.loading')}</p></div>

  return (
    <div className="settings-card">
      <h2 className="settings-section-title">{t('settings.personal_info_title')}</h2>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="settings-row">
          <div className="form-field">
            <label className="form-label">{t('settings.first_name')}</label>
            <input
              className="form-input"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">{t('settings.last_name')}</label>
            <input
              className="form-input"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">{t('settings.email')}</label>
          <input
            className="form-input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{t('settings.save_success')}</p>}
        <button
          type="submit"
          className="cta-button"
          disabled={isSaving}
        >
          {isSaving ? t('settings.saving') : t('settings.save')}
        </button>
      </form>
    </div>
  )
}

// ── Change Password ────────────────────────────────────────────────────────

function PasswordSection({ token }: { token: string }): JSX.Element {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError(t('settings.password_mismatch'))
      return
    }
    setIsSaving(true)
    setSuccess(false)
    setError(null)
    try {
      await changePassword(token, currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg.includes('401') ? t('settings.error_401') : t('settings.error_generic'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="settings-card">
      <h2 className="settings-section-title">{t('settings.password_title')}</h2>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="form-field">
          <label className="form-label">{t('settings.current_password')}</label>
          <input
            className="form-input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t('settings.new_password')}</label>
          <input
            className="form-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t('settings.confirm_password')}</label>
          <input
            className="form-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{t('settings.password_success')}</p>}
        <button
          type="submit"
          className="cta-button"
          disabled={isSaving}
        >
          {isSaving ? t('settings.changing_password') : t('settings.change_password')}
        </button>
      </form>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat(SM-6ih): add SettingsPage with personal info + password change"
```

---

## Task 4: CSS for Settings layout

**Files:**
- Modify: `src/App.css`

**Step 1: Add settings styles** at end of App.css:

```css
/* Settings Page */
.settings-container {
  max-width: 640px;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-title {
  font-size: 1.75rem;
  font-weight: bold;
  margin: 0;
}

.settings-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #18203a;
}

.settings-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 480px) {
  .settings-row {
    grid-template-columns: 1fr;
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat(SM-6ih): add settings page CSS"
```

---

## Task 5: Wire route + nav

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppShell.tsx`

**Step 1: Add route in App.tsx**

Add import:
```typescript
import { SettingsPage } from './pages/SettingsPage'
```

Add route inside the `<Route element={<ProtectedRoute />}>` block:
```tsx
<Route path="/settings" element={<SettingsPage />} />
```

**Step 2: Add nav link in AppShell.tsx**

Add after the `/profile` link:
```tsx
<Link to="/settings" className="shell-nav-link">{t('nav.settings')}</Link>
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/App.tsx src/components/AppShell.tsx
git commit -m "feat(SM-6ih): register /settings route and add nav link"
```

---

## Task 6: Build and deploy

**Step 1: Final TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 2: Docker build**

```bash
docker build -t ghcr.io/share-community/sharemember-app:latest \
  -f /home/tomblume/IdeaProjects/u2g-infrastructure-ts/services/sharemember-app/Dockerfile .
```

Expected: `naming to ghcr.io/share-community/sharemember-app:latest done`

**Step 3: Transfer and deploy**

```bash
docker save ghcr.io/share-community/sharemember-app:latest \
  | ssh -i ~/.ssh/scaleway_ed25519 root@51.15.211.196 docker load

ssh -i ~/.ssh/scaleway_ed25519 root@51.15.211.196 \
  "cd /opt/share-platform/infra && \
   docker compose -f docker-compose.prod.yml -p share-prod --env-file .env.prod \
   up -d sharemember-app-prod && \
   docker restart coolify-proxy"
```

**Step 4: Smoke test**

```bash
curl -s -o /dev/null -w "%{http_code}" https://share.community
```

Expected: `200`

Then manually: navigate to `https://share.community`, log in, click Settings. Verify:
- Personal info form pre-fills with name/email from KC
- Saving updates reflected after page reload
- Password change form works (try wrong current password → error shown)

**If GET /account returns 401:** The `prod-sharemember-app` KC client needs `account` added as audience.
Fix in Keycloak Admin:
1. Clients → prod-sharemember-app → Client Scopes → Add `account` to default scopes
   OR
2. Client Scopes → Create mapper: Audience mapper with `account` as included audience

**Step 5: Close beads issue**

```bash
bd close SM-6ih
bd sync
```

---

## Verification Checklist

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] Settings page loads at `/settings`
- [ ] Personal info pre-fills from Keycloak
- [ ] Name/email update saves and persists
- [ ] Wrong current password → clear German/English error
- [ ] Mismatched new passwords → inline error before API call
- [ ] Password change → success message, form resets
- [ ] Nav shows "Settings" / "Einstellungen" depending on language
- [ ] Mobile: settings-row collapses to single column
