import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'
import { EncryptionService } from '@/lib/ai-providers'

// GET - Get all API keys for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || 'default'
    
    console.log('🔑 Getting API keys for user:', userId)
    
    const keys = DatabaseService.getAllProviderAPIKeys(userId)
    
    // Remove sensitive data from response
    const safeKeys = keys.map(key => ({
      id: key.id,
      providerId: key.provider_id,
      providerName: key.provider_name,
      isActive: key.isActive,
      createdAt: key.created_at,
      hasKey: true // Just indicate that key exists
    }))
    
    console.log('✅ Retrieved API keys:', safeKeys.length)
    
    return NextResponse.json({
      success: true,
      keys: safeKeys
    })
  } catch (error) {
    console.error('❌ Error getting API keys:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get API keys'
    }, { status: 500 })
  }
}

// POST - Save new API key
export async function POST(request: NextRequest) {
  try {
    const { providerId, apiKey, userId = 'default', additionalConfig = {} } = await request.json()
    
    console.log('🔑 Saving API key for provider:', providerId)
    
    if (!providerId || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Provider ID and API key are required'
      }, { status: 400 })
    }
    
    // Encrypt the API key
    const encryptedData = EncryptionService.encrypt(apiKey)
    const apiKeyHash = EncryptionService.hash(apiKey)
    
    const keyData = {
      providerId,
      userId,
      apiKeyEncrypted: JSON.stringify(encryptedData),
      apiKeyHash,
      additionalConfig,
      isActive: true
    }
    
    const savedKey = DatabaseService.saveProviderAPIKey(keyData)
    
    console.log('✅ API key saved successfully')
    
    // Return safe response without sensitive data
    return NextResponse.json({
      success: true,
      key: {
        id: savedKey.id,
        providerId: savedKey.provider_id,
        isActive: savedKey.isActive,
        createdAt: savedKey.created_at
      }
    })
  } catch (error) {
    console.error('❌ Error saving API key:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save API key'
    }, { status: 500 })
  }
}
