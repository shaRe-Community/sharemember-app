import { ReactNode, useState, useEffect, useRef } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const closeMenu = (path: string) => {
    setMenuOpen(false)
    navigate(path)
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <>
      <header className="header" ref={menuRef}>
        <div className="header-content">
          <Link to="/hub" className="shell-logo">
            sha<span className="red">R</span>e
          </Link>

          {/* Desktop nav — hidden on mobile via CSS */}
          <nav className="header-nav">
            <Link to="/hub" className="shell-nav-link">
              {t('nav.communities')}
            </Link>
            <Link to="/settings" className="shell-nav-link">
              {t('nav.settings')}
            </Link>
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
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="avatar-img" />
                  ) : (
                    initials
                  )}
                </div>
                <span className={`avatar-badge${isIdentified ? ' avatar-badge-shield' : ' avatar-badge-question'}`}>
                  {isIdentified ? '✓' : '?'}
                </span>
              </div>
            </Link>
          </nav>

          {/* Mobile controls — shown only on mobile via CSS */}
          <div className="header-mobile-controls">
            <LanguageSwitcher />
            <Link to="/profile" className="nav-avatar-link" onClick={() => setMenuOpen(false)}>
              <div className={`nav-avatar-wrapper${isIdentified ? '' : ' avatar-unidentified'}`}>
                <div className="nav-avatar">
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="avatar-img" />
                  ) : (
                    initials
                  )}
                </div>
                <span className={`avatar-badge${isIdentified ? ' avatar-badge-shield' : ' avatar-badge-question'}`}>
                  {isIdentified ? '✓' : '?'}
                </span>
              </div>
            </Link>
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className="mobile-menu">
            <Link
              to="/hub"
              className="mobile-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.communities')}
            </Link>
            <Link
              to="/settings"
              className="mobile-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.settings')}
            </Link>
            {user?.eidStatus === 'un_identified' && (
              <button
                className="mobile-menu-item mobile-menu-item-primary"
                onClick={() => closeMenu('/verify')}
              >
                {t('nav.verify_identity')}
              </button>
            )}
            <button
              className="mobile-menu-item"
              onClick={() => { setMenuOpen(false); handleLogout() }}
            >
              {t('nav.sign_out')}
            </button>
          </nav>
        )}
      </header>
      <main className="shell-main">{children}</main>
    </>
  )
}
