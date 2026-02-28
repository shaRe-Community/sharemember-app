import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const { user, logout } = useAuth()
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
            <Link to="/hub" className="shell-nav-link">Communities</Link>
            <Link to="/profile" className="shell-nav-link">Profile</Link>
            {user?.eidStatus === 'un_identified' && (
              <button
                className="nav-btn nav-btn-primary"
                onClick={() => navigate('/verify')}
              >
                Verify Identity
              </button>
            )}
            <button className="nav-btn nav-btn-secondary" onClick={handleLogout}>
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <main className="shell-main">{children}</main>
    </>
  )
}
