# Delete Profile Picture — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a trash button to the profile picture settings that immediately deletes the user's current profile picture (MinIO + KC attribute cleared) with no confirmation dialog.

**Architecture:** Two repos. Keycloak plugin (`sharemembers`) gets a new `@DELETE` handler in `ProfilePictureProvider` — same bearer-token auth pattern as `@POST`, calls existing `Storage.deleteProfilePicture()` and clears the `picture` attribute. Frontend (`sharemember-app`) adds `deleteProfilePicture()` to the API client, a `onDelete` prop to `ProfilePictureEditor`, a CSS-positioned trash button overlaid on the current-picture preview, and a `handleDeletePicture` handler in `SettingsPage` that clears local state + calls `refreshUser()`.

**Tech Stack:** Kotlin/JAX-RS (KC plugin), React + TypeScript, fetch API, CSS position:absolute overlay

---

### Task 1: KC Plugin — add @DELETE to ProfilePictureProvider

**Repo:** `/home/tomblume/IdeaProjects/sharemembers`

**Files:**
- Modify: `plugins/src/main/kotlin/com/up2go/sharemembers/profile/ProfilePictureUpload.kt`

**Context:** `ProfilePictureProvider` currently has only `@OPTIONS` and `@POST`. `Storage.deleteProfilePicture(userId)` already exists and handles MinIO removal. The `corsBuilder` helper sets `"POST, OPTIONS"` — needs to include `DELETE`.

**Step 1: Add `@DELETE` import and handler**

Open the file. After the existing `import jakarta.ws.rs.POST` line, add:
```kotlin
import jakarta.ws.rs.DELETE
```

After the closing `}` of the `uploadProfilePicture` function (around line 59), insert:

```kotlin
    @DELETE
    fun deleteProfilePicture(
        @HeaderParam("Origin") origin: String?,
    ): Response {
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

**Step 2: Update CORS to allow DELETE**

In `corsBuilder`, change line:
```kotlin
.header("Access-Control-Allow-Methods", "POST, OPTIONS")
```
to:
```kotlin
.header("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS")
```

**Step 3: Verify build**

```bash
cd /home/tomblume/IdeaProjects/sharemembers
./gradlew :plugins:build 2>&1 | tail -5
```
Expected: `BUILD SUCCESSFUL`

**Step 4: Commit**

```bash
cd /home/tomblume/IdeaProjects/sharemembers
git add plugins/src/main/kotlin/com/up2go/sharemembers/profile/ProfilePictureUpload.kt
git commit -m "feat(profile): add DELETE /profile_pictures endpoint"
```

---

### Task 2: Build + deploy Keycloak

**Repo:** `/home/tomblume/IdeaProjects/sharemembers`

**Step 1: Build Docker image**

```bash
cd /home/tomblume/IdeaProjects/sharemembers
docker build -t ghcr.io/share-community/sharemembers:latest .
```
Expected: `Successfully tagged ghcr.io/share-community/sharemembers:latest`

**Step 2: Transfer to prod**

```bash
docker save ghcr.io/share-community/sharemembers:latest | \
  ssh -i ~/.ssh/scaleway_ed25519 root@51.15.211.196 docker load
```

**Step 3: Restart Keycloak**

```bash
ssh -i ~/.ssh/scaleway_ed25519 root@51.15.211.196 \
  "cd /opt/share-platform/infra && \
   docker compose -f docker-compose.prod.yml -p share-prod --env-file .env.prod \
   up -d keycloak-prod && docker restart coolify-proxy"
```

**Step 4: Wait for Keycloak to be healthy** (it takes ~4 minutes)

```bash
ssh -i ~/.ssh/scaleway_ed25519 root@51.15.211.196 \
  "docker logs share-prod-keycloak-prod-1 --tail 5 2>&1"
```
Wait until logs show `started in` (Keycloak startup complete).

**Step 5: Verify DELETE endpoint exists**

```bash
curl -sI -X DELETE https://sso.wurzelwerk.up2go.com/realms/prod-sharemembers/profile_pictures \
  -H "Authorization: Bearer invalid" | head -2
