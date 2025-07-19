import crypto from 'crypto'

// AI Provider interfaces
export interface AIProvider {
  id: string
  name: string
  displayName: string
  description: string
  apiEndpoint: string
  supportedModels: string[]
  defaultModel: string
  requiresApiKey: boolean
  isActive: boolean
  configuration: Record<string, any>
}

export interface AIProviderKey {
  id: string
  providerId: string
  userId: string
  apiKeyEncrypted: string
  apiKeyHash: string
  additionalConfig: Record<string, any>
  isActive: boolean
}

export interface AIResponse {
  content: string
  model: string
  provider: string
  tokensUsed: number
  responseTime: number
  confidence: number
}

// Encryption utilities
const ENCRYPTION_KEY = process.env.AI_ENCRYPTION_KEY || 'default-key-change-in-production'
const ALGORITHM = 'aes-256-gcm'

export class EncryptionService {
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag?.()?.toString('hex') || ''
    }
  }

  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    
    if (encryptedData.tag) {
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
    }
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex')
  }
}

// AI Provider implementations
export class OpenAIProvider {
  static async generateResponse(
    prompt: string,
    apiKey: string,
    model: string = 'gpt-3.5-turbo',
    config: Record<string, any> = {}
  ): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens || 500,
          temperature: config.temperature || 0.7,
          ...config
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const responseTime = Date.now() - startTime

      return {
        content: data.choices[0]?.message?.content || '',
        model,
        provider: 'openai',
        tokensUsed: data.usage?.total_tokens || 0,
        responseTime,
        confidence: 0.9
      }
    } catch (error) {
      console.error('OpenAI Provider Error:', error)
      throw error
    }
  }
}

export class GeminiProvider {
  static async generateResponse(
    prompt: string,
    apiKey: string,
    model: string = 'gemini-pro',
    config: Record<string, any> = {}
  ): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens: config.maxTokens || 500,
            temperature: config.temperature || 0.7,
            ...config
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json()
      const responseTime = Date.now() - startTime

      return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        model,
        provider: 'gemini',
        tokensUsed: data.usageMetadata?.totalTokenCount || 0,
        responseTime,
        confidence: 0.85
      }
    } catch (error) {
      console.error('Gemini Provider Error:', error)
      throw error
    }
  }
}

export class ClaudeProvider {
  static async generateResponse(
    prompt: string,
    apiKey: string,
    model: string = 'claude-3-sonnet-20240229',
    config: Record<string, any> = {}
  ): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: config.maxTokens || 500,
          temperature: config.temperature || 0.7,
          messages: [{ role: 'user', content: prompt }],
          ...config
        })
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const data = await response.json()
      const responseTime = Date.now() - startTime

      return {
        content: data.content?.[0]?.text || '',
        model,
        provider: 'claude',
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
        responseTime,
        confidence: 0.9
      }
    } catch (error) {
      console.error('Claude Provider Error:', error)
      throw error
    }
  }
}

// Main AI Provider Service
export class AIProviderService {
  static async generateResponse(
    prompt: string,
    providerId: string,
    model: string,
    apiKey: string,
    config: Record<string, any> = {}
  ): Promise<AIResponse> {
    switch (providerId) {
      case 'openai':
        return OpenAIProvider.generateResponse(prompt, apiKey, model, config)
      case 'gemini':
        return GeminiProvider.generateResponse(prompt, apiKey, model, config)
      case 'claude':
        return ClaudeProvider.generateResponse(prompt, apiKey, model, config)
      default:
        throw new Error(`Unsupported AI provider: ${providerId}`)
    }
  }

  static getDefaultProviders(): Omit<AIProvider, 'id'>[] {
    return [
      {
        name: 'openai',
        displayName: 'OpenAI',
        description: 'GPT models from OpenAI including GPT-3.5 and GPT-4',
        apiEndpoint: 'https://api.openai.com/v1',
        supportedModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
        defaultModel: 'gpt-3.5-turbo',
        requiresApiKey: true,
        isActive: true,
        configuration: {
          maxTokens: 500,
          temperature: 0.7,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      },
      {
        name: 'gemini',
        displayName: 'Google Gemini',
        description: 'Google\'s Gemini AI models',
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
        supportedModels: ['gemini-pro', 'gemini-pro-vision'],
        defaultModel: 'gemini-pro',
        requiresApiKey: true,
        isActive: true,
        configuration: {
          maxTokens: 500,
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        }
      },
      {
        name: 'claude',
        displayName: 'Anthropic Claude',
        description: 'Claude AI models from Anthropic',
        apiEndpoint: 'https://api.anthropic.com/v1',
        supportedModels: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        defaultModel: 'claude-3-sonnet-20240229',
        requiresApiKey: true,
        isActive: true,
        configuration: {
          maxTokens: 500,
          temperature: 0.7
        }
      }
    ]
  }
}
