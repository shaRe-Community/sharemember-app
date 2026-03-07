import { ReactNode, useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MemberAvatar } from './MemberAvatar'

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
            <Link to="/story" className="shell-nav-link">
              {t('nav.my_story')}
            </Link>
            <Link to="/members" className="shell-nav-link">
              {t('nav.members')}
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
              <MemberAvatar
                name={user?.name ?? ''}
                pictureUrl={user?.picture}
                eidStatus={user?.eidStatus ?? 'un_identified'}
                size="nav"
              />
            </Link>
          </nav>

          {/* Mobile controls — shown only on mobile via CSS */}
          <div className="header-mobile-controls">
            <LanguageSwitcher />
            <Link to="/profile" className="nav-avatar-link" onClick={() => setMenuOpen(false)}>
              <MemberAvatar
                name={user?.name ?? ''}
                pictureUrl={user?.picture}
                eidStatus={user?.eidStatus ?? 'un_identified'}
                size="nav"
              />
            </Link>
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? t('nav.close_menu') : t('nav.open_menu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className="mobile-menu" id="mobile-nav">
            <Link
              to="/hub"
              className="mobile-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.communities')}
            </Link>
            <Link
              to="/story"
              className="mobile-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.my_story')}
            </Link>
            <Link
              to="/members"
              className="mobile-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.members')}
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
