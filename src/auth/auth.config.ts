import { UserManager, UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts'

const ssoUrl = import.meta.env.VITE_SSO_URL
const realm = import.meta.env.VITE_KEYCLOAK_REALM
const publicUrl = import.meta.env.VITE_PUBLIC_URL
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID

export const REMEMBER_ME_KEY = 'share_remember_me'

function buildSettings(authorizationEndpoint?: string): UserManagerSettings {
  const base = `${ssoUrl}/realms/${realm}`
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === '1'
  return {
    authority: base,
    client_id: clientId,
    redirect_uri: `${publicUrl}/callback`,
    post_logout_redirect_uri: `${publicUrl}/`,
    response_type: 'code',
    scope: 'openid profile email',
    automaticSilentRenew: true,
    filterProtocolClaims: false,
    userStore: new WebStorageStateStore({ store: rememberMe ? localStorage : sessionStorage }),
    ...(authorizationEndpoint
      ? {
          metadata: {
            issuer: base,
            authorization_endpoint: authorizationEndpoint,
            token_endpoint: `${base}/protocol/openid-connect/token`,
            end_session_endpoint: `${base}/protocol/openid-connect/logout`,
            jwks_uri: `${base}/protocol/openid-connect/certs`,
            userinfo_endpoint: `${base}/protocol/openid-connect/userinfo`,
          },
        }
      : {}),
  }
}

export const userManager = new UserManager(buildSettings())

// Registration uses the same PKCE flow but targets the /registrations endpoint
export const registerUserManager = new UserManager(
  buildSettings(`${ssoUrl}/realms/${realm}/protocol/openid-connect/registrations`),
)
