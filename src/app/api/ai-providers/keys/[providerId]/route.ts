import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

interface RouteParams {
  params: {
    providerId: string
  }
}

// DELETE - Delete API key for provider
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { providerId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || 'default'
    
    console.log('🔑 Deleting API key for provider:', providerId)
    
    const deleted = DatabaseService.deleteProviderAPIKey(providerId, userId)
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'API key not found'
      }, { status: 404 })
    }
    
    console.log('✅ API key deleted successfully')
    
    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting API key:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete API key'
    }, { status: 500 })
  }
}
