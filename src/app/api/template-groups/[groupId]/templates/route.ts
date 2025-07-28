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
    console.log('📋 Getting templates for group:', groupId)
    
    const templates = await DatabaseService.getTemplatesByGroup(groupId)
    
    return NextResponse.json({
      success: true,
      templates: templates || []
    })
  } catch (error) {
    console.error('❌ Error getting templates for group:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { groupId } = await params
    const { templateId } = await request.json()
    
    console.log('📝 Assigning template to group:', templateId, groupId)

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'Template ID is required'
      }, { status: 400 })
    }

    const success = await DatabaseService.assignTemplateToGroup(templateId, groupId)

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to assign template to group'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template assigned to group successfully'
    })
  } catch (error) {
    console.error('❌ Error assigning template to group:', error)
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
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'Template ID is required'
      }, { status: 400 })
    }

    console.log('🗑️ Removing template from group:', templateId, groupId)

    const success = await DatabaseService.removeTemplateFromGroup(templateId)

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to remove template from group'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template removed from group successfully'
    })
  } catch (error) {
    console.error('❌ Error removing template from group:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
