import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userManager } from '../auth/auth.config'

/**
 * Handles the OIDC redirect callback from Keycloak.
 * Exchanges the authorization code for tokens, then redirects to /hub.
 */
export function CallbackPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    userManager
      .signinRedirectCallback()
      .then(() => navigate('/hub', { replace: true }))
      .catch(() => navigate('/', { replace: true }))
  }, [navigate])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>{t('callback.signing_in')}</p>
    </div>
  )
}
