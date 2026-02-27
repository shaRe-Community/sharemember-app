# shaRe Member App

The identity and social profile application for shaRe platform members.

A shaRe Member is a **verified, unfakeable identity** — cryptographically bound to a
real person via the German eAusweis (eID). This app is where you manage that identity.

## Status

Current state: **Landing page + Keycloak registration flow (PoC)**
Next: Profile page, eID verification flow, community overview

## Tech Stack

- React 18 + TypeScript (strict)
- Vite 7
- Keycloak OIDC for auth

## Development

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build      # production build → dist/
npm run build:dev  # development build → dist/
```

## Environment Variables

| Variable | Dev | Prod |
|---|---|---|
| `VITE_SSO_URL` | `https://sso.dev.sharemembers.net` | `https://sso.sharemembers.net` |
| `VITE_PUBLIC_URL` | `https://dev.share.community` | `https://share.community` |
| `VITE_KEYCLOAK_REALM` | `dev-sharemembers` | `prod-sharemembers` |
| `VITE_API_URL` | `https://api.dev.sharemembers.net` | `https://api.sharemembers.net` |

## Architecture

This app is part of the shaRe platform but operates independently:

```
sharemember-app (this repo)     ← identity, eID verification, social profile
share-ui                        ← community governance (roundtables, documents)
sharemembers                    ← Keycloak customisation, SPIs, auth themes
operator-ts                     ← shared NestJS backend for both apps
```

## Related

- [share-ui](https://github.com/shaRe-Community/share-ui) — community governance frontend
- [operator-ts](https://github.com/shaRe-Community/operator-ts) — backend API
- [sharemembers](https://github.com/shaRe-Community/sharemembers) — Keycloak customisation
- [share-platform](https://github.com/shaRe-Community/share-platform) — platform specs & issues
