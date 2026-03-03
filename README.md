# shaRe Member App

The identity portal for shaRe platform members — live in production at **https://share.community**
(also accessible via https://id.wurzelwerk.up2go.com).

A ShareMember is a **permanent real-world identity** — one per person, shared across all shaRe
communities. You log in here once and get SSO access to every community you belong to via Keycloak.

## Status

Production-ready MVP, deployed on Scaleway/Traefik (migrated from GCP).

## Tech Stack

- React 18 + TypeScript (strict)
- Vite 7
- react-oidc-context — OIDC auth (Keycloak)
- react-router-dom — client-side routing
- Keycloak realm: `prod-sharemembers` at `sso.wurzelwerk.up2go.com`, client: `prod-sharemember-app`

## Routes

| Path        | Component            | Auth      |
| ----------- | -------------------- | --------- |
| `/`         | LandingPage          | Public    |
| `/callback` | OIDC callback        | Public    |
| `/hub`      | Community hub        | Protected |
| `/join`     | Join via invite code | Protected |
| `/profile`  | Profile page         | Protected |
| `/verify`   | eID verification     | Protected |

Protected routes are wrapped in an `AppShell` that provides persistent navigation.

## Architecture

```
ShareMember (this app)          ← one identity per real person, cross-community
    │
    ├── Keycloak SSO ───────────→ shaRe communities (share-ui, etc.)
    │
    └── operator-ts /eid/  ─────→ eID verification flow (/verify page)
```

### Identity model

- **ShareMember** — permanent real-world identity (1 per person, across all communities)
- **IDENTIFIED** — eID-verified (or future: peer-vouched). Full participation rights.
- **UN-IDENTIFIED** — no identity guarantee. Participation may be restricted in some communities.

The `/verify` page triggers the eID flow via the `operator-ts` `/eid/` module.

## Environment Variables

| Variable                  | Description              | Example                            |
| ------------------------- | ------------------------ | ---------------------------------- |
| `VITE_APP_NAME`           | Display name for the app | `shaRe Member`                     |
| `VITE_API_URL`            | operator-ts base URL     | `https://wurzelwerk.up2go.com/api` |
| `VITE_SSO_URL`            | Keycloak base URL        | `https://sso.wurzelwerk.up2go.com` |
| `VITE_PUBLIC_URL`         | Public URL of this app   | `https://share.community`          |
| `VITE_KEYCLOAK_REALM`     | Keycloak realm name      | `prod-sharemembers`                |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID       | `prod-sharemember-app`             |

## Development

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build      # production build → dist/
```

## CSS

Both `App.css` and `index.css` are imported in `main.tsx`.

## Related Projects

| Repo                                                                | Purpose                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| [share-ui](https://github.com/shaRe-Community/share-ui)             | Community governance frontend (roundtables, documents) |
| [operator-ts](https://github.com/shaRe-Community/operator-ts)       | Shared NestJS backend API                              |
| [sharemembers](https://github.com/shaRe-Community/sharemembers)     | Keycloak customisation, SPIs, auth themes              |
| [share-platform](https://github.com/shaRe-Community/share-platform) | Platform specs, ADRs, cross-cutting issues             |
