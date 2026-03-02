import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { apiFetch, ApiError } from '../api/api'
import { createVouchRequest } from '../api/vouch'

type Phase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'processing' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

const STATE_KEY = 'eid_state'

export function VerifyPage(): JSX.Element {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  // ── Handle return from eID provider ────────────────────────────────
  useEffect(() => {
    const rid = searchParams.get('rid')
    const returnedState = searchParams.get('state')
    const status = searchParams.get('status')

    if (status === 'cancelled') {
      setPhase({ kind: 'error', message: t('verify.error_cancelled') })
      return
    }

    if (!rid || !returnedState || !user) return

    const storedState = sessionStorage.getItem(STATE_KEY)
    if (storedState !== returnedState) {
      setPhase({ kind: 'error', message: t('verify.error_invalid_state') })
      return
    }

    sessionStorage.removeItem(STATE_KEY)
    setPhase({ kind: 'processing' })

    apiFetch<void>('/v2/eid/callback', user.accessToken, {
      method: 'POST',
      body: JSON.stringify({ rid, state: returnedState }),
    })
      .then(() => {
        setPhase({ kind: 'success' })
        setTimeout(() => navigate('/profile', { replace: true }), 2000)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 409) {
          setPhase({ kind: 'error', message: t('verify.error_duplicate') })
        } else {
          setPhase({ kind: 'error', message: t('verify.error_failed') })
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Start eID flow ─────────────────────────────────────────────────
  const handleStart = async (): Promise<void> => {
    if (!user) return
    setPhase({ kind: 'starting' })
    try {
      const { redirectUrl, state } = await apiFetch<{ redirectUrl: string; state: string }>(
        '/v2/eid/start',
        user.accessToken,
      )
      sessionStorage.setItem(STATE_KEY, state)
      window.location.href = redirectUrl
    } catch {
      setPhase({ kind: 'error', message: t('verify.error_start') })
    }
  }

  if (user?.eidStatus === 'identified' && phase.kind === 'idle') {
    return (
      <AppShell>
        <div className="verify-container">
          <div className="verify-card">
            <div className="verify-icon verify-icon-success">✓</div>
            <h1 className="verify-title">{t('verify.already_verified_title')}</h1>
            <p className="verify-subtitle">{t('verify.already_verified_desc')}</p>
            <button className="cta-button" onClick={() => navigate('/profile')}>
              {t('verify.back_to_profile')}
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="verify-container">
        <div className="verify-card">

          {phase.kind === 'processing' && (
            <LoadingState message={t('verify.processing')} />
          )}

          {phase.kind === 'success' && (
            <>
              <div className="verify-icon verify-icon-success">✓</div>
              <h1 className="verify-title">{t('verify.success_title')}</h1>
              <p className="verify-subtitle">{t('verify.success_desc')}</p>
            </>
          )}

          {phase.kind === 'error' && (
            <>
              <div className="verify-icon verify-icon-error">✕</div>
              <h1 className="verify-title">{t('verify.failed_title')}</h1>
              <p className="verify-subtitle">{phase.message}</p>
              <button
                className="cta-button"
                onClick={() => setPhase({ kind: 'idle' })}
              >
                {t('verify.try_again')}
              </button>
            </>
          )}

          {(phase.kind === 'idle' || phase.kind === 'starting') && (
            <>
              <div className="verify-icon verify-icon-neutral">🪪</div>
              <h1 className="verify-title">{t('verify.title')}</h1>
              <p className="verify-subtitle">{t('verify.subtitle')}</p>

              <div className="verify-steps">
                <VerifyStep
                  number={1}
                  title={t('verify.step1_title')}
                  detail={t('verify.step1_detail')}
                />
                <VerifyStep
                  number={2}
                  title={t('verify.step2_title')}
                  detail={t('verify.step2_detail')}
                />
                <VerifyStep
                  number={3}
                  title={t('verify.step3_title')}
                  detail={t('verify.step3_detail')}
                />
              </div>

              <button
                className="cta-button verify-start-btn"
                onClick={() => void handleStart()}
                disabled={phase.kind === 'starting'}
              >
                {phase.kind === 'starting' ? t('verify.starting') : t('verify.start')}
              </button>

              <p className="verify-privacy">{t('verify.privacy')}</p>

              <div className="verify-vouch-divider">
                <span>{t('verify.or_alternatively')}</span>
              </div>

              <VouchRequestForm />
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function VerifyStep({
  number,
  title,
  detail,
}: {
  number: number
  title: string
  detail: string
}): JSX.Element {
  return (
    <div className="verify-step">
      <div className="verify-step-number">{number}</div>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  )
}

function VouchRequestForm(): JSX.Element {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error_not_found' | 'error_duplicate' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!user || !email.trim()) return
    setState('sending')
    try {
      await createVouchRequest(email.trim(), user.accessToken)
      setState('sent')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) setState('error_not_found')
        else if (err.status === 409) setState('error_duplicate')
        else setState('error')
      } else {
        setState('error')
      }
    }
  }

  if (state === 'sent') {
    return (
      <div className="vouch-request-form">
        <p className="vouch-request-sent">✓ {t('verify.vouch_request_sent')}</p>
      </div>
    )
  }

  return (
    <div className="vouch-request-form">
      <p className="vouch-request-label">{t('verify.vouch_request_intro')}</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="vouch-request-row">
        <input
          type="email"
          className="vouch-request-input"
          placeholder={t('verify.vouch_request_placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === 'sending'}
          required
        />
        <button
          type="submit"
          className="nav-btn nav-btn-secondary vouch-request-btn"
          disabled={state === 'sending' || !email.trim()}
        >
          {state === 'sending' ? t('verify.vouch_request_sending') : t('verify.vouch_request_cta')}
        </button>
      </form>
      {state === 'error_not_found' && (
        <p className="vouch-request-error">{t('verify.vouch_error_not_found')}</p>
      )}
      {state === 'error_duplicate' && (
        <p className="vouch-request-error">{t('verify.vouch_error_duplicate')}</p>
      )}
      {state === 'error' && (
        <p className="vouch-request-error">{t('verify.vouch_error_generic')}</p>
      )}
    </div>
  )
}

function LoadingState({ message }: { message: string }): JSX.Element {
  return (
    <div className="verify-loading">
      <div className="verify-spinner" />
      <p>{message}</p>
    </div>
  )
}
