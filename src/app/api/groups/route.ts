import { NextRequest, NextResponse } from 'next/server'
import { ServerDatabaseService } from '@/lib/database-server'

export async function GET() {
  try {
    console.log('📁 Getting all groups from database server')

    const dbService = new ServerDatabaseService()
    const groups = await dbService.getAllGroups()

    console.log(`📋 Retrieved ${groups.length} groups from database`)

    return NextResponse.json({
      success: true,
      groups: groups
    })
  } catch (error) {
    console.error('❌ Error getting groups from database:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const groupData = await request.json()
    console.log('📁 Saving group to database:', groupData)

    const dbService = new ServerDatabaseService()
    const savedGroup = await dbService.saveGroup({
      id: groupData.id,
      name: groupData.name,
      description: groupData.description || '',
      color: groupData.color || 'bg-blue-500',
      icon: groupData.icon || 'Folder',
      contactCount: groupData.contactCount || 0,
      isDefault: groupData.isDefault || false
    })

    // Convert to frontend format
    const frontendGroup = {
      id: savedGroup.id,
      name: savedGroup.name,
      description: savedGroup.description,
      color: savedGroup.color,
      icon: savedGroup.icon,
      contactCount: savedGroup.contact_count,
      createdAt: savedGroup.created_at,
      updatedAt: savedGroup.updated_at,
      isDefault: savedGroup.is_default
    }

    console.log('✅ Group saved to database:', savedGroup.name)

    return NextResponse.json({
      success: true,
      group: frontendGroup
    })
  } catch (error) {
    console.error('❌ Error saving group to database:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const groupId = url.searchParams.get('id')

    if (!groupId) {
      return NextResponse.json({
        success: false,
        error: 'Group ID is required'
      }, { status: 400 })
    }

    console.log('🗑️ Deleting group from database:', groupId)

    const dbService = new ServerDatabaseService()
    const deleted = await dbService.deleteGroup(groupId)

    if (deleted) {
      console.log('✅ Group deleted from database:', groupId)

      return NextResponse.json({
        success: true,
        message: 'Group deleted successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Group not found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('❌ Error deleting group:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
