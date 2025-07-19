import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'
import { AIProviderService } from '@/lib/ai-providers'

// GET - Get all AI providers
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Getting all AI providers')
    
    let providers = DatabaseService.getAllAIProviders()
    
    // If no providers exist, create default ones
    if (providers.length === 0) {
      console.log('🔧 Creating default AI providers')
      const defaultProviders = AIProviderService.getDefaultProviders()
      
      for (const providerData of defaultProviders) {
        const providerId = `provider_${providerData.name}_${Date.now()}`
        DatabaseService.createAIProvider({
          id: providerId,
          ...providerData
        })
      }
      
      providers = DatabaseService.getAllAIProviders()
    }
    
    // Check which providers have API keys
    const providersWithKeyStatus = providers.map(provider => {
      const hasApiKey = DatabaseService.getProviderAPIKey(provider.id) !== null
      return {
        ...provider,
        hasApiKey
      }
    })
    
    console.log('✅ Retrieved AI providers:', providers.length)
    
    return NextResponse.json({
      success: true,
      providers: providersWithKeyStatus
    })
  } catch (error) {
    console.error('❌ Error getting AI providers:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get AI providers'
    }, { status: 500 })
  }
}

// POST - Create new AI provider
export async function POST(request: NextRequest) {
  try {
    const providerData = await request.json()
    
    console.log('🔧 Creating AI provider:', providerData.displayName)
    
    // Generate ID for the provider
    const providerId = `provider_${providerData.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newProvider = DatabaseService.createAIProvider({
      id: providerId,
      name: providerData.name,
      displayName: providerData.displayName,
      description: providerData.description || '',
      apiEndpoint: providerData.apiEndpoint || '',
      supportedModels: providerData.supportedModels || [],
      defaultModel: providerData.defaultModel || '',
      requiresApiKey: providerData.requiresApiKey !== false,
      isActive: providerData.isActive !== false,
      configuration: providerData.configuration || {}
    })
    
    console.log('✅ AI provider created successfully:', newProvider.id)
    
    return NextResponse.json({
      success: true,
      provider: newProvider
    })
  } catch (error) {
    console.error('❌ Error creating AI provider:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create AI provider'
    }, { status: 500 })
  }
}

// DELETE - Delete AI provider
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('id')

    if (!providerId) {
      return NextResponse.json({
        success: false,
        error: 'Provider ID is required'
      }, { status: 400 })
    }

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
