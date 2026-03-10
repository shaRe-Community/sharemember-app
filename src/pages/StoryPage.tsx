import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { MemberAvatar } from '../components/MemberAvatar'
import { fetchStory } from '../api/story'
import { ApiError } from '../api/api'
import { fetchTrust, confirmIdentity } from '../api/identity'
import type { TrustInfo } from '../api/identity'
import { getOperators } from '../config/runtime'
import type { Story, CommunityEngagement, TimelineEvent } from '../api/types'

type PageState =
  | { kind: 'loading'; messages: string[] }
  | { kind: 'ready'; story: Story }
  | { kind: 'notFound' }
  | { kind: 'error'; message: string }

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

function SeatLevelBadge({ level }: { level: string }): JSX.Element {
  const colors: Record<string, string> = {
    PURPOSE: '#7c3aed',
    STRATEGY: '#2563eb',
    MOVE: '#059669',
  }
  return (
    <span
      style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        padding: '0.1rem 0.45rem',
        borderRadius: 4,
        background: colors[level] ?? '#9ca3af',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      }}
    >
      {level}
    </span>
  )
}

function TrustStars({ tier }: { tier: 1 | 2 | 3 }): JSX.Element {
  return (
    <span style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>
      {'★'.repeat(tier)}{'☆'.repeat(3 - tier)}
    </span>
  )
}

