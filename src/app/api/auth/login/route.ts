import { NextRequest, NextResponse } from 'next/server'
import { authServiceInstance } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    console.log('🔐 Login attempt for username:', username)
    
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 })
    }
    
    const { user, token } = await authServiceInstance.login({ username, password })
    
    console.log('✅ Login successful for user:', user.username)
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      token
    })
    
  } catch (error) {
    console.error('❌ Login error:', error)
    
    return NextResponse.json({
      success: false,
      error: (error && typeof error === 'object' && 'message' in error) ? (error as Error).message : 'Login failed'
    }, { status: 401 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed'
  }, { status: 405 })
}
