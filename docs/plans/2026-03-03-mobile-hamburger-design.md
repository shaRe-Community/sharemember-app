# Mobile Hamburger Menu — Design

**Date**: 2026-03-03
**Status**: Approved

## Overview

The desktop header nav (`header-nav`) is unusable on narrow mobile screens because all items (links, buttons, LanguageSwitcher, Avatar) are crammed into a single flex row. Add a responsive hamburger dropdown so mobile users can navigate comfortably.

## Behaviour

**Desktop** (> 640px) — unchanged:
```
shaRe   [Communities] [Settings] [Verify Identity] [Sign Out] [DE/EN] [Avatar]
```

**Mobile** (≤ 640px):
```
shaRe                                              [DE/EN] [Avatar] [☰]
```

Hamburger tapped → full-width dropdown directly below the header:
```
┌──────────────────────────────────────┐
│  Communities                         │
│  Settings                            │
│  Verify Identity   (only if needed)  │
│  Sign Out                            │
└──────────────────────────────────────┘
```

- `☰` toggles to `✕` while open
- Tapping any menu item → navigates + closes menu
- Tapping outside the dropdown → closes menu
- No backdrop blur — hard-edged, consistent with existing dark theme

## Architecture

Single file change: `src/components/AppShell.tsx`
CSS additions: `src/App.css`

### State

```typescript
const [menuOpen, setMenuOpen] = useState(false)
```

### JSX Structure

```
<header>
  <div className="header-content">
    <Link shell-logo>shaRe</Link>

    {/* Desktop nav — hidden on mobile via CSS */}
    <nav className="header-nav">
      [Communities] [Settings] [Verify] [Sign Out] [LanguageSwitcher] [Avatar]
    </nav>

    {/* Mobile controls — visible only on mobile */}
    <div className="header-mobile-controls">
      <LanguageSwitcher />
      <Link to="/profile" nav-avatar />
      <button className="hamburger-btn" onClick={() => setMenuOpen(o => !o)}>
        {menuOpen ? '✕' : '☰'}
      </button>
    </div>
  </div>

  {/* Mobile dropdown — below header-content */}
  {menuOpen && (
    <nav className="mobile-menu">
      [Communities] [Settings] [Verify] [Sign Out]
    </nav>
  )}
</header>
```

Click-outside closes menu via `useEffect` + `mousedown` listener on `document`.

## CSS

```
@media (max-width: 640px) {
  .header-nav           { display: none }
  .header-mobile-controls { display: flex }
}

.header-mobile-controls { display: none; align-items: center; gap: 0.75rem }

.hamburger-btn { background: transparent; color: white; border: none; font-size: 1.4rem; cursor: pointer }

.mobile-menu {
  background: #031633;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex; flex-direction: column;
  padding: 0.5rem 0;
}
.mobile-menu-item {
  padding: 0.875rem 1.5rem;
  color: white; text-decoration: none; font-size: 1rem;
  border: none; background: transparent; text-align: left; cursor: pointer; width: 100%;
}
.mobile-menu-item:hover { background: rgba(255,255,255,0.05) }
```

## i18n

No new keys needed — all items reuse existing `nav.*` keys.
