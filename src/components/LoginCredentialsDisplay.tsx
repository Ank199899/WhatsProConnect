'use client'

import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Copy, User, Key, Crown, CheckCircle } from 'lucide-react'
import { authServiceInstance } from '@/lib/auth'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'

interface LoginCredential {
  id: string
  username: string
  password: string
  role: string
  name: string
  email: string
}

export default function LoginCredentialsDisplay() {
  const [credentials, setCredentials] = useState<LoginCredential[]>([])
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = () => {
    try {
      const usersMap = (authServiceInstance as any).users
      const users = Array.from(usersMap.values())
      
      const creds: LoginCredential[] = users.map(user => ({
        id: user.id,
        username: user.username || user.email.split('@')[0],
        password: user.role === 'admin' ? 'Ankit@9718577453' : 'defaultPassword123',
        role: user.role,
        name: user.name,
        email: user.email
      }))
      
      setCredentials(creds)
    } catch (error) {
      console.error('Error loading credentials:', error)
    }
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'agent': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />
      case 'manager': return <Key className="w-4 h-4" />
      case 'agent': return <User className="w-4 h-4" />
      case 'viewer': return <Eye className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Key className="w-8 h-8 mr-3 text-blue-600" />
            Login Credentials
          </h1>
          <p className="text-gray-600 mt-1">
            Available login credentials for testing and access
          </p>
        </div>
        
        <Button
          onClick={loadCredentials}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.map((cred) => (
          <Card key={cred.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getRoleIcon(cred.role)}
                  <span className="font-semibold">{cred.name}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(cred.role)}`}>
                  {cred.role}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Username */}
              <div>
                <label className="text-sm font-medium text-gray-600">Username</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="text"
                    value={cred.username}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(cred.username, `${cred.id}-username`)}
                  >
                    {copiedId === `${cred.id}-username` ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-600">Password</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type={showPasswords[cred.id] ? 'text' : 'password'}
                    value={cred.password}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePasswordVisibility(cred.id)}
                  >
                    {showPasswords[cred.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(cred.password, `${cred.id}-password`)}
                  >
                    {copiedId === `${cred.id}-password` ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={cred.email}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Quick Login Button */}
              <Button
                onClick={() => {
                  // Set localStorage and reload
                  const adminUser = {
                    id: cred.id,
                    username: cred.username,
                    email: cred.email,
                    name: cred.name,
                    role: cred.role,
                    department: 'IT',
                    permissions: cred.role === 'admin' ? ['*'] : [],
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                  
                  localStorage.setItem('auth_token', `token-${cred.id}`)
                  localStorage.setItem('user_data', JSON.stringify(adminUser))
                  window.location.href = '/'
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                🚀 Quick Login as {cred.role}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {credentials.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600 mb-4">Create some users first to see login credentials</p>
          <Button
            onClick={() => window.location.href = '/?tab=users'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to User Management
          </Button>
        </div>
      )}
    </div>
  )
}
