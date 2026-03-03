import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function LandingPage(): JSX.Element {
  const { user, isLoading, login, register } = useAuth()
  const { t } = useTranslation()
  const [rememberMe, setRememberMe] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogin = (): void => {
    void login(undefined, rememberMe)
  }

  const handleRegister = (): void => {
    void register()
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          {/* Desktop nav — hidden on mobile via CSS */}
          <nav className="header-nav">
            {user ? (
              <a href="/hub" className="nav-btn nav-btn-primary">
                {t('nav.my_communities')}
              </a>
            ) : (
              <>
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  {t('nav.remember_me')}
                </label>
                <button
                  className="nav-btn nav-btn-secondary"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? t('nav.loading') : t('nav.sign_in')}
                </button>
                <button
                  className="nav-btn nav-btn-primary"
                  onClick={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? t('nav.loading') : t('nav.sign_up')}
                </button>
              </>
            )}
            <LanguageSwitcher />
          </nav>

          {/* Mobile controls — shown only on mobile via CSS */}
          <div className="header-mobile-controls">
            <LanguageSwitcher />
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? t('nav.close_menu') : t('nav.open_menu')}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-nav"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className="mobile-menu" id="landing-mobile-nav">
            {user ? (
              <a href="/hub" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                {t('nav.my_communities')}
              </a>
            ) : (
              <>
                <label className="mobile-menu-item remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  {t('nav.remember_me')}
                </label>
                <button
                  className="mobile-menu-item"
                  onClick={() => { setMenuOpen(false); handleLogin() }}
                  disabled={isLoading}
                >
                  {isLoading ? t('nav.loading') : t('nav.sign_in')}
                </button>
                <button
                  className="mobile-menu-item mobile-menu-item-primary"
                  onClick={() => { setMenuOpen(false); handleRegister() }}
                  disabled={isLoading}
                >
                  {isLoading ? t('nav.loading') : t('nav.sign_up')}
                </button>
              </>
            )}
          </nav>
        )}
      </header>

      <main>
        <section className="hero">
          <img
            src="/roundtable.png"
            alt={t('landing.hero_img_alt')}
            className="hero-bg"
          />
          <div className="hero-overlay"></div>

          <div className="scroll-indicator">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <div className="hero-content">
            <h1 className="hero-title">
              <span>sha</span>
              <span className="red">R</span>
              <span>e</span>
            </h1>

            <div className="hero-quote">
              <blockquote>"{t('landing.quote')}"</blockquote>
              <cite>
                <a
                  href="https://en.wikipedia.org/wiki/Douglas_McGregor"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('landing.quote_author')}
                </a>
              </cite>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-content">
            <h2 className="section-title">{t('landing.tagline')}</h2>

            <p className="section-text">
              <span className="emphasis">sha</span>
              <span className="emphasis red">R</span>
              <span className="emphasis">e</span> {t('landing.description')}
            </p>

            <p className="section-text">{t('landing.membership_intro')}</p>

            <p className="section-text">
              {t('landing.membership_benefits')
                .split('\n')
                .map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
            </p>

            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '2rem 0 1rem 0',
              }}
            >
              {t('landing.join_heading')}
            </h3>

            <p className="section-text">
              <span className="emphasis">sha</span>
              <span className="emphasis red">R</span>
              <span className="emphasis">e</span>{' '}
              {t('landing.join_description')}
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
