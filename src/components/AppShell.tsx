import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from './LanguageSwitcher'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleLogout = (): void => {
    void logout()
  }

  const isIdentified = user?.eidStatus === 'identified'
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to="/hub" className="shell-logo">
            sha<span className="red">R</span>e
          </Link>
          <nav className="header-nav">
            <Link to="/hub" className="shell-nav-link">{t('nav.communities')}</Link>
            <Link to="/settings" className="shell-nav-link">{t('nav.settings')}</Link>
            {user?.eidStatus === 'un_identified' && (
              <button
                className="nav-btn nav-btn-primary"
                onClick={() => navigate('/verify')}
              >
                {t('nav.verify_identity')}
              </button>
            )}
            <button className="nav-btn nav-btn-secondary" onClick={handleLogout}>
              {t('nav.sign_out')}
            </button>
            <LanguageSwitcher />
            <Link to="/profile" className="nav-avatar-link">
              <div className={`nav-avatar-wrapper${isIdentified ? '' : ' avatar-unidentified'}`}>
                <div className="nav-avatar">
                  {user?.picture
                    ? <img src={user.picture} alt="" className="avatar-img" />
                    : initials}
                </div>
                <span className={`avatar-badge${isIdentified ? ' avatar-badge-shield' : ' avatar-badge-question'}`}>
                  {isIdentified ? '✓' : '?'}
                </span>
              </div>
            </Link>
          </nav>
        </div>
      </header>
      <main className="shell-main">{children}</main>
    </>
  )
}