```
Expected: `HTTP/2 401` (not 404 — the endpoint exists, just rejected the invalid token)

**Step 6: Push sharemembers**

```bash
cd /home/tomblume/IdeaProjects/sharemembers && git push
```

---

### Task 3: API client — add deleteProfilePicture()

**Repo:** `/home/tomblume/IdeaProjects/sharemember-app`

**Files:**
- Modify: `src/api/keycloak-account.ts`

**Context:** The file uses module-level `SSO_URL` and `REALM` constants. The profile picture endpoint is at `/realms/${REALM}/profile_pictures` — NOT under `/account/` — so we can't use the existing `kcFetch` helper. Add a standalone function using `fetch` directly, same as `handleUpload` in SettingsPage does.

**Step 1: Add the function**

Append after `changePassword` (line 75), before the end of the file:

```typescript
export async function deleteProfilePicture(token: string): Promise<void> {
  const res = await fetch(
    `${SSO_URL}/realms/${REALM}/profile_pictures`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  if (!res.ok && res.status !== 204) {
    throw new ApiError(res.status, `Delete profile picture failed: ${res.status}`)
  }
}
```

**Step 2: Verify TypeScript**

```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npx tsc --noEmit 2>&1 | head -10
```
Expected: no output (no errors)

**Step 3: Commit**

```bash
git add src/api/keycloak-account.ts
git commit -m "feat(profile): add deleteProfilePicture API client function"
```

---

### Task 4: CSS — avatar-current-preview + avatar-delete-btn

**Files:**
- Modify: `src/App.css`

**Context:** The `.avatar-current` div currently contains `img.avatar-current-img` and `span.avatar-current-label`. We wrap the img in a new `.avatar-current-preview` positioned container so the trash button can sit in the top-right corner as an absolute overlay.

**Step 1: Find insertion point**

Search for `.avatar-current-img` in `src/App.css`. Insert the new rules directly after the `.avatar-current-img` block.

**Step 2: Add CSS**

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
  width: 26px;
  height: 26px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 0;
  line-height: 1;
}

.avatar-delete-btn:hover {
  background: #e0342a;
}
```

**Step 3: Verify build**

```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npm run build 2>&1 | tail -3
```
Expected: `✓ built in ...`

**Step 4: Commit**

```bash
git add src/App.css
git commit -m "feat(profile): add avatar delete button CSS"
```

---

### Task 5: ProfilePictureEditor — onDelete prop + trash button

**Files:**
- Modify: `src/components/ProfilePictureEditor.tsx`

**Context:** The component currently has `currentPicture`, `onUpload`, `isUploading` props. The current picture preview is in the `avatar-editor-controls` block, lines ~279-291. We add `onDelete` to the interface and wrap the `<img>` in a `.avatar-current-preview` div with a trash button.

**Step 1: Add onDelete to the props interface**

Change (around line 5):
```typescript
interface ProfilePictureEditorProps {
  currentPicture: string | null
  onUpload: (blob: Blob) => Promise<void>
  isUploading: boolean
}
```
to:
```typescript
interface ProfilePictureEditorProps {
  currentPicture: string | null
  onUpload: (blob: Blob) => Promise<void>
  onDelete: () => Promise<void>
  isUploading: boolean
}
```

**Step 2: Destructure onDelete in the function signature**

Change (around line 20):
```typescript
export function ProfilePictureEditor({
  currentPicture,
  onUpload,
  isUploading,
}: ProfilePictureEditorProps): JSX.Element {
```
to:
```typescript
export function ProfilePictureEditor({
  currentPicture,
  onUpload,
  onDelete,
  isUploading,
}: ProfilePictureEditorProps): JSX.Element {
```

**Step 3: Wrap img in preview container + add trash button**

Find and replace the existing `avatar-current` block (around lines 279-291):

Replace:
```tsx
        {currentPicture && !imageState && (
          <div className="avatar-current">
            {/* Fix 7: meaningful alt text instead of empty string */}
            <img
              src={currentPicture}
              alt={t('settings.picture_current')}
              className="avatar-current-img"
            />
            <span className="avatar-current-label">
              {t('settings.picture_current')}
            </span>
          </div>
        )}
```

With:
```tsx
        {currentPicture && !imageState && (
          <div className="avatar-current">
            <div className="avatar-current-preview">
              <img
                src={currentPicture}
                alt={t('settings.picture_current')}
                className="avatar-current-img"
              />
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
            <span className="avatar-current-label">
              {t('settings.picture_current')}
            </span>
          </div>
        )}
```

**Step 4: Verify TypeScript + build**

```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npx tsc --noEmit 2>&1 | head -10 && npm run build 2>&1 | tail -3
```
Expected: no TS errors, `✓ built in ...`

(Note: build will error at SettingsPage because `onDelete` is now required but not yet passed — this is expected and will be fixed in Task 6.)

**Step 5: Commit**

```bash
git add src/components/ProfilePictureEditor.tsx
git commit -m "feat(profile): add onDelete prop + trash button to ProfilePictureEditor"
```

---

### Task 6: SettingsPage — handleDeletePicture + wire to editor

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

**Context:** `ProfilePictureSection` is at lines 128-202. It already has `token`, `ssoUrl`, `realm`, `localPreviewUrl`, `setLocalPreviewUrl`, and `refreshUser`. We add `handleDeletePicture` and import `deleteProfilePicture` from the API client.

**Step 1: Add deleteProfilePicture to the import**

Change line 5-10 from:
```typescript
import {
  getAccountInfo,
  updateAccountInfo,
  changePassword,
  type KcUserInfo,
} from '../api/keycloak-account'
```
to:
```typescript
import {
  getAccountInfo,
  updateAccountInfo,
  changePassword,
  deleteProfilePicture,
  type KcUserInfo,
} from '../api/keycloak-account'
```

**Step 2: Add handleDeletePicture in ProfilePictureSection**

After `handleUpload` (after the closing `}` of `handleUpload`, around line 180), add:

```typescript
  const handleDeletePicture = async (): Promise<void> => {
    setError(null)
    try {
      await deleteProfilePicture(token)
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current)
        localPreviewRef.current = null
      }
      setLocalPreviewUrl(null)
      await refreshUser()
    } catch {
      setError(t('settings.picture_error'))
    }
  }
```

**Step 3: Pass onDelete to ProfilePictureEditor**

Change lines 185-189 from:
```tsx
      <ProfilePictureEditor
        currentPicture={localPreviewUrl}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
```
to:
```tsx
      <ProfilePictureEditor
        currentPicture={localPreviewUrl}
        onUpload={handleUpload}
        onDelete={handleDeletePicture}
        isUploading={isUploading}
      />
```

**Step 4: Verify TypeScript + build**

```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npx tsc --noEmit 2>&1 | head -10 && npm run build 2>&1 | tail -3
```
Expected: no TS errors, `✓ built in ...`

**Step 5: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat(profile): wire handleDeletePicture in SettingsPage"
```

---

### Task 7: i18n — add settings.picture_delete

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/de.json`

**Context:** The existing `settings.*` keys are grouped together in both files. Add `picture_delete` near the other `picture_*` keys.

**Step 1: Add to en.json**

Find `"picture_success"` (or any nearby `picture_*` key) and add after it:
```json
"picture_delete": "Delete profile picture",
```

**Step 2: Add to de.json**

Same location:
```json
"picture_delete": "Profilbild löschen",
```

**Step 3: Final build verify**

```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npx tsc --noEmit 2>&1 | head -10 && npm run build 2>&1 | tail -3
```
Expected: no TS errors, `✓ built in ...`

**Step 4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/de.json
git commit -m "feat(profile): add picture_delete i18n key (EN + DE)"
```

---

### Task 8: Deploy sharemember-app to prod

**Step 1: Build Docker image**

```bash
cd /home/tomblume/IdeaProjects/sharemember-app
docker build -t ghcr.io/share-community/sharemember-app:latest \
  -f /home/tomblume/IdeaProjects/u2g-infrastructure-ts/services/sharemember-app/Dockerfile .
```
Expected: `Successfully tagged ghcr.io/share-community/sharemember-app:latest`

**Step 2: Transfer to prod**

```bash
docker save ghcr.io/share-community/sharemember-app:latest | \
  ssh -i ~/.ssh/scaleway_ed25519 root@51.15.211.196 docker load
```

**Step 3: Restart on prod**

```bash
ssh -i ~/.ssh/scaleway_ed25519 root@51.15.211.196 \
  "cd /opt/share-platform/infra && \
   docker compose -f docker-compose.prod.yml -p share-prod --env-file .env.prod \
   up -d sharemember-app-prod && docker restart coolify-proxy"
```

**Step 4: Verify**

```bash
curl -sI https://id.wurzelwerk.up2go.com | head -2
```
Expected: `HTTP/2 200`

**Step 5: Push + sync**

```bash
cd /home/tomblume/IdeaProjects/sharemember-app && git push && bd sync
```
