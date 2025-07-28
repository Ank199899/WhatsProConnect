import { NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function POST() {
  try {
    console.log('🧹 Clearing all templates and groups')
    
    const result = DatabaseService.clearAllTemplates()
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'All templates and groups cleared successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to clear templates'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error clearing templates:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
