import { useAuth } from '../auth/AuthContext'

export function LandingPage(): JSX.Element {
  const { user, isLoading, login } = useAuth()

  const handleLogin = (): void => {
    void login()
  }

  const handleRegister = (): void => {
    const ssoUrl = import.meta.env.VITE_SSO_URL
    const realm = import.meta.env.VITE_KEYCLOAK_REALM
    const publicUrl = import.meta.env.VITE_PUBLIC_URL
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID
    const callbackUrl = encodeURIComponent(`${publicUrl}/callback`)
    window.location.href =
      `${ssoUrl}/realms/${realm}/protocol/openid-connect/registrations` +
      `?client_id=${clientId}&scope=openid%20email%20profile` +
      `&response_type=code&redirect_uri=${callbackUrl}`
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <nav className="header-nav">
            {user ? (
              <a href="/hub" className="nav-btn nav-btn-primary">
                My Communities
              </a>
            ) : (
              <>
                <button
                  className="nav-btn nav-btn-secondary"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Sign In'}
                </button>
                <button
                  className="nav-btn nav-btn-primary"
                  onClick={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Sign Up'}
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <img
            src="/roundtable.png"
            alt="Modern conference room with circular roundtable and red chairs"
            className="hero-bg"
          />
          <div className="hero-overlay"></div>

          <div className="scroll-indicator">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <div className="hero-content">
            <h1 className="hero-title">
              <span>sha</span><span className="red">R</span><span>e</span>
            </h1>

            <div className="hero-quote">
              <blockquote>
                "Our goal should be minimum standardization of human behavior."
              </blockquote>
              <cite>
                <a
                  href="https://en.wikipedia.org/wiki/Douglas_McGregor"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Douglas McGregor
                </a>
              </cite>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-content">
            <h2 className="section-title">Connect People - Share Responsibility - Strengthen Community.</h2>

            <p className="section-text">
              <span className="emphasis">sha</span><span className="emphasis red">R</span><span className="emphasis">e</span> is the structural foundation for communities that function as societies based on shared responsibility, not hierarchy. We provide the legal, spatial, and digital orders that make authentic community possible.
            </p>

            <p className="section-text">
              Your <span className="emphasis">sha</span><span className="emphasis red">R</span><span className="emphasis">e</span> membership enables:
            </p>

            <p className="section-text">
              Access to all three organizational orders<br />
              The right to create unlimited communities and connected societies<br />
              Possibility to participate in any number of circles.
            </p>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '2rem 0 1rem 0' }}>
              Join the return to our natural order
            </h3>

            <p className="section-text">
              <span className="emphasis">sha</span><span className="emphasis red">R</span><span className="emphasis">e</span> connects you with communities worldwide that demonstrate another way of organizing human relationships. From hotels without hierarchies to businesses without traditional ownership - experience communities that work with human nature instead of against it.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
