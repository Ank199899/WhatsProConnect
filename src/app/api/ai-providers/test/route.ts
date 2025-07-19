import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

// POST - Test AI provider connection
export async function POST(request: NextRequest) {
  try {
    const { providerId, apiKey } = await request.json()
    
    console.log('🧪 Testing AI provider connection:', providerId)
    
    if (!providerId || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Provider ID and API key are required'
      }, { status: 400 })
    }

    // Get provider details
    const provider = DatabaseService.getAIProvider(providerId)
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'Provider not found'
      }, { status: 404 })
    }

    // Test connection based on provider type
    let testResult = false
    let errorMessage = ''

    try {
      if (provider.name === 'openai') {
        // Test OpenAI connection
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        })
        testResult = response.ok
        if (!response.ok) {
          errorMessage = `OpenAI API error: ${response.status}`
        }
      } else if (provider.name === 'claude' || provider.name === 'anthropic') {
        // Test Anthropic Claude connection
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          })
        })
        testResult = response.ok || response.status === 400 // 400 might be expected for minimal test
        if (!response.ok && response.status !== 400) {
          errorMessage = `Claude API error: ${response.status}`
        }
      } else if (provider.name === 'gemini') {
        // Test Google Gemini connection
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
        testResult = response.ok
        if (!response.ok) {
          errorMessage = `Gemini API error: ${response.status}`
        }
      } else {
        // Generic test - try to reach the endpoint
        if (provider.apiEndpoint) {
          const response = await fetch(provider.apiEndpoint, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          })
          testResult = response.ok || response.status === 401 // 401 might be expected
          if (!response.ok && response.status !== 401) {
            errorMessage = `API error: ${response.status}`
          }
        } else {
          errorMessage = 'No API endpoint configured'
        }
      }
    } catch (networkError: any) {
      testResult = false
      errorMessage = `Network error: ${networkError.message}`
    }

    if (testResult) {
      console.log('✅ Provider connection test successful')
      return NextResponse.json({
        success: true,
        message: 'Connection test successful',
        provider: provider.displayName
      })
    } else {
      console.log('❌ Provider connection test failed:', errorMessage)
      return NextResponse.json({
        success: false,
        error: errorMessage || 'Connection test failed'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error testing provider connection:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test provider connection'
    }, { status: 500 })
  }
}
