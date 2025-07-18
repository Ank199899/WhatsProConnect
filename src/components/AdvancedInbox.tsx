'use client'

import React, { useState, useEffect } from 'react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import { 
  MessageCircle, 
  Send, 
  Search,
  Users,
  VolumeX,
  Bell
} from 'lucide-react'
import Card, { CardContent, CardHeader } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import { cn, formatTime } from '@/lib/utils'

interface Message {
  id: string
  from: string
  to: string
  body: string
  timestamp: string
  type: 'incoming' | 'outgoing'
  session_id: string
  messageType: string
}

interface Chat {
  id: string
  contact: string
  name: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isGroup: boolean
  isOnline: boolean
  isPinned: boolean
  isMuted: boolean
  isArchived: boolean
  isBlocked: boolean
}

interface AdvancedInboxProps {
  whatsappManager: WhatsAppManagerClient
  sessions: any[]
  selectedSession: string | null
  onSessionSelected: (sessionId: string) => void
}

export default function AdvancedInbox({
  whatsappManager,
  sessions,
  selectedSession,
  onSessionSelected
}: AdvancedInboxProps) {
  // State management
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Load real chats from WhatsApp API and setup real-time listeners
  useEffect(() => {
    if (selectedSession && whatsappManager) {
      loadChats()
      setupRealTimeListeners()
      setIsConnected(true)
    }

    return () => {
      // Cleanup listeners when component unmounts
      if (whatsappManager && whatsappManager.socket) {
        whatsappManager.socket.off('new_message')
        whatsappManager.socket.off('message_status_update')
      }
    }
  }, [selectedSession, whatsappManager])

  // Setup real-time message listeners
  const setupRealTimeListeners = () => {
    if (!whatsappManager) return

    // Listen for new incoming messages
    whatsappManager.onNewMessage((message: any) => {
      console.log('📨 New message received:', message)

      // Add to messages if it's for the currently selected chat
      if (selectedChat && (message.from === selectedChat || message.to === selectedChat)) {
        const formattedMessage: Message = {
          id: message.id || Date.now().toString(),
          from: message.from,
          to: message.to,
          body: message.body,
          timestamp: message.timestamp ? (message.timestamp * 1000).toString() : Date.now().toString(),
          type: message.fromMe ? 'outgoing' : 'incoming',
          session_id: selectedSession || '',
          messageType: message.type || 'text'
        }

        setMessages(prev => [...prev, formattedMessage])
      }

      // Update chat list to show new last message
      loadChats()
    })

    // Listen for message status updates
    whatsappManager.onMessageStatusUpdate((data: any) => {
      console.log('📋 Message status update:', data)
      // Update message status in UI if needed
    })
  }

  // Auto-refresh chats every 30 seconds
  useEffect(() => {
    if (!selectedSession || !whatsappManager) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing chats...')
      loadChats()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [selectedSession, whatsappManager])

  // Load chats from WhatsApp API
  const loadChats = async () => {
    if (!selectedSession || !whatsappManager) return

    setLoading(true)
    try {
      console.log('🔄 Loading chats for session:', selectedSession)
      const chatList = await whatsappManager.getChats(selectedSession)

      if (chatList && chatList.length > 0) {
        const formattedChats: Chat[] = chatList.map((chat: any) => ({
          id: chat.id._serialized || chat.id,
          contact: chat.id._serialized || chat.id,
          name: chat.name || chat.id._serialized || 'Unknown Contact',
          lastMessage: chat.lastMessage?.body || 'No messages yet',
          timestamp: chat.lastMessage?.timestamp ? (chat.lastMessage.timestamp * 1000).toString() : Date.now().toString(),
          unreadCount: chat.unreadCount || 0,
          isGroup: chat.isGroup || false,
          isOnline: false, // Will be updated via real-time events
          isPinned: chat.pinned || false,
          isMuted: chat.isMuted || false,
          isArchived: chat.archived || false,
          isBlocked: false
        }))

        console.log('✅ Loaded chats:', formattedChats.length)
        setChats(formattedChats)
      } else {
        console.log('📭 No chats found, showing empty state')
        setChats([])
      }
    } catch (error) {
      console.error('❌ Error loading chats:', error)
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  // Load real messages when chat is selected
  const handleChatSelect = async (contact: string) => {
    setSelectedChat(contact)
    setLoading(true)

    try {
      console.log('🔄 Loading messages for chat:', contact)
      const messageList = await whatsappManager.getMessages(selectedSession!, contact)

      if (messageList && messageList.length > 0) {
        const formattedMessages: Message[] = messageList.map((msg: any) => ({
          id: msg.id._serialized || msg.id || Date.now().toString(),
          from: msg.from || contact,
          to: msg.to || 'me',
          body: msg.body || '',
          timestamp: msg.timestamp ? (msg.timestamp * 1000).toString() : Date.now().toString(),
          type: msg.fromMe ? 'outgoing' : 'incoming',
          session_id: selectedSession || '',
          messageType: msg.type || 'text'
        }))

        console.log('✅ Loaded messages:', formattedMessages.length)
        setMessages(formattedMessages)
      } else {
        console.log('📭 No messages found for this chat')
        setMessages([])
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  // Send real message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !selectedSession) return

    const messageText = newMessage
    setNewMessage('') // Clear input immediately for better UX

    // Add optimistic message to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      from: 'me',
      to: selectedChat,
      body: messageText,
      timestamp: Date.now().toString(),
      type: 'outgoing',
      session_id: selectedSession,
      messageType: 'text'
    }

    setMessages(prev => [...prev, optimisticMessage])

    try {
      console.log('📤 Sending message to:', selectedChat)
      const result = await whatsappManager.sendMessage(selectedSession, selectedChat, messageText)

      if (result.success) {
        console.log('✅ Message sent successfully')

        // Save message to database for persistence
        try {
          const response = await fetch('/api/database/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: selectedSession,
              whatsapp_message_id: result.messageId || optimisticMessage.id,
              from_number: 'me',
              to_number: selectedChat,
              body: messageText,
              message_type: 'text',
              is_group_message: false,
              timestamp: Date.now()
            })
          })

          if (response.ok) {
            console.log('✅ Message saved to database')
          }
        } catch (dbError) {
          console.error('⚠️ Failed to save message to database:', dbError)
        }

        // Update the optimistic message with real ID
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...msg, id: result.messageId || msg.id }
            : msg
        ))

        // Refresh chat list to update last message
        loadChats()
      } else {
        console.error('❌ Failed to send message:', result.error)
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
        setNewMessage(messageText) // Restore message text
        alert('Failed to send message: ' + result.error)
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      setNewMessage(messageText) // Restore message text
      alert('Error sending message. Please try again.')
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Simple test render
  if (!whatsappManager) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Advanced Inbox</h1>
          <p className="text-gray-600 mt-2">WhatsApp Manager not available</p>
        </div>
      </div>
    )
  }

  if (!selectedSession) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Advanced Inbox</h1>
          <p className="text-gray-600 mt-2">Please select a WhatsApp session to continue</p>
          <p className="text-gray-500 mt-2">For testing, using default session: md9815eh1svpyi8ljkf</p>
          <Button
            onClick={() => onSessionSelected('md9815eh1svpyi8ljkf')}
            className="mt-4"
          >
            Use Test Session
          </Button>
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
            <MessageCircle className="w-8 h-8 mr-3 text-blue-600" />
            Advanced Inbox
            {isConnected && (
              <div className="ml-3 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time WhatsApp conversations - Session: {selectedSession}
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat List */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <h3 className="text-lg font-semibold">Conversations</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto h-full">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading chats...</p>
                </div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageCircle size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-gray-400 text-sm">Start a conversation to see it here</p>
                </div>
              ) : (
                chats.map((chat) => (
                <div
                  key={chat.contact}
                  onClick={() => handleChatSelect(chat.contact)}
                  className={cn(
                    'p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50',
                    selectedChat === chat.contact && 'bg-blue-50 border-blue-200'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {chat.name.charAt(0).toUpperCase()}
                      </div>
                      {chat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          {chat.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(parseInt(chat.timestamp))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
              )}
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
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedChatData.name.charAt(0).toUpperCase()}
                      </div>
                      {selectedChatData.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedChatData.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selectedChatData.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex',
                        message.type === 'outgoing' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl',
                          message.type === 'outgoing'
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        )}
                      >
                        <p className="break-words">{message.body}</p>
                        <p className={cn(
                          'text-xs mt-1',
                          message.type === 'outgoing' 
                            ? 'text-blue-100' 
                            : 'text-gray-500'
                        )}>
                          {formatTime(parseInt(message.timestamp))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                      />
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3"
                    >
                      <Send size={16} />
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
