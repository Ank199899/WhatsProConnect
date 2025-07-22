'use client'

import { useState } from 'react'
import { authServiceInstance } from '@/lib/auth'

export default function DebugPage() {
  const [output, setOutput] = useState<string>('')

  const debugUsers = () => {
    console.log('=== MANUAL DEBUG ===')
    authServiceInstance.debugUsers()
    
    const users = Array.from((authServiceInstance as any).users.values())
    const adminPassword = (authServiceInstance as any).adminPassword
    
    const debugInfo = {
      totalUsers: users.length,
      adminPassword: adminPassword,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive
      }))
    }
    
    setOutput(JSON.stringify(debugInfo, null, 2))
  }

  const testLogin = async () => {
    try {
      const result = await authServiceInstance.login({
        username: 'ankit1999899',
        password: 'Ankit@9718577453'
      })
      setOutput('Login successful: ' + JSON.stringify(result, null, 2))
    } catch (error) {
      setOutput('Login failed: ' + (error as Error).message)
    }
  }

  const createTestAdmin = async () => {
    try {
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      setOutput('Admin creation result: ' + JSON.stringify(result, null, 2))
    } catch (error) {
      setOutput('Admin creation failed: ' + (error as Error).message)
    }
  }

  const checkUsersAPI = async () => {
    try {
      const response = await fetch('/api/create-admin')
      const result = await response.json()
      setOutput('Users from API: ' + JSON.stringify(result, null, 2))
    } catch (error) {
      setOutput('API check failed: ' + (error as Error).message)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Auth Service</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={debugUsers}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Debug Users
        </button>
        
        <button
          onClick={testLogin}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-4"
        >
          Test Login (ankit1999899)
        </button>
        
        <button
          onClick={createTestAdmin}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 ml-4"
        >
          Create Admin (API)
        </button>

        <button
          onClick={checkUsersAPI}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 ml-4"
        >
          Check Users (API)
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Output:</h2>
        <pre className="whitespace-pre-wrap text-sm">{output}</pre>
      </div>
      
      <div className="mt-6 bg-yellow-100 p-4 rounded">
        <h2 className="font-bold mb-2">Current Admin Credentials:</h2>
        <p><strong>Username:</strong> ankit1999899</p>
        <p><strong>Password:</strong> Ankit@9718577453</p>
      </div>
    </div>
  )
}
