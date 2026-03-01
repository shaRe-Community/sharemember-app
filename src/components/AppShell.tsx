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

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to="/hub" className="shell-logo">
            sha<span className="red">R</span>e
          </Link>
          <nav className="header-nav">
            <Link to="/hub" className="shell-nav-link">{t('nav.communities')}</Link>
            <Link to="/profile" className="shell-nav-link">{t('nav.profile')}</Link>
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
          </nav>
        </div>
      </header>
      <main className="shell-main">{children}</main>
    </>
  )
}
