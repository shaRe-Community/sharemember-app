import { useAuth } from '../auth/AuthContext'

/** /hub — Community hub (SM-ugf) */
export function HubPage(): JSX.Element {
  const { user, logout } = useAuth()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Your Communities</h1>
      <p>Welcome, {user?.name}</p>
      <button onClick={() => void logout()}>Sign Out</button>
    </div>
  )
}
