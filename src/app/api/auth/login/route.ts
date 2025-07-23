import { NextRequest, NextResponse } from 'next/server'

// Simple JWT creation function
function createSimpleJWT(payload: any, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedHeader}.${encodedPayload}.signature`
}

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

    // Direct admin login check
    if (username === 'admin123' && password === 'Ankit@199899') {
      const adminUser = {
        id: 'admin-001',
        username: 'admin123',
        email: 'admin@whatsapp-pro.com',
        name: 'Admin User',
        role: 'admin',
        department: 'IT',
        permissions: ['*'],
        isActive: true,
        lastLogin: new Date().toISOString()
      }

      const token = createSimpleJWT({
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      }, 'your-secret-key')

      console.log('✅ Admin login successful')

      return NextResponse.json({
        success: true,
        user: adminUser,
        token
      })
    }

    // Check other demo users
    const demoUsers = [
      { username: 'manager1', password: 'manager123', role: 'manager', name: 'Team Manager' },
      { username: 'agent1', password: 'agent123', role: 'agent', name: 'Support Agent 1' },
      { username: 'agent2', password: 'agent123', role: 'agent', name: 'Support Agent 2' }
    ]

    const demoUser = demoUsers.find(u => u.username === username && u.password === password)
    if (demoUser) {
      const user = {
        id: `user-${Date.now()}`,
        username: demoUser.username,
        email: `${demoUser.username}@whatsapp-pro.com`,
        name: demoUser.name,
        role: demoUser.role,
        department: 'Customer Service',
        permissions: demoUser.role === 'manager' ? ['users.read', 'messages.read', 'analytics.read'] : ['messages.read'],
        isActive: true,
        lastLogin: new Date().toISOString()
      }

      const token = createSimpleJWT({
        userId: user.id,
        username: user.username,
        role: user.role,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
      }, 'your-secret-key')

      console.log('✅ Demo user login successful:', username)

      return NextResponse.json({
        success: true,
        user,
        token
      })
    }

    console.log('❌ Invalid credentials for:', username)
    return NextResponse.json({
      success: false,
      error: 'Invalid username or password'
    }, { status: 401 })

  } catch (error) {
    console.error('❌ Login error:', error)

    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 401 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed'
  }, { status: 405 })
}
