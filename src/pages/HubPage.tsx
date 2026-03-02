import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { VouchRequestBanner } from '../components/VouchRequestBanner'
import { apiFetch, fetchPublicCommunities, joinOpenCommunity } from '../api/api'
import type { CommunityTeaser, PublicCommunityTeaser } from '../api/types'

export function HubPage(): JSX.Element {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [communities, setCommunities] = useState<CommunityTeaser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publicCommunities, setPublicCommunities] = useState<PublicCommunityTeaser[]>([])
  const [discoverLoading, setDiscoverLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    apiFetch<CommunityTeaser[]>('/v2/sharemember/me/communities', user.accessToken)
      .then(setCommunities)
      .catch(() => setError(t('hub.load_error')))
      .finally(() => setIsLoading(false))
  }, [user, t])

  useEffect(() => {
    if (!user) return
    fetchPublicCommunities(user.accessToken)
      .then(setPublicCommunities)
      .catch(() => {/* silently ignore — discover is non-critical */})
      .finally(() => setDiscoverLoading(false))
  }, [user])

  const handleJoinOpen = async (communityId: string, frontendUrl: string | null): Promise<void> => {
    if (!user || joiningId) return
    setJoiningId(communityId)
    try {
      await joinOpenCommunity(communityId, user.accessToken)
      if (frontendUrl) {
        window.location.href = frontendUrl
      } else {
        const updated = await apiFetch<CommunityTeaser[]>('/v2/sharemember/me/communities', user.accessToken)
        setCommunities(updated)
        setPublicCommunities((prev) => prev.filter((c) => c.id !== communityId))
      }
    } catch {
      // ignore
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <AppShell>
      <VouchRequestBanner />
      {user?.eidStatus === 'un_identified' && (
        <div className="unidentified-banner">
          <span>{t('banner.unidentified')}</span>
          <Link to="/verify" className="banner-cta">{t('banner.verify_cta')}</Link>
        </div>
      )}

      <div className="hub-container">
        <div className="hub-header">
          <h1 className="hub-title">{t('hub.title')}</h1>
          <Link to="/join" className="cta-button">{t('hub.join')}</Link>
        </div>

        {isLoading && <p className="hub-loading">{t('hub.loading')}</p>}
        {error && <p className="hub-error">{error}</p>}

        {!isLoading && !error && communities.length === 0 && (
          <div className="hub-empty">
            <p>{t('hub.empty')}</p>
            <Link to="/join" className="cta-button" style={{ marginTop: '1rem' }}>
              {t('hub.join')}
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

        {!discoverLoading && publicCommunities.some((c) => !c.isMember) && (
          <div className="hub-discover">
            <h2 className="hub-discover-title">{t('hub.discover_title')}</h2>
            <div className="community-grid">
              {publicCommunities
                .filter((c) => !c.isMember)
                .map((c) => (
                  <PublicCommunityCard
                    key={c.id}
                    community={c}
                    joiningId={joiningId}
                    onJoinOpen={handleJoinOpen}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function PublicCommunityCard({
  community: c,
  joiningId,
  onJoinOpen,
}: {
  community: PublicCommunityTeaser
  joiningId: string | null
  onJoinOpen: (id: string, frontendUrl: string | null) => Promise<void>
}): JSX.Element {
  const { t } = useTranslation()
  const isJoining = joiningId === c.id

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
          <span className="community-member-count">
            {t('hub.member_count', { count: c.memberCount })}
          </span>
        </div>
      </div>
      <div className="community-card-footer">
        {c.hasInviteCode ? (
          <a href="/join" className="cta-button">{t('hub.join_with_code')}</a>
        ) : (
          <button
            className="cta-button"
            onClick={() => void onJoinOpen(c.id, null)}
            disabled={isJoining}
          >
            {isJoining ? t('hub.joining') : t('hub.join_free')}
          </button>
        )}
      </div>
    </div>
  )
}

function CommunityCard({ community: c }: { community: CommunityTeaser }): JSX.Element {
  const { t } = useTranslation()

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
          <span className="community-member-count">{t('hub.member_count', { count: c.memberCount })}</span>
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
          {t('hub.enter')}
        </button>
      </div>
    </div>
  )
}
