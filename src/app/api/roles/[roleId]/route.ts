import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

interface RouteParams {
  params: Promise<{ roleId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { roleId } = await params
    console.log('🛡️ Getting role:', roleId)
    
    const role = DatabaseService.getRole(roleId)
    
    if (!role) {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      role
    })
  } catch (error) {
    console.error('❌ Error getting role:', error)
    return NextResponse.json({
      success: false,
      error: (error && typeof error === 'object' && 'message' in error) ? (error as Error).message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { roleId } = await params
    const updates = await request.json()
    console.log('🛡️ Updating role:', roleId, updates)
    
    const updatedRole = DatabaseService.updateRole(roleId, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
    
    if (!updatedRole) {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      role: updatedRole
    })
  } catch (error) {
    console.error('❌ Error updating role:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { roleId } = await params
    console.log('🗑️ Deleting role:', roleId)
    
    const deleted = DatabaseService.deleteRole(roleId)
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting role:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
