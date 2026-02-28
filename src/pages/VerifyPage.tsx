import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { apiFetch, ApiError } from '../api/api'

type Phase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'processing' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

const STATE_KEY = 'eid_state'

export function VerifyPage(): JSX.Element {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  // ── Handle return from eID provider ────────────────────────────────
  useEffect(() => {
    const rid = searchParams.get('rid')
    const returnedState = searchParams.get('state')
    const status = searchParams.get('status')

    if (status === 'cancelled') {
      setPhase({ kind: 'error', message: 'Verification was cancelled. You can try again.' })
      return
    }

    if (!rid || !returnedState || !user) return

    const storedState = sessionStorage.getItem(STATE_KEY)
    if (storedState !== returnedState) {
      setPhase({ kind: 'error', message: 'Invalid session state. Please start over.' })
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
          setPhase({
            kind: 'error',
            message:
              'This eID is already linked to another shaRe Member account. ' +
              'If you believe this is an error, please contact support.',
          })
        } else {
          setPhase({ kind: 'error', message: 'Verification failed. Please try again.' })
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
      setPhase({ kind: 'error', message: 'Could not start eID verification. Please try again.' })
    }
  }

  if (user?.eidStatus === 'identified' && phase.kind === 'idle') {
    return (
      <AppShell>
        <div className="verify-container">
          <div className="verify-card">
            <div className="verify-icon verify-icon-success">✓</div>
            <h1 className="verify-title">Already verified</h1>
            <p className="verify-subtitle">Your identity is confirmed. You have full platform access.</p>
            <button className="cta-button" onClick={() => navigate('/profile')}>
              Back to Profile
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
            <LoadingState message="Completing verification…" />
          )}

          {phase.kind === 'success' && (
            <>
              <div className="verify-icon verify-icon-success">✓</div>
              <h1 className="verify-title">Identity verified!</h1>
              <p className="verify-subtitle">
                You are now an IDENTIFIED shaRe Member. Redirecting to your profile…
              </p>
            </>
          )}

          {phase.kind === 'error' && (
            <>
              <div className="verify-icon verify-icon-error">✕</div>
              <h1 className="verify-title">Verification failed</h1>
              <p className="verify-subtitle">{phase.message}</p>
              <button
                className="cta-button"
                onClick={() => setPhase({ kind: 'idle' })}
              >
                Try again
              </button>
            </>
          )}

          {(phase.kind === 'idle' || phase.kind === 'starting') && (
            <>
              <div className="verify-icon verify-icon-neutral">🪪</div>
              <h1 className="verify-title">Verify your identity</h1>
              <p className="verify-subtitle">
                Become an IDENTIFIED shaRe Member — one person, one account, guaranteed.
              </p>

              <div className="verify-steps">
                <VerifyStep
                  number={1}
                  title="German Personalausweis with eID function"
                  detail="Your ID card must have the online eID function enabled (most cards issued after 2010)."
                />
                <VerifyStep
                  number={2}
                  title="AusweisApp on your phone"
                  detail="Download the official AusweisApp2 app to read your ID card via NFC."
                />
                <VerifyStep
                  number={3}
                  title="Your 6-digit eID PIN"
                  detail="You set this PIN when you activated the online eID function at your local authority."
                />
              </div>

              <button
                className="cta-button verify-start-btn"
                onClick={() => void handleStart()}
                disabled={phase.kind === 'starting'}
              >
                {phase.kind === 'starting' ? 'Starting…' : 'Start eID verification'}
              </button>

              <p className="verify-privacy">
                We store only a cryptographic hash of your ID — no name, address, or
                biometric data is retained.
              </p>
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

function LoadingState({ message }: { message: string }): JSX.Element {
  return (
    <div className="verify-loading">
      <div className="verify-spinner" />
      <p>{message}</p>
    </div>
  )
}
