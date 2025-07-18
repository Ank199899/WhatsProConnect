'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Search, 
  Filter, 
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Star,
  Volume2,
  Archive,
  Trash2,
  Pin,
  Users,
  Clock,
  CheckCircle2,
  Check,
  Image,
  FileText,
  Download,
  Reply,
  Forward,
  Copy
} from 'lucide-react'
import { WhatsAppManagerClient, MessageData, ContactData } from '@/lib/whatsapp-manager'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import { cn, formatTime, getTimeAgo } from '@/lib/utils'
import VoiceRecorder, { VoiceMessagePlayer } from './VoiceRecorder'

interface LiveInboxProps {
  whatsappManager: WhatsAppManagerClient
  selectedSession: string | null
}

interface Conversation {
  contact: ContactData
  lastMessage: MessageData
  unreadCount: number
  isPinned: boolean
  isArchived: boolean
  lastMessageTime: number
}

interface MessageWithStatus extends MessageData {
  status: 'sending' | 'sent' | 'delivered' | 'read'
  isStarred?: boolean
  audioUrl?: string
  audioDuration?: number
}

export default function LiveInbox({ whatsappManager, selectedSession }: LiveInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageWithStatus[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned' | 'archived'>('all')
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedSession) {
      loadConversations()
      setupMessageListeners()
    }
  }, [selectedSession])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    if (!selectedSession) return
    
    try {
      setLoading(true)
      
      // Get contacts and recent messages
      const contacts = await whatsappManager.getContacts(selectedSession)
      const recentMessages = await whatsappManager.getMessages(selectedSession, 100)
      
      // Group messages by contact and create conversations
      const conversationMap = new Map<string, Conversation>()
      
      for (const contact of contacts) {
        const contactMessages = recentMessages.filter(
          msg => msg.from === contact.number || msg.to === contact.number
        )
        
        if (contactMessages.length > 0) {
          const lastMessage = contactMessages[contactMessages.length - 1]
          const unreadCount = contactMessages.filter(
            msg => msg.from === contact.number && !msg.isRead
          ).length
          
          conversationMap.set(contact.id, {
            contact,
            lastMessage,
            unreadCount,
            isPinned: false,
            isArchived: false,
            lastMessageTime: lastMessage.timestamp
          })
        }
      }
      
      // Sort conversations by last message time
      const sortedConversations = Array.from(conversationMap.values())
        .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
      
      setConversations(sortedConversations)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupMessageListeners = () => {
    // Listen for new messages
    whatsappManager.onMessage((messageData) => {
      if (messageData.sessionId === selectedSession) {
        // Update conversations
        loadConversations()
        
        // If this message is for the selected conversation, add it to messages
        if (selectedConversation && 
            (messageData.from === selectedConversation || messageData.to === selectedConversation)) {
          setMessages(prev => [...prev, {
            ...messageData,
            status: 'delivered'
          }])
        }
      }
    })
  }

  const loadMessages = async (contactNumber: string) => {
    if (!selectedSession) return
    
    try {
      const chatMessages = await whatsappManager.getChatMessages(selectedSession, contactNumber)
      const messagesWithStatus: MessageWithStatus[] = chatMessages.map(msg => ({
        ...msg,
        status: msg.from === contactNumber ? 'delivered' : 'read'
      }))
      
      setMessages(messagesWithStatus)
      setSelectedConversation(contactNumber)
      
      // Mark messages as read
      markMessagesAsRead(contactNumber)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const markMessagesAsRead = async (contactNumber: string) => {
    // Update conversation unread count
    setConversations(prev => prev.map(conv => 
      conv.contact.number === contactNumber 
        ? { ...conv, unreadCount: 0 }
        : conv
    ))
  }

  const sendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!selectedConversation || !selectedSession || sending) return

    try {
      setSending(true)

      // Convert blob to base64 or upload to server
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice-message.webm')
      formData.append('sessionId', selectedSession)
      formData.append('to', selectedConversation)
      formData.append('duration', duration.toString())

      // Add voice message to UI immediately
      const tempMessage: MessageWithStatus = {
        id: Date.now().toString(),
        sessionId: selectedSession,
        body: `🎤 Voice message (${Math.floor(duration)}s)`,
        from: 'me',
        to: selectedConversation,
        timestamp: Date.now(),
        type: 'voice',
        isGroupMsg: false,
        status: 'sending',
        audioUrl: URL.createObjectURL(audioBlob),
        audioDuration: duration
      }

      setMessages(prev => [...prev, tempMessage])
      setShowVoiceRecorder(false)

      // Here you would upload the voice message to your server
      // For demo, we'll just mark it as sent
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, status: 'sent' }
            : msg
        ))
        loadConversations()
      }, 1000)

    } catch (error) {
      console.error('Error sending voice message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      alert('Error sending voice message')
    } finally {
      setSending(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !selectedSession || sending) return
    
    try {
      setSending(true)
      
      // Add message to UI immediately with sending status
      const tempMessage: MessageWithStatus = {
        id: Date.now().toString(),
        sessionId: selectedSession,
        body: newMessage,
        from: 'me',
        to: selectedConversation,
        timestamp: Date.now(),
        type: 'text',
        isGroupMsg: false,
        status: 'sending'
      }
      
      setMessages(prev => [...prev, tempMessage])
      setNewMessage('')
      
      // Send message via WhatsApp
      const result = await whatsappManager.sendMessage({
        sessionId: selectedSession,
        to: selectedConversation,
        message: newMessage
      })
      
      if (result.success) {
        // Update message status to sent
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'sent', id: result.messageId || msg.id }
            : msg
        ))
        
        // Update conversation with new last message
        loadConversations()
      } else {
        // Remove failed message
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      alert('Error sending message')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredConversations = conversations.filter(conv => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!conv.contact.name.toLowerCase().includes(query) &&
          !conv.contact.number.includes(query) &&
          !conv.lastMessage.body.toLowerCase().includes(query)) {
        return false
      }
    }
    
    // Apply status filter
    switch (filter) {
      case 'unread':
        return conv.unreadCount > 0
      case 'pinned':
        return conv.isPinned
      case 'archived':
        return conv.isArchived
      default:
        return !conv.isArchived
    }
  })

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock size={14} className="text-gray-400" />
      case 'sent':
        return <Check size={14} className="text-gray-400" />
      case 'delivered':
        return <CheckCircle2 size={14} className="text-gray-400" />
      case 'read':
        return <CheckCircle2 size={14} className="text-blue-500" />
      default:
        return null
    }
  }

  if (!selectedSession) {
    return (
      <div className="p-6 text-center">
        <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Session Selected
        </h3>
        <p className="text-gray-600">
          Please select a WhatsApp session to view conversations
        </p>
      </div>
    )
  }

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MessageCircle className="w-8 h-8 mr-3 text-blue-600" />
            Live Inbox
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time WhatsApp conversations and message management
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" icon={<Filter size={16} />}>
            Filters
          </Button>
          <Button variant="outline" size="sm" icon={<Search size={16} />}>
            Search
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Chats</p>
              <p className="text-xl font-bold text-gray-900">{conversations.length}</p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-xl font-bold text-gray-900">
                {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Pin className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pinned</p>
              <p className="text-xl font-bold text-gray-900">
                {conversations.filter(c => c.isPinned).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Groups</p>
              <p className="text-xl font-bold text-gray-900">
                {conversations.filter(c => c.contact.isGroup).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Conversations</h3>
              <div className="flex space-x-1">
                {['all', 'unread', 'pinned'].map((filterType) => (
                  <Button
                    key={filterType}
                    variant={filter === filterType ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(filterType as any)}
                    className="px-2 py-1 text-xs"
                  >
                    {filterType}
                  </Button>
                ))}
              </div>
            </div>
            
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
              className="mt-3"
            />
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-y-auto h-full">
              <AnimatePresence>
                {filteredConversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => loadMessages(conversation.contact.number)}
                    className={cn(
                      'p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50:bg-gray-800',
                      selectedConversation === conversation.contact.number && 'bg-blue-50 border-blue-200'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {conversation.contact.isGroup ? (
                            <Users size={20} />
                          ) : (
                            conversation.contact.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 truncate">
                            {conversation.contact.name}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {conversation.isPinned && <Pin size={14} className="text-yellow-500" />}
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage.type === 'text' 
                            ? conversation.lastMessage.body 
                            : `📎 ${conversation.lastMessage.type}`
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No conversations found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <div className="lg:col-span-2">
          <Card variant="elevated" className="h-full flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {conversations.find(c => c.contact.number === selectedConversation)?.contact.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {conversations.find(c => c.contact.number === selectedConversation)?.contact.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConversation}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="p-2">
                        <Phone size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2">
                        <Video size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2">
                        <MoreVertical size={16} />
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
                          message.from === 'me' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div className="max-w-xs lg:max-w-md">
                          <div
                            className={cn(
                              'px-4 py-2 rounded-2xl relative',
                              message.from === 'me'
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            )}
                          >
                            {message.type === 'voice' && message.audioUrl ? (
                              <VoiceMessagePlayer
                                audioUrl={message.audioUrl}
                                duration={message.audioDuration}
                                isOwn={message.from === 'me'}
                              />
                            ) : (
                              <p className="break-words">{message.body}</p>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <p className={cn(
                                'text-xs',
                                message.from === 'me' 
                                  ? 'text-blue-100' 
                                  : 'text-gray-500'
                              )}>
                                {formatTime(message.timestamp)}
                              </p>
                              
                              {message.from === 'me' && (
                                <div className="ml-2">
                                  {getMessageStatusIcon(message.status)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 space-y-4">
                  {/* Voice Recorder */}
                  <AnimatePresence>
                    {showVoiceRecorder && (
                      <VoiceRecorder
                        onSend={sendVoiceMessage}
                        onCancel={() => setShowVoiceRecorder(false)}
                      />
                    )}
                  </AnimatePresence>

                  {/* Text Input */}
                  <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="sm" className="p-2">
                      <Paperclip size={16} />
                    </Button>

                    <div className="flex-1">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        disabled={sending || showVoiceRecorder}
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                    >
                      <Volume2 size={16} />
                    </Button>

                    <Button variant="ghost" size="sm" className="p-2">
                      <Smile size={16} />
                    </Button>

                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending || showVoiceRecorder}
                      className="p-3"
                      icon={<Send size={16} />}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">
                    Select a conversation to start messaging
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
