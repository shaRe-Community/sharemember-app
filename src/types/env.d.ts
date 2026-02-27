/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_API_URL: string
  readonly VITE_SSO_URL: string
  readonly VITE_PUBLIC_URL: string
  readonly VITE_KEYCLOAK_REALM: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
