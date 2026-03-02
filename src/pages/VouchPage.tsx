import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { ApiError } from '../api/api'
import {
  confirmVouch,
  declineVouch,
  fetchVouchRequest,
  type VouchRequest,
} from '../api/vouch'

type PageState =
  | { kind: 'loading' }
  | { kind: 'not_found' }
  | { kind: 'already_processed' }
  | { kind: 'not_identified' }
  | { kind: 'self_vouch' }
  | { kind: 'error' }
  | { kind: 'active'; request: VouchRequest }
  | { kind: 'confirmed'; name: string }
  | { kind: 'declined' }

export function VouchPage(): JSX.Element {
  const { requestId } = useParams<{ requestId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [state, setState] = useState<PageState>({ kind: 'loading' })
  const [isActing, setIsActing] = useState(false)

  useEffect(() => {
    if (!user || !requestId) return
    fetchVouchRequest(requestId, user.accessToken)
      .then((req) => setState({ kind: 'active', request: req }))
      .catch((err) => {
        if (err instanceof ApiError) {
          if (err.status === 404) setState({ kind: 'not_found' })
          else if (err.status === 409) setState({ kind: 'already_processed' })
          else if (err.status === 403) setState({ kind: 'not_identified' })
          else if (err.status === 400) setState({ kind: 'self_vouch' })
          else setState({ kind: 'error' })
        } else {
          setState({ kind: 'error' })
        }
      })
  }, [user, requestId])

  const handleConfirm = async (): Promise<void> => {
    if (!user || !requestId || state.kind !== 'active') return
    setIsActing(true)
    try {
      await confirmVouch(requestId, user.accessToken)
      setState({ kind: 'confirmed', name: state.request.requestee.name })
    } catch {
      setIsActing(false)
    }
  }

  const handleDecline = async (): Promise<void> => {
    if (!user || !requestId || state.kind !== 'active') return
    setIsActing(true)
    try {
      await declineVouch(requestId, user.accessToken)
      setState({ kind: 'declined' })
    } catch {
      setIsActing(false)
    }
  }

  return (
    <AppShell>
      <div className="vouch-page">
        {state.kind === 'loading' && (
          <div className="vouch-loading">
            <div className="vouch-spinner" />
          </div>
        )}

        {(state.kind === 'not_found' || state.kind === 'already_processed' || state.kind === 'not_identified' || state.kind === 'self_vouch' || state.kind === 'error') && (
          <div className="vouch-card">
            <p className="vouch-info-text">
              {state.kind === 'not_found' && t('vouch.not_found')}
              {state.kind === 'already_processed' && t('vouch.already_processed')}
              {state.kind === 'not_identified' && t('vouch.not_identified')}
              {state.kind === 'self_vouch' && t('vouch.self_vouch')}
              {state.kind === 'error' && t('vouch.network_error')}
            </p>
            <button className="cta-button" onClick={() => navigate('/hub')}>
              {t('vouch.back_to_hub')}
            </button>
          </div>
        )}

        {state.kind === 'active' && (
          <div className="vouch-card">
            <VoucheeAvatar
              name={state.request.requestee.name}
              pictureUrl={state.request.requestee.pictureUrl}
            />
            <h1 className="vouch-name">{state.request.requestee.name}</h1>
            <p className="vouch-request-text">{t('vouch.requests_confirmation')}</p>

            <div className="vouch-divider" />

            <p className="vouch-responsibility">{t('vouch.responsibility_statement')}</p>

            <button
              className="cta-button vouch-confirm-btn"
              onClick={() => void handleConfirm()}
              disabled={isActing}
            >
              {isActing ? t('vouch.confirming') : t('vouch.confirm_cta')}
            </button>
            <button
              className="vouch-decline-btn"
              onClick={() => void handleDecline()}
              disabled={isActing}
            >
              {t('vouch.decline_cta')}
            </button>
          </div>
        )}

        {state.kind === 'confirmed' && (
          <div className="vouch-card">
            <VoucheeAvatar name={state.name} pictureUrl={null} />
            <h1 className="vouch-name">{state.name}</h1>
            <p className="vouch-member-identified">
              <span className="vouch-identified-check">✓</span>
              {t('vouch.member_identified')}
            </p>
            <button className="cta-button" onClick={() => navigate('/hub')}>
              {t('vouch.back_to_hub')}
            </button>
          </div>
        )}

        {state.kind === 'declined' && (
          <div className="vouch-card">
            <p className="vouch-info-text">{t('vouch.declined_message')}</p>
            <button className="cta-button" onClick={() => navigate('/hub')}>
              {t('vouch.back_to_hub')}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function VoucheeAvatar({
  name,
  pictureUrl,
}: {
  name: string
  pictureUrl: string | null
}): JSX.Element {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="vouchee-avatar">
      {pictureUrl ? (
        <img src={pictureUrl} alt={name} className="vouchee-avatar-img" />
      ) : (
        <span className="vouchee-avatar-initials">{initials}</span>
      )}
    </div>
  )
}
