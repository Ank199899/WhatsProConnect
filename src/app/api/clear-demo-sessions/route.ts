import { NextRequest, NextResponse } from 'next/server'
import { clearDemoSessions } from '@/lib/sessionStorage'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clearing all demo sessions...')
    
    clearDemoSessions()
    
    console.log('✅ All demo sessions cleared successfully')
    
    return NextResponse.json({
      success: true,
      message: 'All demo sessions cleared successfully'
    })
  } catch (error) {
    console.error('❌ Error clearing demo sessions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear demo sessions',
        message: error.message
      },
      { status: 500 }
    )
  }
}
