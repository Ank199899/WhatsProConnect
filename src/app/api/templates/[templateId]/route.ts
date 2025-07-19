import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

interface RouteParams {
  params: Promise<{ templateId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { templateId } = await params
    console.log('📋 Getting template:', templateId)
    
    const template = DatabaseService.getTemplate(templateId)
    
    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('❌ Error getting template:', error)
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
    const { templateId } = await params
    const updates = await request.json()
    console.log('📝 Updating template:', templateId, updates)

    const updatedTemplate = DatabaseService.updateTemplate(templateId, {
      ...updates,
      updatedAt: new Date().toISOString()
    })

    if (!updatedTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    })
  } catch (error) {
    console.error('❌ Error updating template:', error)
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
    const { templateId } = await params
    console.log('🗑️ Deleting template:', templateId)

    const deleted = DatabaseService.deleteTemplate(templateId)

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting template:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


