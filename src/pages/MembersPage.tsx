import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { searchMembers } from '../api/story'
import type { StorySummary } from '../api/types'

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

export function MembersPage(): JSX.Element {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [eidFilter, setEidFilter] = useState('')
  const [results, setResults] = useState<StorySummary[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (): Promise<void> => {
    if (!user || !query.trim()) return
    setIsSearching(true)
    setHasSearched(true)
    try {
      const data = await searchMembers(query, user.accessToken, eidFilter || undefined)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') void handleSearch()
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>{t('members.title')}</h1>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('members.search_placeholder')}
            style={{
              flex: 1, padding: '0.6rem 0.75rem', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: '0.95rem',
            }}
          />
          <button
            onClick={() => void handleSearch()}
            disabled={isSearching || !query.trim()}
            style={{
              padding: '0.6rem 1.25rem', background: '#7c3aed', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
              opacity: isSearching || !query.trim() ? 0.6 : 1,
            }}
          >
            {isSearching ? '…' : t('members.search_button')}
          </button>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <select
            value={eidFilter}
            onChange={(e) => setEidFilter(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.875rem' }}
          >
            <option value="">{t('members.filter_all')}</option>
            <option value="identified">{t('members.filter_identified')}</option>
            <option value="un_identified">{t('members.filter_unidentified')}</option>
          </select>
        </div>

        {hasSearched && !isSearching && results.length === 0 && (
          <p style={{ color: '#9ca3af' }}>{t('members.no_results')}</p>
        )}

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {results.map((member) => (
            <Link
              key={member.shareMemberId}
              to={`/story/${member.shareMemberId}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.875rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                    background: '#e5e7eb', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, flexShrink: 0, position: 'relative',
                    fontSize: '1rem',
                  }}
                >
                  {member.pictureUrl
                    ? <img src={member.pictureUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  <span
                    style={{
                      position: 'absolute', bottom: 0, right: 0,
                      background: member.eidStatus === 'identified' ? '#16a34a' : '#9ca3af',
                      color: '#fff', borderRadius: '50%', width: 16, height: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.55rem', fontWeight: 700, border: '2px solid #fff',
                    }}
                  >
                    {member.eidStatus === 'identified' ? '✓' : '?'}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{member.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {t('story.member_since', { date: formatDate(member.memberSince) })}
                    {member.highestSeatLevel && (
                      <span style={{ marginLeft: '0.5rem', color: '#7c3aed' }}>· {member.highestSeatLevel}</span>
                    )}
                  </div>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '1.2rem' }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
