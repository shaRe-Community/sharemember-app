import { useAuth } from '../auth/AuthContext'

/** /profile — Identity status + avatar (SM-5gh) */
export function ProfilePage(): JSX.Element {
  const { user } = useAuth()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Profile</h1>
      <p>Name: {user?.name}</p>
      <p>Identity status: {user?.eidStatus}</p>
    </div>
  )
}
