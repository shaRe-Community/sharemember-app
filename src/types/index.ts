import { ReactNode } from 'react'

// Application types
export interface AppConfig {
  ssoUrl: string
  realm: string
  appName: string
  apiUrl: string
  publicUrl: string
}

// Component props
export interface ButtonProps {
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

// Environment configuration
export interface EnvironmentConfig {
  isDevelopment: boolean
  isProduction: boolean
}
