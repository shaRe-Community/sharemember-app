import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { apiFetch, ApiError } from '../api/api'
import { getIdentityServiceUrl } from '../config/runtime'
import {
  createVouchRequest,
  createOpenVouchRequest,
  fetchRequestStatus,
} from '../api/vouch'

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
    }, getIdentityServiceUrl())
      .then(() => {
        setPhase({ kind: 'success' })
        setTimeout(() => navigate('/profile', { replace: true }), 2000)
      })
      .catch(err => {
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
      const { redirectUrl, state } = await apiFetch<{
        redirectUrl: string
        state: string
      }>('/v2/eid/start', user.accessToken, undefined, getIdentityServiceUrl())
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
            <h1 className="verify-title">
              {t('verify.already_verified_title')}
            </h1>
            <p className="verify-subtitle">
              {t('verify.already_verified_desc')}
            </p>
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
                {phase.kind === 'starting'
                  ? t('verify.starting')
                  : t('verify.start')}
              </button>

              <p className="verify-privacy">{t('verify.privacy')}</p>

              <div className="verify-vouch-divider">
                <span>{t('verify.or_alternatively')}</span>
              </div>

              <VouchSection />
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

function VouchSection(): JSX.Element {
  const [mode, setMode] = useState<'choose' | 'qr' | 'email'>('choose')

  if (mode === 'qr') return <QrVouchMode onBack={() => setMode('choose')} />
  if (mode === 'email')
    return <EmailVouchMode onBack={() => setMode('choose')} />

  return (
    <VouchModeChooser
      onQr={() => setMode('qr')}
      onEmail={() => setMode('email')}
    />
  )
}

function VouchModeChooser({
  onQr,
  onEmail,
}: {
  onQr: () => void
  onEmail: () => void
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="vouch-request-form">
      <p className="vouch-request-label">{t('verify.vouch_request_intro')}</p>
      <button
        className="nav-btn nav-btn-secondary vouch-request-btn"
        style={{ width: '100%' }}
        onClick={onQr}
      >
        {t('verify.vouch_qr_cta')}
      </button>
      <button className="vouch-back-link" onClick={onEmail}>
        {t('verify.vouch_email_cta')}
      </button>
    </div>
  )
}

function QrVouchMode({ onBack }: { onBack: () => void }): JSX.Element {
  const { user, refreshUser } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [requestId, setRequestId] = useState<string | null>(null)
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'showing' | 'confirmed' | 'error'
  >('idle')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    void handleShowQr()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShowQr = async (): Promise<void> => {
    if (!user) return
    setStatus('loading')
    try {
      const req = await createOpenVouchRequest(user.accessToken)
      setRequestId(req.id)
      setStatus('showing')

      // Start polling for status
      pollRef.current = setInterval(async () => {
        try {
          const { status: reqStatus } = await fetchRequestStatus(
            req.id,
            user.accessToken
          )
          if (reqStatus === 'confirmed') {
            if (pollRef.current) clearInterval(pollRef.current)
            setStatus('confirmed')
            await refreshUser()
            setTimeout(() => navigate('/profile', { replace: true }), 2000)
          }
        } catch {
          // Polling error — silently continue
        }
      }, 3000)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'confirmed') {
    return (
      <div className="vouch-qr-section">
        <div className="verify-icon verify-icon-success">✓</div>
        <p className="vouch-request-sent">{t('verify.vouch_qr_confirmed')}</p>
      </div>
    )
  }

  if (status === 'showing' && requestId) {
    const qrUrl = `${window.location.origin}/vouch/${requestId}`
    return (
      <div className="vouch-qr-section">
        <p className="vouch-request-label">{t('verify.vouch_qr_title')}</p>
        <div className="vouch-qr-container">
          <QRCodeSVG
            value={qrUrl}
            size={200}
            bgColor="#ffffff"
            fgColor="#031633"
            level="M"
          />
        </div>
        <p className="vouch-request-label">
          {t('verify.vouch_qr_instructions')}
        </p>
        <p className="vouch-responsibility" style={{ fontSize: '0.75rem' }}>
          {t('verify.vouch_qr_hint')}
        </p>
        <button className="vouch-back-link" onClick={onBack}>
          {t('verify.vouch_back')}
        </button>
      </div>
    )
  }

  return (
    <div className="vouch-qr-section">
      <button
        className="nav-btn nav-btn-secondary vouch-request-btn"
        style={{ width: '100%' }}
        onClick={() => void handleShowQr()}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? t('verify.starting') : t('verify.vouch_qr_cta')}
      </button>
      {status === 'error' && (
        <p className="vouch-request-error">{t('verify.vouch_error_generic')}</p>
      )}
      <button className="vouch-back-link" onClick={onBack}>
        {t('verify.vouch_back')}
      </button>
    </div>
  )
}

function EmailVouchMode({ onBack }: { onBack: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <div>
      <VouchRequestForm />
      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <button className="vouch-back-link" onClick={onBack}>
          {t('verify.vouch_back_to_qr')}
        </button>
      </div>
    </div>
  )
}

function VouchRequestForm(): JSX.Element {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<
    | 'idle'
    | 'sending'
    | 'sent'
    | 'error_not_found'
    | 'error_duplicate'
    | 'error'
  >('idle')

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
      <form onSubmit={e => void handleSubmit(e)} className="vouch-request-row">
        <input
          type="email"
          className="vouch-request-input"
          placeholder={t('verify.vouch_request_placeholder')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={state === 'sending'}
          required
        />
        <button
          type="submit"
          className="nav-btn nav-btn-secondary vouch-request-btn"
          disabled={state === 'sending' || !email.trim()}
        >
          {state === 'sending'
            ? t('verify.vouch_request_sending')
            : t('verify.vouch_request_cta')}
        </button>
      </form>
      {state === 'error_not_found' && (
        <p className="vouch-request-error">
          {t('verify.vouch_error_not_found')}
        </p>
      )}
      {state === 'error_duplicate' && (
        <p className="vouch-request-error">
          {t('verify.vouch_error_duplicate')}
        </p>
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
