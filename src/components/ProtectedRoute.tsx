import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/**
 * Wraps protected routes. Redirects to Keycloak login if the user is not
 * authenticated. Shows nothing while loading to avoid a flash of unauthenticated content.
 */
export function ProtectedRoute(): JSX.Element | null {
  const { user, isLoading, login } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      void login()
    }
  }, [isLoading, user, login])

  if (isLoading || !user) return null

  return <Outlet />
}
