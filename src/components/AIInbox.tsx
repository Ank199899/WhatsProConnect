'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Send, 
  Bot,
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Sparkles,
  MessageSquare,
  BarChart3,
  Settings,
  Play,
  Pause
} from 'lucide-react'
import { aiService, MessageAnalysis } from '@/lib/ai-service'
import Card, { CardContent, CardHeader } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import { cn, formatTime, getTimeAgo } from '@/lib/utils'

interface AIMessage {
  id: string
  from: string
  to: string
  body: string
  timestamp: string
  type: 'incoming' | 'outgoing'
  analysis?: MessageAnalysis
  aiResponse?: string
  isAutoReply?: boolean
}

interface AIChat {
  contact: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  sentiment: 'positive' | 'negative' | 'neutral'
  urgency: 'low' | 'medium' | 'high'
  category: string
  aiSuggestion?: string
}

const urgencyColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}

const sentimentColors = {
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral: 'text-gray-600'
}

export default function AIInbox() {
  const [chats, setChats] = useState<AIChat[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const categories = [
    { id: 'all', label: 'All Messages', count: chats.length },
    { id: 'urgent', label: 'Urgent', count: chats.filter(c => c.urgency === 'high').length },
    { id: 'sales', label: 'Sales', count: chats.filter(c => c.category === 'pricing').length },
    { id: 'support', label: 'Support', count: chats.filter(c => c.category === 'support').length },
    { id: 'positive', label: 'Positive', count: chats.filter(c => c.sentiment === 'positive').length },
    { id: 'negative', label: 'Negative', count: chats.filter(c => c.sentiment === 'negative').length }
  ]

  useEffect(() => {
    loadAIChats()
  }, [])

  const loadAIChats = async () => {
    try {
      setLoading(true)
      
      // Mock AI-analyzed chats
      const mockChats: AIChat[] = [
        {
          contact: '+91 98765 43210',
          lastMessage: 'I need urgent help with my order!',
          timestamp: (Date.now() - 300000).toString(),
          unreadCount: 3,
          sentiment: 'negative',
          urgency: 'high',
          category: 'support',
          aiSuggestion: 'Customer seems frustrated about order. Prioritize immediate response.'
        },
        {
          contact: '+91 87654 32109',
          lastMessage: 'Your service is absolutely amazing! Thank you so much!',
          timestamp: (Date.now() - 600000).toString(),
          unreadCount: 0,
          sentiment: 'positive',
          urgency: 'low',
          category: 'feedback',
          aiSuggestion: 'Happy customer. Good opportunity to ask for review or referral.'
        },
        {
          contact: '+91 76543 21098',
          lastMessage: 'What are your pricing plans for enterprise?',
          timestamp: (Date.now() - 900000).toString(),
          unreadCount: 1,
          sentiment: 'neutral',
          urgency: 'medium',
          category: 'pricing',
          aiSuggestion: 'Sales opportunity. Share enterprise pricing and schedule demo.'
        },
        {
          contact: '+91 65432 10987',
          lastMessage: 'The product works perfectly! Exactly what I needed.',
          timestamp: (Date.now() - 1200000).toString(),
          unreadCount: 0,
          sentiment: 'positive',
          urgency: 'low',
          category: 'feedback',
          aiSuggestion: 'Satisfied customer. Consider upselling or asking for testimonial.'
        }
      ]

      setChats(mockChats)
    } catch (error) {
      console.error('Error loading AI chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (contact: string) => {
    try {
      setIsAnalyzing(true)
      
      // Mock messages with AI analysis
      const mockMessages: AIMessage[] = [
        {
          id: '1',
          from: contact,
          to: 'me',
          body: 'I need urgent help with my order!',
          timestamp: (Date.now() - 300000).toString(),
          type: 'incoming',
          analysis: {
            sentiment: 'negative',
            score: 85,
            category: 'support',
            keywords: ['urgent', 'help', 'order'],
            intent: 'support',
            urgency: 'high',
            suggestedResponse: 'I sincerely apologize for any issues with your order. Let me help resolve this immediately.'
          }
        },
        {
          id: '2',
          from: 'me',
          to: contact,
          body: 'I sincerely apologize for any issues with your order. Let me help resolve this immediately.',
          timestamp: (Date.now() - 250000).toString(),
          type: 'outgoing',
          isAutoReply: true
        },
        {
          id: '3',
          from: contact,
          to: 'me',
          body: 'Thank you for the quick response! My order number is #12345.',
          timestamp: (Date.now() - 200000).toString(),
          type: 'incoming',
          analysis: {
            sentiment: 'positive',
            score: 70,
            category: 'support',
            keywords: ['thank', 'quick', 'response', 'order', 'number'],
            intent: 'information',
            urgency: 'medium',
            suggestedResponse: 'Thank you for providing the order number. Let me check the status for you right away.'
          }
        }
      ]

      setMessages(mockMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleChatSelect = (contact: string) => {
    setSelectedChat(contact)
    loadMessages(contact)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return
    
    try {
      const message: AIMessage = {
        id: Date.now().toString(),
        from: 'me',
        to: selectedChat,
        body: newMessage,
        timestamp: Date.now().toString(),
        type: 'outgoing'
      }
      
      setMessages(prev => [...prev, message])
      setNewMessage('')
      
      // Generate AI response if enabled
      if (aiEnabled) {
        setTimeout(async () => {
          const aiResponse = await aiService.generateResponse(
            newMessage,
            messages.slice(-3).map(m => m.body),
            'helpful'
          )
          
          const aiMessage: AIMessage = {
            id: (Date.now() + 1).toString(),
            from: selectedChat,
            to: 'me',
            body: aiResponse.message,
            timestamp: (Date.now() + 1000).toString(),
            type: 'incoming',
            isAutoReply: true,
            analysis: {
              sentiment: aiResponse.sentiment || 'neutral',
              score: aiResponse.confidence * 100,
              category: aiResponse.category || 'general',
              keywords: [],
              intent: 'response',
              urgency: 'low'
            }
          }
          
          setMessages(prev => [...prev, aiMessage])
        }, 1500)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const generateAISuggestion = async (message: string) => {
    try {
      const response = await aiService.generateResponse(message, [], 'professional')
      return response.message
    } catch (error) {
      console.error('Error generating AI suggestion:', error)
      return 'I understand your message. How can I help you?'
    }
  }

  const filteredChats = chats.filter(chat => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'urgent') return chat.urgency === 'high'
    if (selectedCategory === 'sales') return chat.category === 'pricing'
    if (selectedCategory === 'support') return chat.category === 'support'
    if (selectedCategory === 'positive') return chat.sentiment === 'positive'
    if (selectedCategory === 'negative') return chat.sentiment === 'negative'
    return true
  }).filter(chat => 
    searchQuery === '' || 
    chat.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-200 h-96 rounded-xl"></div>
            <div className="lg:col-span-2 bg-gray-200 h-96 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  const selectedChatData = chats.find(c => c.contact === selectedChat)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-purple-600" />
            AI-Powered Inbox
          </h1>
          <p className="text-gray-600 mt-1">
            Smart messaging with AI analysis, auto-replies, and sentiment detection
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={aiEnabled ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setAiEnabled(!aiEnabled)}
            icon={aiEnabled ? <Zap size={16} /> : <Bot size={16} />}
          >
            AI {aiEnabled ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant={autoReplyEnabled ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
            icon={autoReplyEnabled ? <Play size={16} /> : <Pause size={16} />}
          >
            Auto-Reply
          </Button>
          <Button variant="outline" size="sm" icon={<Settings size={16} />}>
            AI Settings
          </Button>
        </div>
      </div>

      {/* AI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">AI Responses</p>
              <p className="text-xl font-bold text-gray-900">127</p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Positive Sentiment</p>
              <p className="text-xl font-bold text-gray-900">78%</p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Urgent Messages</p>
              <p className="text-xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Response Time</p>
              <p className="text-xl font-bold text-gray-900">1.2s</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap"
          >
            {category.label}
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {category.count}
            </span>
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Chat List */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-y-auto h-full">
              <AnimatePresence>
                {filteredChats.map((chat, index) => (
                  <motion.div
                    key={chat.contact}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleChatSelect(chat.contact)}
                    className={cn(
                      'p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50:bg-gray-800',
                      selectedChat === chat.contact && 'bg-blue-50 border-blue-200'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {chat.contact.charAt(0).toUpperCase()}
                        </div>
                        <div className={cn(
                          'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                          urgencyColors[chat.urgency].split(' ')[0]
                        )}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {chat.contact}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <span className={cn('text-lg', sentimentColors[chat.sentiment])}>
                              {chat.sentiment === 'positive' ? '😊' : chat.sentiment === 'negative' ? '😞' : '😐'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(parseInt(chat.timestamp))}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {chat.lastMessage}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              urgencyColors[chat.urgency]
                            )}>
                              {chat.urgency.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                              {chat.category}
                            </span>
                          </div>
                          {chat.unreadCount > 0 && (
                            <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                        
                        {chat.aiSuggestion && (
                          <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Sparkles className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-purple-700">
                                {chat.aiSuggestion}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <div className="lg:col-span-2">
          <Card variant="elevated" className="h-full flex flex-col">
            {selectedChat && selectedChatData ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedChat.charAt(0).toUpperCase()}
                      </div>
                      
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedChat}
                        </h2>
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            urgencyColors[selectedChatData.urgency]
                          )}>
                            {selectedChatData.urgency.toUpperCase()}
                          </span>
                          <span className={cn('text-sm', sentimentColors[selectedChatData.sentiment])}>
                            {selectedChatData.sentiment} sentiment
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isAnalyzing && (
                        <div className="flex items-center space-x-2 text-purple-600">
                          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Analyzing...</span>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" icon={<BarChart3 size={16} />}>
                        Analytics
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'flex',
                          message.type === 'outgoing' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div className="max-w-xs lg:max-w-md">
                          <div
                            className={cn(
                              'px-4 py-2 rounded-2xl relative',
                              message.type === 'outgoing'
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            )}
                          >
                            {message.isAutoReply && (
                              <div className="flex items-center space-x-1 mb-1">
                                <Bot className="w-3 h-3" />
                                <span className="text-xs opacity-75">AI Response</span>
                              </div>
                            )}
                            
                            <p className="break-words">{message.body}</p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <p className={cn(
                                'text-xs',
                                message.type === 'outgoing' 
                                  ? 'text-blue-100' 
                                  : 'text-gray-500'
                              )}>
                                {formatTime(parseInt(message.timestamp))}
                              </p>
                              
                              {message.type === 'outgoing' && (
                                <div className="text-blue-100">✓✓</div>
                              )}
                            </div>
                          </div>
                          
                          {/* AI Analysis */}
                          {message.analysis && message.type === 'incoming' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200"
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <Brain className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-700">
                                  AI Analysis
                                </span>
                              </div>
                              
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Sentiment:</span>
                                  <span className={cn('font-medium', sentimentColors[message.analysis.sentiment])}>
                                    {message.analysis.sentiment} ({message.analysis.score}%)
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Intent:</span>
                                  <span className="font-medium text-gray-900">
                                    {message.analysis.intent}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Urgency:</span>
                                  <span className={cn(
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    urgencyColors[message.analysis.urgency]
                                  )}>
                                    {message.analysis.urgency}
                                  </span>
                                </div>
                                
                                {message.analysis.suggestedResponse && (
                                  <div className="mt-2 pt-2 border-t border-purple-200">
                                    <p className="text-gray-600 mb-1">Suggested Response:</p>
                                    <p className="text-purple-700 italic">
                                      "{message.analysis.suggestedResponse}"
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2"
                                      onClick={() => setNewMessage(message.analysis?.suggestedResponse || '')}
                                    >
                                      Use Suggestion
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message... (AI will analyze and suggest responses)"
                      />
                    </div>
                    
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3"
                      icon={<Send size={16} />}
                    >
                      Send
                    </Button>
                  </div>
                  
                  {aiEnabled && (
                    <div className="flex items-center space-x-2 mt-2 text-sm text-purple-600">
                      <Sparkles className="w-4 h-4" />
                      <span>AI is analyzing messages and will suggest responses</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Brain size={64} className="mx-auto text-purple-300 mb-4" />
                  <p className="text-gray-500 text-lg">
                    Select a conversation to start AI-powered messaging
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    AI will analyze sentiment, suggest responses, and provide insights
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
