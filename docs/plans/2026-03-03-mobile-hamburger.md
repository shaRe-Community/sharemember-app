# Mobile Hamburger Menu — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a hamburger dropdown to the sharemember-app header so the navigation is usable on mobile phones.

**Architecture:** Single-file React change in `AppShell.tsx` — add `menuOpen` state, restructure JSX so desktop nav and mobile controls are separate, render a full-width dropdown when the hamburger is open. CSS handles the responsive show/hide via a `max-width: 640px` media query. Click-outside closes the menu via a `useEffect` + `mousedown` listener.

**Tech Stack:** React, TypeScript, react-router-dom, react-i18next, CSS (no new dependencies)

---

### Task 1: CSS — mobile classes

**Files:**
- Modify: `src/App.css` (append after the existing `/* Header Styles */` block, around line 65)

**Context:** The existing `.header-nav` is a flex row that overflows on small screens. We need to hide it on mobile and show new `.header-mobile-controls` instead. The dropdown `.mobile-menu` appears below the header.

**Step 1: Find the insertion point**

Open `src/App.css` and locate the line:
```css
.nav-btn:disabled {
```
This is around line 63. All new CSS goes **before** this line, appended to the header styles block.

**Step 2: Add the CSS**

Insert after the `.nav-btn-secondary:hover:not(:disabled)` block (around line 61):

```css
/* ── Mobile hamburger ──────────────────────────────── */
.header-mobile-controls {
  display: none;
  align-items: center;
  gap: 0.75rem;
}

.hamburger-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.25rem 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-menu {
  background: #031633;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  width: 100%;
}

.mobile-menu-item {
  padding: 0.875rem 1.5rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 1rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.mobile-menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.mobile-menu-item-primary {
  color: #ff3b2f;
}

@media (max-width: 640px) {
  .header-nav {
    display: none;
  }
  .header-mobile-controls {
    display: flex;
  }
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
git commit -m "feat(mobile-nav): add hamburger menu CSS classes"
```

---

### Task 2: AppShell.tsx — hamburger logic and JSX

**Files:**
- Modify: `src/components/AppShell.tsx`

**Context:** Current file is 83 lines. We need to:
1. Add `useState`, `useEffect`, `useRef` imports
2. Add `menuOpen` state and a `menuRef` ref
3. Add click-outside `useEffect`
4. Add `closeMenu` helper (navigates + closes)
5. Add `.header-mobile-controls` div (LanguageSwitcher + Avatar + hamburger button)
6. Conditionally render `.mobile-menu` dropdown inside `<header>`

**Step 1: Update the import line**

Change line 1 from:
```typescript
import { ReactNode } from 'react'
```
to:
```typescript
import { ReactNode, useState, useEffect, useRef } from 'react'
```

**Step 2: Add state and ref** after the existing `const isIdentified` line (after line 20):

```typescript
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
```

**Step 3: Add click-outside effect** after the `menuRef` declaration:

```typescript
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])
```

**Step 4: Add closeMenu helper** after the `useEffect`:

```typescript
  const closeMenu = (path: string) => {
    setMenuOpen(false)
    navigate(path)
  }
```

**Step 5: Restructure the JSX**

Replace the entire `return` block with:

```tsx
  return (
    <>
      <header className="header" ref={menuRef}>
        <div className="header-content">
          <Link to="/hub" className="shell-logo">
            sha<span className="red">R</span>e
          </Link>

          {/* Desktop nav — hidden on mobile via CSS */}
          <nav className="header-nav">
            <Link to="/hub" className="shell-nav-link">
              {t('nav.communities')}
            </Link>
            <Link to="/settings" className="shell-nav-link">
              {t('nav.settings')}
            </Link>
            {user?.eidStatus === 'un_identified' && (
              <button
                className="nav-btn nav-btn-primary"
                onClick={() => navigate('/verify')}
              >
                {t('nav.verify_identity')}
              </button>
            )}
            <button className="nav-btn nav-btn-secondary" onClick={handleLogout}>
              {t('nav.sign_out')}
            </button>
            <LanguageSwitcher />
            <Link to="/profile" className="nav-avatar-link">
              <div className={`nav-avatar-wrapper${isIdentified ? '' : ' avatar-unidentified'}`}>
                <div className="nav-avatar">
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="avatar-img" />
                  ) : (
                    initials
                  )}
                </div>
                <span className={`avatar-badge${isIdentified ? ' avatar-badge-shield' : ' avatar-badge-question'}`}>
                  {isIdentified ? '✓' : '?'}
                </span>
              </div>
            </Link>
          </nav>

          {/* Mobile controls — shown only on mobile via CSS */}
          <div className="header-mobile-controls">
            <LanguageSwitcher />
            <Link to="/profile" className="nav-avatar-link">
              <div className={`nav-avatar-wrapper${isIdentified ? '' : ' avatar-unidentified'}`}>
                <div className="nav-avatar">
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="avatar-img" />
                  ) : (
                    initials
                  )}
                </div>
                <span className={`avatar-badge${isIdentified ? ' avatar-badge-shield' : ' avatar-badge-question'}`}>
                  {isIdentified ? '✓' : '?'}
                </span>
              </div>
            </Link>
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className="mobile-menu">
            <Link
              to="/hub"
              className="mobile-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.communities')}
            </Link>
            <Link
              to="/settings"
              className="mobile-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.settings')}
            </Link>
            {user?.eidStatus === 'un_identified' && (
              <button
                className="mobile-menu-item mobile-menu-item-primary"
                onClick={() => closeMenu('/verify')}
              >
                {t('nav.verify_identity')}
              </button>
            )}
            <button
              className="mobile-menu-item"
              onClick={() => { setMenuOpen(false); handleLogout() }}
            >
              {t('nav.sign_out')}
            </button>
          </nav>
        )}
      </header>
      <main className="shell-main">{children}</main>
    </>
  )
```

Note: `ref={menuRef}` is now on `<header>` so click-outside detection covers both the header bar and the dropdown (which is inside `<header>`).

**Step 6: Verify TypeScript + build**

```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npx tsc --noEmit 2>&1 | head -10 && npm run build 2>&1 | tail -3
```
Expected: no TypeScript errors, `✓ built in ...`

**Step 7: Commit**

```bash
git add src/components/AppShell.tsx
git commit -m "feat(mobile-nav): add hamburger dropdown for mobile header"
```

---

### Task 3: Deploy to prod

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
