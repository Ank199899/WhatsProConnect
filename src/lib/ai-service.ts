'use client'

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import DatabaseService from './database'
import { AIProviderService, EncryptionService } from './ai-providers'

export interface AIResponse {
  message: string
  confidence: number
  sentiment?: 'positive' | 'negative' | 'neutral'
  category?: string
  suggestedActions?: string[]
}

export interface MessageAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  category: string
  keywords: string[]
  intent: string
  urgency: 'low' | 'medium' | 'high'
  suggestedResponse?: string
}

class AIService {
  private openai: OpenAI | null = null
  private gemini: GoogleGenerativeAI | null = null

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      })
    }

    // Initialize Gemini if API key is available
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
    }
  }

  // Generate AI response using configured providers
  async generateResponse(
    message: string,
    context: string[] = [],
    personality: string = 'helpful',
    agentId?: string,
    sessionId?: string
  ): Promise<AIResponse> {
    try {
      // If agent ID is provided, use agent's configured provider
      if (agentId) {
        const agentProviders = DatabaseService.getAgentProviders(agentId)

        for (const agentProvider of agentProviders) {
          try {
            const provider = DatabaseService.getAIProvider(agentProvider.provider_id)
            const apiKey = DatabaseService.getProviderAPIKey(agentProvider.provider_id)

            if (provider && apiKey) {
              // Decrypt API key
              const encryptedData = JSON.parse(apiKey.api_key_encrypted)
              const decryptedKey = EncryptionService.decrypt(encryptedData)

              // Generate response using provider
              const aiResponse = await AIProviderService.generateResponse(
                this.buildPrompt(message, context, personality),
                provider.name,
                agentProvider.model_name || provider.defaultModel,
                decryptedKey,
                provider.configuration
              )

              // Log the response
              if (sessionId) {
                this.logAIResponse(agentId, sessionId, message, aiResponse)
              }

              return {
                message: aiResponse.content,
                confidence: aiResponse.confidence,
                sentiment: 'neutral',
                category: 'general',
                suggestedActions: []
              }
            }
          } catch (providerError) {
            console.error(`Provider ${agentProvider.provider_id} failed:`, providerError)
            // Continue to next provider
          }
        }
      }

      // Fallback to legacy providers
      if (this.openai) {
        return await this.generateOpenAIResponse(message, context, personality)
      }

      if (this.gemini) {
        return await this.generateGeminiResponse(message, context, personality)
      }

      // Final fallback to rule-based response
      return this.generateRuleBasedResponse(message)
    } catch (error) {
      console.error('AI response generation failed:', error)
      return this.generateRuleBasedResponse(message)
    }
  }

  private buildPrompt(message: string, context: string[], personality: string): string {
    const systemPrompt = this.getSystemPrompt(personality)
    const contextString = context.length > 0 ? `Previous messages: ${context.join('\n')}` : ''

    return `${systemPrompt}\n\n${contextString}\n\nCurrent message: ${message}\n\nPlease provide a helpful response:`
  }

  private logAIResponse(agentId: string, sessionId: string, originalMessage: string, aiResponse: any) {
    try {
      const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      DatabaseService.db.prepare(`
        INSERT INTO ai_agent_responses
        (id, agent_id, session_id, contact_number, original_message, ai_response,
         response_time_ms, confidence_score, provider_used, model_used, tokens_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        responseId,
        agentId,
        sessionId,
        'unknown', // We'll need to pass this from the calling context
        originalMessage,
        aiResponse.content,
        aiResponse.responseTime,
        aiResponse.confidence,
        aiResponse.provider,
        aiResponse.model,
        aiResponse.tokensUsed
      )
    } catch (error) {
      console.error('Error logging AI response:', error)
    }
  }

  private async generateOpenAIResponse(
    message: string, 
    context: string[], 
    personality: string
  ): Promise<AIResponse> {
    const systemPrompt = this.getSystemPrompt(personality)
    const contextString = context.length > 0 ? `Previous messages: ${context.join('\n')}` : ''
    
    const response = await this.openai!.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${contextString}\n\nCurrent message: ${message}` }
      ],
      max_tokens: 150,
      temperature: 0.7
    })

    const aiMessage = response.choices[0]?.message?.content || 'I understand your message.'
    const sentiment = await this.analyzeSentiment(message)

    return {
      message: aiMessage,
      confidence: 0.9,
      sentiment: sentiment.sentiment,
      category: sentiment.category,
      suggestedActions: this.getSuggestedActions(sentiment)
    }
  }

  private async generateGeminiResponse(
    message: string, 
    context: string[], 
    personality: string
  ): Promise<AIResponse> {
    const model = this.gemini!.getGenerativeModel({ model: 'gemini-pro' })
    const systemPrompt = this.getSystemPrompt(personality)
    const contextString = context.length > 0 ? `Previous messages: ${context.join('\n')}` : ''
    
    const prompt = `${systemPrompt}\n\n${contextString}\n\nCurrent message: ${message}\n\nPlease provide a helpful response:`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const aiMessage = response.text() || 'I understand your message.'
    
    const sentiment = await this.analyzeSentiment(message)

    return {
      message: aiMessage,
      confidence: 0.85,
      sentiment: sentiment.sentiment,
      category: sentiment.category,
      suggestedActions: this.getSuggestedActions(sentiment)
    }
  }

  private generateRuleBasedResponse(message: string): AIResponse {
    const lowerMessage = message.toLowerCase()
    let response = 'Thank you for your message. How can I help you?'
    let category = 'general'

    // Simple rule-based responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = 'Hello! How can I assist you today?'
      category = 'greeting'
    } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      response = 'You\'re welcome! Is there anything else I can help you with?'
      category = 'gratitude'
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      response = 'I\'m here to help! What specific assistance do you need?'
      category = 'support'
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('payment')) {
      response = 'I\'d be happy to help you with pricing information. Let me get those details for you.'
      category = 'pricing'
    } else if (lowerMessage.includes('order') || lowerMessage.includes('purchase') || lowerMessage.includes('buy')) {
      response = 'Great! I can help you with your order. What would you like to purchase?'
      category = 'sales'
    } else if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('error')) {
      response = 'I understand you\'re experiencing an issue. Let me help you resolve this quickly.'
      category = 'support'
    }

    const sentiment = this.getBasicSentiment(message)

    return {
      message: response,
      confidence: 0.7,
      sentiment: sentiment.sentiment,
      category,
      suggestedActions: this.getSuggestedActions(sentiment)
    }
  }

  // Analyze message sentiment and extract insights
  async analyzeSentiment(message: string): Promise<MessageAnalysis> {
    try {
      const sentiment = this.getBasicSentiment(message)
      const keywords = this.extractKeywords(message)
      const intent = this.detectIntent(message)
      const urgency = this.detectUrgency(message)
      const category = this.categorizeMessage(message)

      return {
        sentiment: sentiment.sentiment,
        score: sentiment.score,
        category,
        keywords,
        intent,
        urgency,
        suggestedResponse: await this.generateSuggestedResponse(message, intent, sentiment.sentiment)
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error)
      return {
        sentiment: 'neutral',
        score: 0,
        category: 'general',
        keywords: [],
        intent: 'unknown',
        urgency: 'low'
      }
    }
  }

  private getBasicSentiment(message: string): { sentiment: 'positive' | 'negative' | 'neutral', score: number } {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'satisfied', 'perfect', 'awesome']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'problem', 'issue', 'error', 'wrong']
    
    const words = message.toLowerCase().split(/\s+/)
    let positiveCount = 0
    let negativeCount = 0

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++
      if (negativeWords.includes(word)) negativeCount++
    })

    if (positiveCount > negativeCount) {
      return { sentiment: 'positive', score: (positiveCount / words.length) * 100 }
    } else if (negativeCount > positiveCount) {
      return { sentiment: 'negative', score: (negativeCount / words.length) * 100 }
    } else {
      return { sentiment: 'neutral', score: 0 }
    }
  }

  private extractKeywords(message: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']
    
    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10) // Top 10 keywords
  }

  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('buy') || lowerMessage.includes('purchase') || lowerMessage.includes('order')) {
      return 'purchase'
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assist')) {
      return 'support'
    } else if (lowerMessage.includes('info') || lowerMessage.includes('information') || lowerMessage.includes('details')) {
      return 'information'
    } else if (lowerMessage.includes('complain') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
      return 'complaint'
    } else if (lowerMessage.includes('cancel') || lowerMessage.includes('refund') || lowerMessage.includes('return')) {
      return 'cancellation'
    } else {
      return 'general'
    }
  }

  private detectUrgency(message: string): 'low' | 'medium' | 'high' {
    const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'important']
    const mediumWords = ['soon', 'quick', 'fast', 'priority']
    
    const lowerMessage = message.toLowerCase()
    
    if (urgentWords.some(word => lowerMessage.includes(word))) {
      return 'high'
    } else if (mediumWords.some(word => lowerMessage.includes(word))) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  private categorizeMessage(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('payment')) {
      return 'pricing'
    } else if (lowerMessage.includes('delivery') || lowerMessage.includes('shipping')) {
      return 'logistics'
    } else if (lowerMessage.includes('product') || lowerMessage.includes('item') || lowerMessage.includes('service')) {
      return 'product'
    } else if (lowerMessage.includes('account') || lowerMessage.includes('login') || lowerMessage.includes('password')) {
      return 'account'
    } else if (lowerMessage.includes('technical') || lowerMessage.includes('bug') || lowerMessage.includes('error')) {
      return 'technical'
    } else {
      return 'general'
    }
  }

  private async generateSuggestedResponse(message: string, intent: string, sentiment: string): Promise<string> {
    const responses: { [key: string]: { [key: string]: string[] } } = {
      purchase: {
        positive: ['Great choice! I can help you complete your purchase.', 'Excellent! Let me guide you through the ordering process.'],
        negative: ['I understand your concerns. Let me address them before we proceed.', 'I\'d like to help resolve any issues you have about this purchase.'],
        neutral: ['I can help you with your purchase. What would you like to know?', 'Let me assist you with the ordering process.']
      },
      support: {
        positive: ['I\'m glad you reached out! How can I help you today?', 'Thank you for contacting us. What assistance do you need?'],
        negative: ['I\'m sorry you\'re experiencing difficulties. Let me help resolve this immediately.', 'I understand your frustration. Let me fix this for you right away.'],
        neutral: ['I\'m here to help. What specific support do you need?', 'How can I assist you today?']
      },
      complaint: {
        positive: ['Thank you for bringing this to our attention. We appreciate your feedback.', 'I\'m glad you shared this with us. Let me address your concerns.'],
        negative: ['I sincerely apologize for this experience. Let me make this right immediately.', 'I\'m very sorry about this issue. I\'ll resolve it as quickly as possible.'],
        neutral: ['Thank you for reaching out. I\'ll look into this matter for you.', 'I understand your concern. Let me investigate this for you.']
      }
    }

    const intentResponses = responses[intent] || responses.support
    const sentimentResponses = intentResponses[sentiment] || intentResponses.neutral
    
    return sentimentResponses[Math.floor(Math.random() * sentimentResponses.length)]
  }

  private getSuggestedActions(sentiment: { sentiment: string, score: number }): string[] {
    const actions: string[] = []

    if (sentiment.sentiment === 'negative') {
      actions.push('Escalate to supervisor', 'Offer compensation', 'Schedule follow-up call')
    } else if (sentiment.sentiment === 'positive') {
      actions.push('Ask for review', 'Suggest related products', 'Thank customer')
    } else {
      actions.push('Provide more information', 'Ask clarifying questions', 'Offer assistance')
    }

    return actions
  }

  private getSystemPrompt(personality: string): string {
    const prompts: { [key: string]: string } = {
      helpful: 'You are a helpful and friendly customer service assistant. Respond professionally and courteously.',
      professional: 'You are a professional business assistant. Provide clear, concise, and formal responses.',
      casual: 'You are a friendly and casual assistant. Use a conversational tone while being helpful.',
      technical: 'You are a technical support specialist. Provide detailed and accurate technical assistance.'
    }

    return prompts[personality] || prompts.helpful
  }

  // Auto-reply system
  async shouldAutoReply(message: string, senderInfo: any): Promise<boolean> {
    // Don't auto-reply to certain types of messages
    if (message.length < 3) return false
    if (message.includes('stop') || message.includes('unsubscribe')) return false
    
    // Auto-reply during business hours or for urgent messages
    const now = new Date()
    const hour = now.getHours()
    const isBusinessHours = hour >= 9 && hour <= 17
    
    const analysis = await this.analyzeSentiment(message)
    const isUrgent = analysis.urgency === 'high'
    
    return !isBusinessHours || isUrgent || analysis.intent === 'support'
  }

  // Smart message categorization
  categorizeMessages(messages: any[]): { [category: string]: any[] } {
    const categories: { [category: string]: any[] } = {
      urgent: [],
      sales: [],
      support: [],
      general: [],
      spam: []
    }

    messages.forEach(message => {
      const category = this.categorizeMessage(message.body)
      const urgency = this.detectUrgency(message.body)
      
      if (urgency === 'high') {
        categories.urgent.push(message)
      } else if (category === 'pricing' || this.detectIntent(message.body) === 'purchase') {
        categories.sales.push(message)
      } else if (this.detectIntent(message.body) === 'support') {
        categories.support.push(message)
      } else {
        categories.general.push(message)
      }
    })

    return categories
  }
}

export const aiService = new AIService()
