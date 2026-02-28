import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { apiFetch, ApiError } from '../api/api'
import type { JoinCommunityResponse } from '../api/types'

export function JoinPage(): JSX.Element {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    if (!user || !inviteCode.trim()) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await apiFetch<JoinCommunityResponse>(
        '/v2/sharemember/me/communities/join',
        user.accessToken,
        {
          method: 'POST',
          body: JSON.stringify({ inviteCode: inviteCode.trim() }),
        },
      )
      setSuccessMessage(`You have joined ${result.communityName}!`)
      setTimeout(() => navigate('/hub'), 1500)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Invalid invite code. Please check and try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="join-container">
        <div className="join-card">
          <h1 className="join-title">Join a Community</h1>
          <p className="join-subtitle">
            Enter the invite code you received to join a community.
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="join-form">
            <div className="form-field">
              <label htmlFor="inviteCode" className="form-label">
                Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter your invite code"
                className={`form-input${error ? ' form-input-error' : ''}`}
                disabled={isSubmitting || !!successMessage}
                autoFocus
              />
              {error && <p className="form-error">{error}</p>}
            </div>

            {successMessage && (
              <p className="form-success">{successMessage}</p>
            )}

            <button
              type="submit"
              className="cta-button join-submit"
              disabled={isSubmitting || !inviteCode.trim() || !!successMessage}
            >
              {isSubmitting ? 'Joining…' : 'Join Community'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
