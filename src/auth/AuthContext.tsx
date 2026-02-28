import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import type { User } from 'oidc-client-ts'
import { userManager } from './auth.config'

export type EidStatus = 'un_identified' | 'identified'

export interface AuthUser {
  sub: string
  name: string
  email: string
  accessToken: string
  eidStatus: EidStatus
  shareMemberId: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(oidcUser: User): AuthUser {
  const profile = oidcUser.profile as Record<string, unknown>
  return {
    sub: oidcUser.profile.sub,
    name: (profile.name as string) ?? (profile.preferred_username as string) ?? '',
    email: (profile.email as string) ?? '',
    accessToken: oidcUser.access_token,
    eidStatus: (profile.eid_status as EidStatus) ?? 'un_identified',
    shareMemberId: (profile.share_member_id as string) ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    userManager.getUser().then((oidcUser) => {
      if (oidcUser && !oidcUser.expired) {
        setUser(mapUser(oidcUser))
      }
      setIsLoading(false)
    })

    const onUserLoaded = (oidcUser: User) => setUser(mapUser(oidcUser))
    const onUserUnloaded = () => setUser(null)

    userManager.events.addUserLoaded(onUserLoaded)
    userManager.events.addUserUnloaded(onUserUnloaded)

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded)
      userManager.events.removeUserUnloaded(onUserUnloaded)
    }
  }, [])

  const login = () => userManager.signinRedirect()
  const logout = () => userManager.signoutRedirect()

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
