import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

interface RouteParams {
  params: Promise<{ groupId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { groupId } = await params
    console.log('📋 Getting template group:', groupId)
    
    const group = await DatabaseService.getTemplateGroup(groupId)
    
    if (!group) {
      return NextResponse.json({
        success: false,
        error: 'Template group not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      group
    })
  } catch (error) {
    console.error('❌ Error getting template group:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { groupId } = await params
    const updates = await request.json()
    console.log('📝 Updating template group:', groupId, updates)

    const updatedGroup = await DatabaseService.updateTemplateGroup(groupId, {
      ...updates,
      updated_at: new Date().toISOString()
    })

    if (!updatedGroup) {
      return NextResponse.json({
        success: false,
        error: 'Template group not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      group: updatedGroup
    })
  } catch (error) {
    console.error('❌ Error updating template group:', error)
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
    const { groupId } = await params
    console.log('🗑️ Deleting template group:', groupId)

    const deleted = await DatabaseService.deleteTemplateGroup(groupId)

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Template group not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template group deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting template group:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
