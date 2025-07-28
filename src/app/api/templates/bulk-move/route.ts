import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { templateIds, groupId } = await request.json()
    
    if (!templateIds || !Array.isArray(templateIds)) {
      return NextResponse.json({
        success: false,
        error: 'Template IDs array is required'
      }, { status: 400 })
    }

    console.log('🔄 Moving templates to group:', { templateIds, groupId })

    let movedCount = 0
    const errors = []

    for (const templateId of templateIds) {
      try {
        const template = await DatabaseService.getTemplate(templateId)
        if (template) {
          const updated = DatabaseService.updateTemplate(templateId, {
            ...template,
            group_id: groupId || null,
            updated_at: new Date().toISOString()
          })
          if (updated) movedCount++
        } else {
          errors.push(`Template ${templateId} not found`)
        }
      } catch (error) {
        errors.push(`Error moving template ${templateId}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${movedCount} templates moved successfully`,
      movedCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('❌ Error moving templates:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
