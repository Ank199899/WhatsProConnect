'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginCredentials, authServiceInstance } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
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
    const checkExistingSession = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const userData = localStorage.getItem('user_data')

        if (token && userData) {
          const parsedUser = JSON.parse(userData)

          // Check session expiry
          const sessionInfo = localStorage.getItem('session_info')
          if (sessionInfo) {
            try {
              const session = JSON.parse(sessionInfo)
              if (session.expiresAt && Date.now() > session.expiresAt) {
                console.log('❌ Session expired, clearing data')
                localStorage.removeItem('auth_token')
                localStorage.removeItem('user_data')
                localStorage.removeItem('session_info')
                setUser(null)
                setIsLoading(false)
                return
              }
            } catch (error) {
              console.error('Error parsing session info:', error)
            }
          }

          // For simple JWT tokens, just check basic validity
          if (!token.startsWith('bypass-') && !token.startsWith('token-')) {
            try {
              // Basic token format check
              const parts = token.split('.')
              if (parts.length !== 3) {
                throw new Error('Invalid token format')
              }

              // Try to decode payload
              const payload = JSON.parse(atob(parts[1]))

              // Check if token is expired
              if (payload.exp && Date.now() > payload.exp) {
                console.log('❌ Token expired, clearing session')
                localStorage.removeItem('auth_token')
                localStorage.removeItem('user_data')
                localStorage.removeItem('session_info')
                setUser(null)
                setIsLoading(false)
                return
              }

              console.log('✅ Token is valid for user:', payload.username)
            } catch (error) {
              console.error('Token validation failed:', error)
              // Clear invalid session
              localStorage.removeItem('auth_token')
              localStorage.removeItem('user_data')
              localStorage.removeItem('session_info')
              setUser(null)
              setIsLoading(false)
              return
            }
          }

          // Set user if token is valid or is a bypass/demo token
          setUser(parsedUser)
          console.log('✅ Session restored for user:', parsedUser.username)
        }
      } catch (err) {
        console.error('Error checking existing session:', err)
        // Clear invalid data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        setUser(null)
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

      // Store in localStorage with timestamp for session tracking
      const sessionData = {
        token,
        user: loggedInUser,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }

      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(loggedInUser))
      localStorage.setItem('session_info', JSON.stringify(sessionData))

      setUser(loggedInUser)
      console.log('✅ Session created successfully for:', loggedInUser.username)
    } catch (err) {
      console.error('Frontend login error:', err)
      const errorMessage = (err && typeof err === 'object' && 'message' in err) ? (err as Error).message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }



  const logout = async () => {
    try {
      console.log('🚪 Logging out user...')

      // Call logout API to invalidate session on server
      const token = localStorage.getItem('auth_token')
      if (token && !token.startsWith('bypass-') && !token.startsWith('token-')) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        } catch (error) {
          console.error('Server logout error:', error)
        }
      }

      // Clear all auth-related data
      setUser(null)
      setError(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('session_info')

      console.log('✅ Logout completed successfully')
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Force clear even if there's an error
      setUser(null)
      setError(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('session_info')
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
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
