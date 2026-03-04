# Delete Profile Picture — Design

**Date**: 2026-03-03
**Status**: Approved

## Overview

Add a trash icon to the profile picture settings that lets the user immediately delete (clear) their current profile picture. No confirmation dialog — click trash = immediate save. Avatar reverts to initials.

## Security

The API is bearer-token authenticated. `BearerTokenAuthenticator.authenticate()` resolves the calling user from the token — operations always act on the authenticated user's own data only. No admin rights, no user ID in the URL.

## Behaviour

```
[Current picture]  ←  shows when user has a picture and no new image is staged
     ↓ click 🗑
  DELETE /realms/{realm}/profile_pictures   (authenticated, no body)
     ↓ 204 success
  currentPicture clears → refreshUser() → header avatar reverts to initials
```

## Architecture

### 1 — KC Plugin (sharemembers repo)

**File:** `plugins/src/main/kotlin/com/up2go/sharemembers/profile/ProfilePictureUpload.kt`

Add `@DELETE` to `ProfilePictureProvider`:

```kotlin
import jakarta.ws.rs.DELETE

@DELETE
fun deleteProfilePicture(@HeaderParam("Origin") origin: String?): Response {
    val authResult = AppAuthManager.BearerTokenAuthenticator(session).authenticate()
        ?: return corsBuilder(
            Response.status(Response.Status.UNAUTHORIZED).entity("Unauthorized").type(MediaType.TEXT_PLAIN),
            origin,
        ).build()
    val user = authResult.user
    Storage.deleteProfilePicture(user.id)
    user.removeAttribute("picture")
    return corsBuilder(Response.noContent(), origin).build()
}
```

Update `corsBuilder` CORS headers:

```kotlin
.header("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS")
```

Update `@OPTIONS` preflight to include DELETE.

`Storage.deleteProfilePicture()` already exists — no changes needed there.

### 2 — API Client (sharemember-app)

**File:** `src/api/keycloak-account.ts`

Add:

```typescript
export async function deleteProfilePicture(token: string, ssoUrl: string, realm: string): Promise<void> {
  const res = await fetch(`${ssoUrl}/realms/${realm}/profile_pictures`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`)
}
```

### 3 — ProfilePictureEditor

**File:** `src/components/ProfilePictureEditor.tsx`

Add `onDelete` prop:

```typescript
interface ProfilePictureEditorProps {
  currentPicture: string | null
  onUpload: (blob: Blob) => Promise<void>
  onDelete: () => Promise<void>     // NEW
  isUploading: boolean
}
```

In the `avatar-current` block (where the current picture is shown), add a trash button:

```tsx
{currentPicture && !imageState && (
  <div className="avatar-current">
    <div className="avatar-current-preview">
      <img src={currentPicture} alt={t('settings.picture_current')} className="avatar-current-img" />
      <button
        type="button"
        className="avatar-delete-btn"
        onClick={() => void onDelete()}
        aria-label={t('settings.picture_delete')}
        title={t('settings.picture_delete')}
      >
        🗑
      </button>
    </div>
    <span className="avatar-current-label">{t('settings.picture_current')}</span>
  </div>
)}
```

### 4 — SettingsPage

**File:** `src/pages/SettingsPage.tsx`

In `ProfilePictureSection`, add `handleDeletePicture`:

```typescript
const handleDeletePicture = async () => {
  const token = user?.access_token
  if (!token) return
  await deleteProfilePicture(token, ssoUrl, realm)
  setCurrentPicture(null)
  await refreshUser()
}
```

Pass to editor: `<ProfilePictureEditor ... onDelete={handleDeletePicture} />`

### 5 — CSS

**File:** `src/App.css`

```css
.avatar-current-preview {
  position: relative;
  display: inline-block;
}

.avatar-delete-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff3b2f;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 0;
}
```

### 6 — i18n

No new keys needed beyond `settings.picture_delete`:

- EN: `"Delete profile picture"`
- DE: `"Profilbild löschen"`

## Repos Affected

| Repo | Change |
|------|--------|
| `sharemembers` | Add `@DELETE` to `ProfilePictureProvider`, update CORS Allow-Methods |
| `sharemember-app` | API client, component prop, SettingsPage handler, CSS, i18n |
