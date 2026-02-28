import { UserManager, UserManagerSettings } from 'oidc-client-ts'

function buildSettings(): UserManagerSettings {
  const ssoUrl = import.meta.env.VITE_SSO_URL
  const realm = import.meta.env.VITE_KEYCLOAK_REALM
  const publicUrl = import.meta.env.VITE_PUBLIC_URL
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID

  return {
    authority: `${ssoUrl}/realms/${realm}`,
    client_id: clientId,
    redirect_uri: `${publicUrl}/callback`,
    post_logout_redirect_uri: `${publicUrl}/`,
    response_type: 'code',
    scope: 'openid profile email',
    automaticSilentRenew: true,
    filterProtocolClaims: false,
  }
}

export const userManager = new UserManager(buildSettings())
