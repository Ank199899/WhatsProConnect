import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

// GET - Get specific AI provider
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id
    console.log('🔧 Getting AI provider:', providerId)
    
    const provider = DatabaseService.getAIProvider(providerId)
    
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'Provider not found'
      }, { status: 404 })
    }

    // Check if provider has API key
    const hasApiKey = DatabaseService.getProviderAPIKey(providerId) !== null
    
    console.log('✅ Retrieved AI provider:', provider.displayName)
    
    return NextResponse.json({
      success: true,
      provider: {
        ...provider,
        hasApiKey
      }
    })
  } catch (error) {
    console.error('❌ Error getting AI provider:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get AI provider'
    }, { status: 500 })
  }
}

// PATCH - Update AI provider
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id
    const updates = await request.json()
    
    console.log('🔧 Updating AI provider:', providerId)
    
    const updatedProvider = DatabaseService.updateAIProvider(providerId, updates)
    
    if (!updatedProvider) {
      return NextResponse.json({
        success: false,
        error: 'Provider not found'
      }, { status: 404 })
    }
    
    console.log('✅ AI provider updated successfully')
    
    return NextResponse.json({
      success: true,
      provider: updatedProvider
    })
  } catch (error) {
    console.error('❌ Error updating AI provider:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update AI provider'
    }, { status: 500 })
  }
}

// DELETE - Delete AI provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id
    
    console.log('🗑️ Deleting AI provider:', providerId)
    
    const deleted = DatabaseService.deleteAIProvider(providerId)
    
    if (deleted) {
      console.log('✅ AI provider deleted successfully')
      return NextResponse.json({
        success: true,
        message: 'Provider deleted successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Provider not found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('❌ Error deleting AI provider:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete AI provider'
    }, { status: 500 })
  }
}
