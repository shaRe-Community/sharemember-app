import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import type { User } from 'oidc-client-ts'
import { userManager, registerUserManager, REMEMBER_ME_KEY } from './auth.config'

export type EidStatus = 'un_identified' | 'identified'

export interface AuthUser {
  sub: string
  name: string
  email: string
  accessToken: string
  eidStatus: EidStatus
  shareMemberId: string | null
  picture: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (redirectTo?: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  register: () => Promise<void>
  refreshUser: () => Promise<void>
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
    picture: (profile.picture as string) ?? null,
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

  const login = (redirectTo?: string, rememberMe?: boolean) => {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, '1')
    }
    return userManager.signinRedirect({ state: redirectTo })
  }
  const register = () => registerUserManager.signinRedirect()
  const logout = async () => {
    localStorage.removeItem(REMEMBER_ME_KEY)
    await userManager.signoutRedirect()
  }
  const refreshUser = () => userManager.signinSilent().then(() => undefined)

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
