'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginCredentials, authServiceInstance } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  bypassLogin: () => void
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const token = localStorage.getItem('auth_token')
        const userData = localStorage.getItem('user_data')
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        }
      } catch (err) {
        console.error('Error checking existing session:', err)
        // Clear invalid data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      } finally {
        setIsLoading(false)
      }
    }

    checkExistingSession()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('Frontend login attempt:', credentials)
      setIsLoading(true)
      setError(null)

      console.log('Using singleton authService instance, calling login...')
      const { user: loggedInUser, token } = await authServiceInstance.login(credentials)
      console.log('Login successful:', { user: loggedInUser, token })

      // Store in localStorage
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(loggedInUser))

      setUser(loggedInUser)
    } catch (err) {
      console.error('Frontend login error:', err)
      const errorMessage = (err && typeof err === 'object' && 'message' in err) ? (err as Error).message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const bypassLogin = () => {
    console.log('🚀 Bypass login initiated!')
    setIsLoading(true)
    setError(null)

    try {
      // Create admin user directly
      const adminUser: User = {
        id: 'admin-001',
        username: 'ankit1999899',
        email: 'ankit.chauhan1911@outlook.com',
        password: 'Ankit@9718577453',
        name: 'Ankit Chauhan',
        role: 'admin',
        department: 'IT',
        permissions: [
          '*', // Admin wildcard permission
          'dashboard.view', 'dashboard.stats',
          'sessions.view', 'sessions.manage', 'sessions.create', 'sessions.delete',
          'inbox.view', 'messages.read', 'messages.send', 'messages.delete',
          'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete',
          'bulk.view', 'bulk.create', 'bulk.send', 'bulk.schedule',
          'templates.view', 'templates.create', 'templates.edit', 'templates.delete',
          'analytics.view', 'analytics.advanced', 'analytics.export',
          'ai.view', 'ai.manage', 'ai.configure',
          'users.view', 'users.create', 'users.edit', 'users.delete',
          'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
          'credentials.view', 'credentials.manage',
          'api.view', 'api.manage', 'api.create', 'api.delete',
          'users.read', 'users.update', 'teams.create', 'teams.read', 'teams.update', 'teams.delete',
          'settings.read', 'settings.update', 'api.read', 'sessions.read'
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Set user state
      setUser(adminUser)

      // Store in localStorage for persistence
      localStorage.setItem('auth_token', 'bypass-admin-token')
      localStorage.setItem('user_data', JSON.stringify(adminUser))

      console.log('✅ Bypass login successful! Admin user set:', adminUser)

    } catch (err) {
      console.error('❌ Bypass login error:', err)
      setError('Bypass login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setError(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    bypassLogin,
    logout,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }
    
    if (!isAuthenticated) {
      return null // This will be handled by the main app component
    }
    
    return <Component {...props} />
  }
}
