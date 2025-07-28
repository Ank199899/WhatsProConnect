import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function GET() {
  try {
    console.log('📁 Getting all template groups with templates')

    const groups = await DatabaseService.getAllTemplateGroups()

    // Get template count and templates for each group
    const groupsWithTemplates = await Promise.all(
      groups.map(async (group) => {
        const templates = await DatabaseService.getTemplatesByGroup(group.id)
        return {
          ...group,
          template_count: templates.length,
          templates: templates
        }
      })
    )

    return NextResponse.json({
      success: true,
      groups: groupsWithTemplates || []
    })
  } catch (error) {
    console.error('❌ Error getting template groups:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const groupData = await request.json()
    console.log('📝 Creating template group:', groupData)

    const group = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: groupData.name,
      description: groupData.description || '',
      color: groupData.color || '#3B82F6',
      icon: groupData.icon || 'folder',
      is_active: true,
      template_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'current_user' // In real app, get from auth
    }

    const createdGroup = await DatabaseService.createTemplateGroup(group)

    return NextResponse.json({
      success: true,
      group: createdGroup
    })
  } catch (error) {
    console.error('❌ Error creating template group:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const groupData = await request.json()
    console.log('✏️ Updating template group:', groupData)

    if (!groupData.id) {
      return NextResponse.json({
        success: false,
        error: 'Group ID is required'
      }, { status: 400 })
    }

    const updatedGroup = await DatabaseService.updateTemplateGroup(groupData.id, {
      name: groupData.name,
      description: groupData.description,
      color: groupData.color,
      icon: groupData.icon,
      is_active: groupData.is_active,
      updated_at: new Date().toISOString()
    })

    if (!updatedGroup) {
      return NextResponse.json({
        success: false,
        error: 'Group not found'
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')

    if (!groupId) {
      return NextResponse.json({
        success: false,
        error: 'Group ID is required'
      }, { status: 400 })
    }

    console.log('🗑️ Deleting template group:', groupId)

    const deleted = await DatabaseService.deleteTemplateGroup(groupId)

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Group not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting template group:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
