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
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user', // In real app, get from auth
      usageCount: 0,
      rating: 0,
      tags: templateData.tags || []
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