function StoryView({
  story,
  trust,
  isOwnStory,
  onConfirm,
  isConfirming,
  viewerEidStatus,
}: {
  story: Story
  trust: TrustInfo | null
  isOwnStory: boolean
  onConfirm: () => Promise<void>
  isConfirming: boolean
  viewerEidStatus: 'identified' | 'un_identified'
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <div>
      {/* Identity Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
        <MemberAvatar
          name={story.name}
          pictureUrl={story.pictureUrl}
          eidStatus={story.eidStatus}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{story.name}</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            {t('story.member_since', { date: formatDate(story.memberSince) })}
          </p>
        </div>
      </div>

      {/* Signals */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: t('story.active_communities'), value: story.signals.activeCommunityCount },
          { label: t('story.active_seats'), value: story.signals.activeSeats },
          { label: t('story.longest_seat_months'), value: story.signals.longestSeatMonths },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vertrauenskette — always shown for identified members */}
      {story.eidStatus === 'identified' && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            {t('story.trust_chain')}
          </h2>

          {/* Identification method */}
          {story.identificationMethod === 'eid' && (
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#1d4ed8' }}>
              🛡 {t('story.identified_via_eid')}
            </div>
          )}
          {story.identificationMethod === 'vouch' && story.trustChain.vouchedBy.length > 0 && (
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#059669' }}>
              ✓ {t('story.vouched_by')}{' '}
              {story.trustChain.vouchedBy.map((p, i) => (
                <span key={p.keycloakId}>
                  <Link to={`/story/${p.keycloakId}`}>{p.name}</Link>
                  {p.eidStatus === 'identified' && ' ✓'}
                  {i < story.trustChain.vouchedBy.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Trust tier */}
          {trust !== null && (
            <div style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              <TrustStars tier={trust.tier} />
              <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
                {trust.confirmationCount === 0
                  ? t('story.no_confirmations')
                  : t('story.n_confirmations', { count: trust.confirmationCount })}
              </span>
            </div>
          )}

          {/* Vouched for (existing) */}
          {story.trustChain.vouchedFor.length > 0 && (
            <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.75rem' }}>
              {t('story.vouched_for')}{' '}
              {story.trustChain.vouchedFor.map((p, i) => (
                <span key={p.keycloakId}>
                  <Link to={`/story/${p.keycloakId}`}>{p.name}</Link>
                  {i < story.trustChain.vouchedFor.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Confirm button */}
          {!isOwnStory && viewerEidStatus === 'identified' && trust !== null && !trust.confirmedByMe && (
            <button
              onClick={() => void onConfirm()}
              disabled={isConfirming}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                opacity: isConfirming ? 0.6 : 1,
                fontSize: '0.9rem',
              }}
            >
              {isConfirming ? t('story.confirming') : t('story.confirm_cta')}
            </button>
          )}
          {!isOwnStory && trust?.confirmedByMe && (
            <div style={{ color: '#059669', fontSize: '0.9rem' }}>
              ✓ {t('story.already_confirmed')}
            </div>
          )}
        </section>
      )}

      {/* Community Engagement */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{t('story.communities')}</h2>
        {story.communities.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{t('story.no_communities')}</p>
        )}
        {story.communities.map((c: CommunityEngagement) => (
          <div
            key={c.communityId}
            style={{
              border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '0.75rem 1rem', marginBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              {c.logoUrl && <img src={c.logoUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />}
              <strong>{c.communityName}</strong>
              <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                {t('story.since', { date: formatDate(c.memberSince) })}
              </span>
            </div>
            {c.seats.filter((s) => !s.until).map((s) => (
              <div key={s.roundtableId} style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SeatLevelBadge level={s.roundtableType} />
                <span style={{ fontSize: '0.85rem' }}>{s.roundtableName}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                  {t('story.since', { date: formatDate(s.since) })}
                </span>
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Timeline */}
      {story.timeline.length > 0 && (
        <section>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{t('story.timeline')}</h2>
          <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: '1rem' }}>
            {story.timeline.map((ev: TimelineEvent, i: number) => (
              <div key={i} style={{ marginBottom: '0.75rem', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute', left: -21, top: 4,
                    width: 8, height: 8, borderRadius: '50%',
                    background: ev.type === 'gained_seat' ? '#7c3aed' : '#9ca3af',
                    border: '2px solid #fff',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formatDate(ev.date)}</div>
                <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                  {t(`story.event_${ev.type}`, {
                    community: ev.communityName,
                    detail: ev.detail ?? '',
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function StoryPage(): JSX.Element {
  const { memberId } = useParams<{ memberId?: string }>()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [state, setState] = useState<PageState>({ kind: 'loading', messages: [] })
  const [trust, setTrust] = useState<TrustInfo | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const isOwnStory = !memberId || memberId === user?.sub
  const targetId = memberId ?? user?.sub ?? ''

  useEffect(() => {
    if (!user || !targetId) return
    let cancelled = false
    setTrust(null)
    const messages = getOperators().map((op) =>
      t('story.searching_in_community', { community: op.name }),
    )
    setState({ kind: 'loading', messages })
    fetchStory(targetId, user.accessToken)
      .then((story) => {
        if (cancelled) return
        // For own story: inject picture + eidStatus from the JWT (same source as ProfilePage / AppShell)
        const enriched = isOwnStory
          ? {
              ...story,
              pictureUrl: user?.picture ?? story.pictureUrl,
              eidStatus: (user?.eidStatus ?? story.eidStatus) as 'identified' | 'un_identified',
            }
          : story
        setState({ kind: 'ready', story: enriched })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setState({ kind: 'notFound' })
        } else {
          setState({ kind: 'error', message: String(err) })
        }
      })
    return () => { cancelled = true }
  }, [user, targetId, isOwnStory])

  useEffect(() => {
    if (state.kind !== 'ready' || !user) return
    if (state.story.eidStatus !== 'identified') return
    let cancelled = false
    fetchTrust(targetId, user.accessToken)
      .then((t) => { if (!cancelled) setTrust(t) })
      .catch(() => { if (!cancelled) setTrust(null) })
    return () => { cancelled = true }
  }, [state.kind, user, targetId])

  const handleConfirm = async (): Promise<void> => {
    if (!user) return
    setIsConfirming(true)
    // Optimistic update
    setTrust(prev =>
      prev
        ? {
            ...prev,
            confirmationCount: prev.confirmationCount + 1,
            confirmedByMe: true,
            tier: (prev.confirmationCount + 1 >= 10 ? 3 : prev.confirmationCount + 1 >= 3 ? 2 : 1) as 1 | 2 | 3,
          }
        : null
    )
    try {
      const updated = await confirmIdentity(targetId, user.accessToken)
      setTrust(updated)
    } catch {
      // Rollback: re-fetch actual state
      fetchTrust(targetId, user.accessToken).then(setTrust).catch(() => setTrust(null))
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {state.kind === 'loading' && (
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            {state.messages.length > 0
              ? state.messages.map((msg) => (
                  <p key={msg} style={{ margin: '0.35rem 0' }}>⏳ {msg}</p>
                ))
              : <p>{t('common.loading')}</p>
            }
          </div>
        )}
        {state.kind === 'error' && <p style={{ color: 'red' }}>{state.message}</p>}
        {state.kind === 'notFound' && <p>{t('story.not_found')}</p>}
        {state.kind === 'ready' && (
          <StoryView
            story={state.story}
            trust={trust}
            isOwnStory={isOwnStory}
            onConfirm={handleConfirm}
            isConfirming={isConfirming}
            viewerEidStatus={user?.eidStatus ?? 'un_identified'}
          />
        )}
      </div>
    </AppShell>
  )
}
