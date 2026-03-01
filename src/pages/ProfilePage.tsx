import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'

export function ProfilePage(): JSX.Element {
  const { user } = useAuth()
  const { t } = useTranslation()
  const isIdentified = user?.eidStatus === 'identified'
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <AppShell>
      <div className="profile-container">
        <div className="profile-card">
          {/* Avatar */}
          <div className={`avatar-wrapper${isIdentified ? '' : ' avatar-unidentified'}`}>
            <div className="avatar">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="avatar-img"
                />
              ) : (
                initials
              )}
            </div>
            <span className={`avatar-badge${isIdentified ? ' avatar-badge-shield' : ' avatar-badge-question'}`}>
              {isIdentified ? '✓' : '?'}
            </span>
          </div>

          <h1 className="profile-name">{user?.name}</h1>
          <p className="profile-email">{user?.email}</p>

          {/* Identity status banner */}
          {isIdentified ? (
            <div className="identity-banner identity-banner-verified">
              <span className="identity-icon">✓</span>
              <div>
                <strong>{t('profile.identity_verified')}</strong>
                <p>{t('profile.identity_verified_desc')}</p>
              </div>
            </div>
          ) : (
            <div className="identity-banner identity-banner-unverified">
              <span className="identity-icon">?</span>
              <div>
                <strong>{t('profile.identity_unverified')}</strong>
                <p>{t('profile.identity_unverified_desc')}</p>
                <Link to="/verify" className="cta-button" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  {t('profile.verify_cta')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
