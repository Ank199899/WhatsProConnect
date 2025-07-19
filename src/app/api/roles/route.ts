import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function GET() {
  try {
    console.log('🛡️ Getting all roles')
    
    const roles = DatabaseService.getAllRoles()
    
    return NextResponse.json({
      success: true,
      roles: roles || []
    })
  } catch (error) {
    console.error('❌ Error getting roles:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const roleData = await request.json()
    console.log('🛡️ Creating role:', roleData)
    
    const role = {
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions || [],
      userCount: 0,
      isSystem: false,
      isActive: roleData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user', // In real app, get from auth
      color: roleData.color || '#3B82F6',
      priority: roleData.priority || 999
    }
    
    const createdRole = DatabaseService.createRole(role)
    
    return NextResponse.json({
      success: true,
      role: createdRole
    })
  } catch (error) {
    console.error('❌ Error creating role:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
