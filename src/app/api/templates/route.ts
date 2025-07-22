import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function GET() {
  try {
    console.log('📋 Getting all templates')
    
    const templates = DatabaseService.getAllTemplates()
    
    return NextResponse.json({
      success: true,
      templates: templates || []
    })
  } catch (error) {
    console.error('❌ Error getting templates:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const templateData = await request.json()
    console.log('📝 Creating template:', templateData)

    const template = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: templateData.name,
      category: templateData.category,
      type: templateData.type || 'text',
      content: templateData.content,
      variables: templateData.variables || [],
      language: templateData.language || 'en',
      status: templateData.status || 'active',
      createdBy: 'current_user', // In real app, get from auth
      tags: templateData.tags || [],
      // Media support
      mediaUrl: templateData.mediaUrl || null,
      mediaType: templateData.mediaType || null,
      mediaCaption: templateData.mediaCaption || null
    }

    const createdTemplate = DatabaseService.createTemplate(template)

    return NextResponse.json({
      success: true,
      template: createdTemplate
    })
  } catch (error) {
    console.error('❌ Error creating template:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const templateData = await request.json()
    console.log('✏️ Updating template:', templateData)

    if (!templateData.id) {
      return NextResponse.json({
        success: false,
        error: 'Template ID is required'
      }, { status: 400 })
    }

    const updatedTemplate = DatabaseService.updateTemplate(templateData.id, {
      name: templateData.name,
      category: templateData.category,
      type: templateData.type,
      content: templateData.content,
      variables: templateData.variables,
      language: templateData.language,
      status: templateData.status,
      tags: templateData.tags,
      mediaUrl: templateData.mediaUrl,
      mediaType: templateData.mediaType,
      mediaCaption: templateData.mediaCaption
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'Template ID is required'
      }, { status: 400 })
    }

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
