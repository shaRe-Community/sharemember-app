import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { apiFetch } from '../api/api'
import type { CommunityTeaser } from '../api/types'

export function HubPage(): JSX.Element {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<CommunityTeaser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    apiFetch<CommunityTeaser[]>('/v2/sharemember/me/communities', user.accessToken)
      .then(setCommunities)
      .catch(() => setError('Could not load your communities. Please try again.'))
      .finally(() => setIsLoading(false))
  }, [user])

  return (
    <AppShell>
      {user?.eidStatus === 'un_identified' && (
        <div className="unidentified-banner">
          <span>Your identity is not yet verified.</span>
          <Link to="/verify" className="banner-cta">Verify with eID →</Link>
        </div>
      )}

      <div className="hub-container">
        <div className="hub-header">
          <h1 className="hub-title">Your Communities</h1>
          <Link to="/join" className="cta-button">Join a community</Link>
        </div>

        {isLoading && <p className="hub-loading">Loading…</p>}
        {error && <p className="hub-error">{error}</p>}

        {!isLoading && !error && communities.length === 0 && (
          <div className="hub-empty">
            <p>You are not a member of any community yet.</p>
            <Link to="/join" className="cta-button" style={{ marginTop: '1rem' }}>
              Join a community
            </Link>
          </div>
        )}

        {communities.length > 0 && (
          <div className="community-grid">
            {communities.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function CommunityCard({ community: c }: { community: CommunityTeaser }): JSX.Element {
  const handleEnter = (): void => {
    if (c.frontendUrl) {
      window.location.href = c.frontendUrl
    }
  }

  return (
    <div className="community-card">
      <div className="community-card-logo">
        {c.logoUrl ? (
          <img src={c.logoUrl} alt={`${c.name} logo`} className="community-logo-img" />
        ) : (
          <div className="community-logo-placeholder">
            {c.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="community-card-body">
        <h2 className="community-card-name">{c.name}</h2>
        {c.intent && <p className="community-card-intent">{c.intent}</p>}

        <div className="community-card-meta">
          <span className="community-member-count">{c.memberCount} members</span>
          {c.purposeRoundtable && (
            <span className="community-roundtable">{c.purposeRoundtable.name}</span>
          )}
        </div>
      </div>

      <div className="community-card-footer">
        <button
          className="cta-button"
          onClick={handleEnter}
          disabled={!c.frontendUrl}
        >
          Enter →
        </button>
      </div>
    </div>
  )
}
