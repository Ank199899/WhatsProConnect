import { NextRequest, NextResponse } from 'next/server'
import { authServiceInstance } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Create admin user directly
    const adminUser = {
      id: 'admin-001',
      username: 'admin123',
      email: 'admin@whatsapp-pro.com',
      password: 'Ankit@199899',
      name: 'Admin User',
      role: 'admin' as const,
      department: 'IT',
      permissions: ['*'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Access private users map
    const usersMap = (authServiceInstance as any).users
    usersMap.set(adminUser.id, adminUser)

    // Set admin password
    ;(authServiceInstance as any).adminPassword = 'Ankit@199899'

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Debug endpoint to check users
    const usersMap = (authServiceInstance as any).users
    const adminPassword = (authServiceInstance as any).adminPassword
    
    const users = Array.from(usersMap.values()).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive
    }))

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      adminPassword,
      users
    })
  } catch (error) {
    console.error('Error getting users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get users' },
      { status: 500 }
    )
  }
}
