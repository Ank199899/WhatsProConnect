'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Send, Search, Filter, MoreVertical, Phone, Video, Paperclip,
  Smile, Star, Volume2, Archive, Trash2, Pin, Users,
  Check, Image, FileText, Download, Reply, Forward,
  X, Headphones, MapPin,
  ChevronDown, ChevronUp, Shield, Bell, Crown,
  Verified,
  RefreshCw, AlertCircle, Loader2, CheckCheck, Circle, Zap
} from 'lucide-react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import Button from './ui/Button'
import { cn, formatTime, getTimeAgo } from '@/lib/utils'

interface AdvancedRealTimeInboxProps {
  whatsappManager: WhatsAppManagerClient
  sessions: Array<{
    id: string
    name: string
    status: string
    phoneNumber?: string
    profilePic?: string
    businessAccount?: boolean
    verified?: boolean
  }>
  selectedSession: string | null
  onSessionSelected: (sessionId: string) => void
}

interface Contact {
  id: string
  name: string
  phoneNumber: string
  profilePic?: string
  isOnline: boolean
  lastSeen?: number
  isTyping: boolean
  isBusiness: boolean
  isVerified: boolean
  status?: string
  isPinned: boolean
  isMuted: boolean
  isArchived: boolean
  unreadCount: number
}

interface Message {
  id: string
  content: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact'
  timestamp: number
  isFromMe: boolean
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  mediaUrl?: string
  fileName?: string
  fileSize?: number
  duration?: number
  replyTo?: string
  isForwarded: boolean
  isStarred: boolean
  quotedMessage?: Message
}

interface Chat {
  id: string
  contact: Contact
  lastMessage?: Message
  lastMessageTime: number
  isGroup: boolean
  groupInfo?: {
    name: string
    participants: Contact[]
    avatar?: string
  }
}

export default function AdvancedRealTimeInbox({ 
  whatsappManager, 
  sessions, 
  selectedSession, 
  onSessionSelected 
}: AdvancedRealTimeInboxProps) {
  
  useEffect(() => {
    console.log('Sessions in Inbox:', sessions)
    console.log('Selected Session:', selectedSession)
  }, [sessions, selectedSession])
  // Core State
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'pinned' | 'archived' | 'groups'>('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(380) // Adjustable sidebar width
  
  // Real-time State
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [socket, setSocket] = useState<any>(null)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize socket connection
  useEffect(() => {
    if (selectedSession && whatsappManager) {
      console.log('🔌 Initializing socket for session:', selectedSession)
      
      const socketInstance = whatsappManager.initializeSocket()
      
      if (socketInstance) {
        setSocket(socketInstance)
        
        socketInstance.on('connect', () => {
          console.log('✅ Socket connected')
          setConnected(true)
          setError(null)
          loadChats()
        })
        
        socketInstance.on('disconnect', () => {
          console.log('❌ Socket disconnected')
          setConnected(false)
        })
        
        socketInstance.on('message', (data: any) => {
          console.log('📨 New message received:', data)
          handleNewMessage(data)
        })
        
        socketInstance.on('message_status_update', (data: any) => {
          console.log('📊 Message status update:', data)
          updateMessageStatus(data.messageId, data.status)
        })
        
        socketInstance.on('user_typing', (data: any) => {
          console.log('⌨️ User typing:', data)
          setTypingUsers(prev => new Set([...prev, data.contactId]))
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(data.contactId)
              return newSet
            })
          }, 3000)
        })
        
        socketInstance.on('user_presence', (data: any) => {
          console.log('👤 User presence:', data)
          if (data.isOnline) {
            setOnlineUsers(prev => new Set([...prev, data.contactId]))
          } else {
            setOnlineUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(data.contactId)
              return newSet
            })
          }
        })
        
        socketInstance.on('chats_updated', (data: any) => {
          console.log('💬 Chats updated:', data)
          if (data.chats) {
            setChats(data.chats)
          }
        })
        
        socketInstance.on('error', (error: any) => {
          console.error('❌ Socket error:', error)
          setError(error.message || 'Connection error')
        })
      }
      
      return () => {
        if (socketInstance) {
          socketInstance.disconnect()
        }
      }
    }
  }, [selectedSession, whatsappManager])

  // Load chats
  const loadChats = async () => {
    if (!selectedSession) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Loading chats for session:', selectedSession)
      
      const chatList = await whatsappManager.getChats(selectedSession)
      console.log('✅ Chats loaded:', chatList?.length || 0)
      
      if (chatList && Array.isArray(chatList)) {
        const transformedChats: Chat[] = chatList.map((chat: any) => ({
          id: chat.id._serialized || chat.id,
          contact: {
            id: chat.id._serialized || chat.id,
            name: chat.name || chat.contact?.name || chat.contact?.pushname || 'Unknown',
            phoneNumber: chat.id.user || chat.contact?.number || '',
            profilePic: chat.contact?.profilePicUrl,
            isOnline: onlineUsers.has(chat.id._serialized || chat.id),
            lastSeen: chat.contact?.lastSeen,
            isTyping: typingUsers.has(chat.id._serialized || chat.id),
            isBusiness: chat.contact?.isBusiness || false,
            isVerified: chat.contact?.isVerified || false,
            status: chat.contact?.status,
            isPinned: chat.pinned || false,
            isMuted: chat.isMuted || false,
            isArchived: chat.archived || false,
            unreadCount: chat.unreadCount || 0
          },
          lastMessage: chat.lastMessage ? transformMessage(chat.lastMessage) : undefined,
          lastMessageTime: chat.lastMessage?.timestamp || Date.now(),
          isGroup: chat.isGroup || false,
          groupInfo: chat.isGroup ? {
            name: chat.name,
            participants: chat.participants || [],
            avatar: chat.groupMetadata?.pictureUrl
          } : undefined
        }))
        
        // Sort by last message time
        transformedChats.sort((a, b) => b.lastMessageTime - a.lastMessageTime)
        
        setChats(transformedChats)
        
        // Auto-select first chat if none selected
        if (!selectedChat && transformedChats.length > 0) {
          setSelectedChat(transformedChats[0].id)
        }
      } else {
        setChats([])
      }
    } catch (err) {
      console.error('❌ Error loading chats:', err)
      setError('Failed to load chats')
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  // Load messages for selected chat
  const loadMessages = async (chatId: string) => {
    if (!selectedSession || !chatId) return
    
    try {
      console.log('🔄 Loading messages for chat:', chatId)
      
      const messageList = await whatsappManager.getMessages(selectedSession, chatId)
      console.log('✅ Messages loaded:', messageList?.length || 0)
      
      if (messageList && Array.isArray(messageList)) {
        const transformedMessages = messageList.map(transformMessage)
        setMessages(transformedMessages)
        scrollToBottom()
      } else {
        setMessages([])
      }
    } catch (err) {
      console.error('❌ Error loading messages:', err)
      setMessages([])
    }
  }

  // Transform message data
  const transformMessage = (msg: any): Message => ({
    id: msg.id?._serialized || msg.id || Math.random().toString(),
    content: msg.body || msg.content || '',
    type: msg.type || 'text',
    timestamp: msg.timestamp ? msg.timestamp * 1000 : Date.now(),
    isFromMe: msg.fromMe || false,
    status: msg.ack ? getMessageStatus(msg.ack) : 'sent',
    mediaUrl: msg.mediaUrl,
    fileName: msg.filename,
    fileSize: msg.filesize,
    duration: msg.duration,
    replyTo: msg.quotedMsgId,
    isForwarded: msg.isForwarded || false,
    isStarred: msg.isStarred || false,
    quotedMessage: msg.quotedMsg ? transformMessage(msg.quotedMsg) : undefined
  })

  // Get message status from ack
  const getMessageStatus = (ack: number): Message['status'] => {
    switch (ack) {
      case 0: return 'sending'
      case 1: return 'sent'
      case 2: return 'delivered'
      case 3: return 'read'
      default: return 'sent'
    }
  }

  // Handle new message
  const handleNewMessage = useCallback((data: any) => {
    const newMsg = transformMessage(data)
    
    setMessages(prev => {
      const exists = prev.find(m => m.id === newMsg.id)
      if (exists) return prev
      return [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp)
    })
    
    // Update chat list
    setChats(prev => {
      const chatIndex = prev.findIndex(c => c.id === data.chatId)
      if (chatIndex >= 0) {
        const updatedChats = [...prev]
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          lastMessage: newMsg,
          lastMessageTime: newMsg.timestamp,
          contact: {
            ...updatedChats[chatIndex].contact,
            unreadCount: newMsg.isFromMe ? 0 : updatedChats[chatIndex].contact.unreadCount + 1
          }
        }
        // Move to top
        const [updatedChat] = updatedChats.splice(chatIndex, 1)
        return [updatedChat, ...updatedChats]
      }
      return prev
    })
    
    scrollToBottom()
  }, [])

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: status as Message['status'] } : msg
    ))
  }, [])

  // Send message with advanced features
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !selectedSession) return
    
    const tempId = `temp_${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      content: newMessage.trim(),
      type: 'text',
      timestamp: Date.now(),
      isFromMe: true,
      status: 'sending',
      isForwarded: false,
      isStarred: false
    }
    
    // Add temp message immediately for instant UI feedback
    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')
    scrollToBottom()
    
    try {
      console.log('📤 Sending message:', newMessage.trim())
      
      const result = await whatsappManager.sendMessage(selectedSession, selectedChat, newMessage.trim())
      
      if (result && result.success) {
        // Replace temp message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: result.success ? tempId : msg.id, status: 'sent' }
            : msg
        ))
        console.log('✅ Message sent successfully')
        
        // Update chat list with new last message
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat 
            ? { 
                ...chat, 
                lastMessage: { ...tempMessage, status: 'sent' },
                lastMessageTime: Date.now()
              }
            : chat
        ))
      } else {
        // Mark as failed
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        ))
        console.error('❌ Failed to send message:', result?.message)
        setError(result?.message || 'Failed to send message')
      }
    } catch (err) {
      console.error('❌ Error sending message:', err)
      // Mark as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ))
      setError('Network error while sending message')
    }
  }

  // Send media message
  const sendMediaMessage = async (file: File) => {
    if (!selectedChat || !selectedSession) return
    
    const tempId = `temp_${Date.now()}`
    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 
                    file.type.startsWith('audio/') ? 'audio' : 'document'
    
    const tempMessage: Message = {
      id: tempId,
      content: file.name,
      type: fileType,
      timestamp: Date.now(),
      isFromMe: true,
      status: 'sending',
      fileName: file.name,
      fileSize: file.size,
      isForwarded: false,
      isStarred: false
    }
    
    // Add temp message immediately
    setMessages(prev => [...prev, tempMessage])
    scrollToBottom()
    
    try {
      console.log('📤 Sending media:', file.name)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', selectedSession)
      formData.append('to', selectedChat)
      
      const response = await fetch(`/api/messages/send-media`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result && result.success) {
        // Replace temp message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: result.messageId || tempId, status: 'sent', mediaUrl: result.mediaUrl }
            : msg
        ))
        console.log('✅ Media sent successfully')
      } else {
        // Mark as failed
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        ))
        console.error('❌ Failed to send media:', result?.error)
      }
    } catch (err) {
      console.error('❌ Error sending media:', err)
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ))
    }
  }

  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId)
    loadMessages(chatId)
    
    // Mark as read
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, contact: { ...chat.contact, unreadCount: 0 } }
        : chat
    ))
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Filter chats
  const filteredChats = chats.filter(chat => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return chat.contact.name.toLowerCase().includes(query) ||
             chat.contact.phoneNumber.includes(query) ||
             chat.lastMessage?.content.toLowerCase().includes(query)
    }
    
    switch (selectedFilter) {
      case 'unread':
        return chat.contact.unreadCount > 0
      case 'pinned':
        return chat.contact.isPinned
      case 'archived':
        return chat.contact.isArchived
      case 'groups':
        return chat.isGroup
      default:
        return !chat.contact.isArchived
    }
  })

  // Get selected chat info
  const selectedChatInfo = chats.find(chat => chat.id === selectedChat)

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Message actions
  const replyToMessage = (message: Message) => {
    setNewMessage(`@${selectedChatInfo?.contact.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}\n\n`)
    messageInputRef.current?.focus()
  }

  const forwardMessage = (message: Message) => {
    // TODO: Implement forward functionality
    console.log('Forward message:', message)
  }

  const starMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
    ))
  }

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  // Search messages
  const searchMessages = (query: string) => {
    if (!query.trim()) return []
    
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase())
    )
  }

  // Mark messages as read
  const markAsRead = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, contact: { ...chat.contact, unreadCount: 0 } }
        : chat
    ))
  }

  // Pin/Unpin chat
  const togglePinChat = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, contact: { ...chat.contact, isPinned: !chat.contact.isPinned } }
        : chat
    ))
  }

  // Mute/Unmute chat
  const toggleMuteChat = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, contact: { ...chat.contact, isMuted: !chat.contact.isMuted } }
        : chat
    ))
  }

  // Archive/Unarchive chat
  const toggleArchiveChat = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, contact: { ...chat.contact, isArchived: !chat.contact.isArchived } }
        : chat
    ))
  }

  // Render message status icon
  const renderMessageStatus = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Circle className="w-3 h-3 text-gray-400" />
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  // Render message content
  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="max-w-xs">
            {message.mediaUrl ? (
              <img 
                src={message.mediaUrl} 
                alt="Image" 
                className="rounded-lg max-w-full h-auto"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
                <Image className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">Image</span>
              </div>
            )}
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        )
      
      case 'video':
        return (
          <div className="max-w-xs">
            {message.mediaUrl ? (
              <video 
                src={message.mediaUrl} 
                controls 
                className="rounded-lg max-w-full h-auto"
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
                <Video className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">Video</span>
              </div>
            )}
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        )
      
      case 'audio':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs">
            <div className="flex-shrink-0">
              <Headphones className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Voice Message</div>
              {message.duration && (
                <div className="text-xs text-gray-500">{Math.round(message.duration)}s</div>
              )}
            </div>
            {message.mediaUrl && (
              <audio src={message.mediaUrl} controls className="w-full max-w-xs" />
            )}
          </div>
        )
      
      case 'document':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs">
            <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {message.fileName || 'Document'}
              </div>
              {message.fileSize && (
                <div className="text-xs text-gray-500">
                  {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
            {message.mediaUrl && (
              <a 
                href={message.mediaUrl} 
                download={message.fileName}
                className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
              >
                <Download className="w-4 h-4 text-gray-500" />
              </a>
            )}
          </div>
        )
      
      case 'location':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs">
            <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Location</div>
              <div className="text-xs text-gray-500">Shared location</div>
            </div>
          </div>
        )
      
      default:
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Enhanced Resizable Sidebar */}
      <div
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-xl relative",
          sidebarCollapsed ? "w-16" : ""
        )}
        style={{ width: sidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
      >
        {/* Resize Handle */}
        {!sidebarCollapsed && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize z-10"
            onMouseDown={(e) => {
              const startX = e.clientX
              const startWidth = sidebarWidth

              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(300, Math.min(600, startWidth + (e.clientX - startX)))
                setSidebarWidth(newWidth)
              }

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }

              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />
        )}
        {/* Enhanced Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Real-Time Inbox</h2>
                  <p className="text-sm opacity-90">Advanced WhatsApp Management</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30"
              >
                {sidebarCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </Button>
            </div>
          </div>

          {!sidebarCollapsed && (
            <div className="mt-4 space-y-3">
              {/* Enhanced Session Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-90">WhatsApp Session</label>
                <select
                  value={selectedSession || ''}
                  onChange={(e) => onSessionSelected(e.target.value)}
                  className="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  <option value="" className="text-gray-900">Select Session</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id} className="text-gray-900">
                      {session.name} ({session.status})
                      {session.businessAccount && ' 🏢'}
                      {session.verified && ' ✅'}
                    </option>
                  ))}
                </select>
                {sessions.length === 0 && (
                  <p className="text-xs opacity-75">No sessions available. Please create a WhatsApp session first.</p>
                )}
              </div>

              {/* Search and Filters */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-70" size={16} />
                  <input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30"
                >
                  <Filter size={16} />
                </Button>
              </div>

              {/* Filter Options */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value as any)}
                        className="flex-1 px-2 py-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded text-white text-sm"
                      >
                        <option value="all" className="text-gray-900">All Chats</option>
                        <option value="unread" className="text-gray-900">Unread</option>
                        <option value="pinned" className="text-gray-900">Pinned</option>
                        <option value="groups" className="text-gray-900">Groups</option>
                        <option value="archived" className="text-gray-900">Archived</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="p-4">
              {/* Chat Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <h1 className="text-lg font-semibold text-gray-900">
                    Chats ({filteredChats.length})
                  </h1>
                  {connected && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Search"
                  >
                    <Search className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={loadChats}
                    disabled={loading}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw className={cn("w-4 h-4 text-gray-600", loading && "animate-spin")} />
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      showFilters ? "bg-green-100 text-green-600" : "hover:bg-gray-100 text-gray-600"
                    )}
                    title="Filters"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Search */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 border-b border-gray-200"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filters */}
            <div className="flex items-center space-x-2 p-4 border-b border-gray-200">
              {[
                { key: 'all', label: 'All', icon: MessageCircle },
                { key: 'unread', label: 'Unread', icon: Bell },
                { key: 'pinned', label: 'Pinned', icon: Pin },
                { key: 'groups', label: 'Groups', icon: Users }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedFilter(key as any)}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    selectedFilter === key
                      ? "bg-green-100 text-green-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {!selectedSession ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select WhatsApp Session</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Choose a connected WhatsApp session to view chats
                  </p>
                  {sessions.length === 0 ? (
                    <div className="text-center">
                      <p className="text-sm text-red-600 mb-2">No sessions available</p>
                      <p className="text-xs text-gray-400">Please create a WhatsApp session first</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Available sessions ({sessions.length}):</p>
                      <div className="space-y-1">
                        {sessions.map((session) => (
                          <div key={session.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <div className="font-medium">{session.name}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                session.status === 'ready' ? 'bg-green-500' :
                                session.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                              )} />
                              <span>{session.status}</span>
                              {session.phoneNumber && <span>({session.phoneNumber})</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : loading && chats.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={loadChats}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <MessageCircle className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No chats found for this session</p>
                  <button
                    onClick={loadChats}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Refresh chats
                  </button>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredChats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors group relative",
                        selectedChat === chat.id
                          ? "bg-green-50 border border-green-200"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleChatSelect(chat.id)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        // Show context menu for chat actions
                      }}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {chat.contact.profilePic ? (
                          <img
                            src={chat.contact.profilePic}
                            alt={chat.contact.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            {chat.isGroup ? (
                              <Users className="w-6 h-6 text-gray-600" />
                            ) : (
                              <span className="text-lg font-semibold text-gray-600">
                                {chat.contact.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Online indicator */}
                        {chat.contact.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                        )}
                        
                        {/* Typing indicator */}
                        {chat.contact.isTyping && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full animate-pulse" />
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {chat.contact.name}
                            </h3>
                            {chat.contact.isVerified && (
                              <Verified className="w-4 h-4 text-blue-500" />
                            )}
                            {chat.contact.isBusiness && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                            {chat.contact.isPinned && (
                              <Pin className="w-3 h-3 text-gray-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {chat.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {formatTime(chat.lastMessage.timestamp)}
                              </span>
                            )}
                            {chat.contact.unreadCount > 0 && (
                              <div className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {chat.contact.unreadCount > 99 ? '99+' : chat.contact.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {chat.contact.isTyping ? (
                              <span className="text-blue-600 italic">typing...</span>
                            ) : chat.lastMessage ? (
                              <>
                                {chat.lastMessage.isFromMe && (
                                  <span className="mr-1">
                                    {renderMessageStatus(chat.lastMessage.status)}
                                  </span>
                                )}
                                {chat.lastMessage.type === 'text' 
                                  ? chat.lastMessage.content
                                  : `${chat.lastMessage.type.charAt(0).toUpperCase() + chat.lastMessage.type.slice(1)}`
                                }
                              </>
                            ) : (
                              'No messages yet'
                            )}
                          </p>
                          <div className="flex items-center space-x-1">
                            {chat.contact.isMuted && (
                              <Volume2 className="w-3 h-3 text-gray-400" />
                            )}
                            
                            {/* Chat actions dropdown */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  togglePinChat(chat.id)
                                }}
                                className={cn(
                                  "p-1 hover:bg-gray-200 rounded",
                                  chat.contact.isPinned ? "text-blue-600" : "text-gray-400"
                                )}
                                title={chat.contact.isPinned ? "Unpin" : "Pin"}
                              >
                                <Pin className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleMuteChat(chat.id)
                                }}
                                className={cn(
                                  "p-1 hover:bg-gray-200 rounded",
                                  chat.contact.isMuted ? "text-red-600" : "text-gray-400"
                                )}
                                title={chat.contact.isMuted ? "Unmute" : "Mute"}
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleArchiveChat(chat.id)
                                }}
                                className="p-1 hover:bg-gray-200 rounded text-gray-400"
                                title={chat.contact.isArchived ? "Unarchive" : "Archive"}
                              >
                                <Archive className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatInfo ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="relative">
                  {selectedChatInfo.contact.profilePic ? (
                    <img
                      src={selectedChatInfo.contact.profilePic}
                      alt={selectedChatInfo.contact.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {selectedChatInfo.isGroup ? (
                        <Users className="w-5 h-5 text-gray-600" />
                      ) : (
                        <span className="text-sm font-semibold text-gray-600">
                          {selectedChatInfo.contact.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedChatInfo.contact.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Chat Info */}
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-semibold text-gray-900">
                      {selectedChatInfo.contact.name}
                    </h2>
                    {selectedChatInfo.contact.isVerified && (
                      <Verified className="w-4 h-4 text-blue-500" />
                    )}
                    {selectedChatInfo.contact.isBusiness && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedChatInfo.contact.isTyping ? (
                      <span className="text-blue-600">typing...</span>
                    ) : selectedChatInfo.contact.isOnline ? (
                      'online'
                    ) : selectedChatInfo.contact.lastSeen ? (
                      `last seen ${getTimeAgo(selectedChatInfo.contact.lastSeen)}`
                    ) : (
                      selectedChatInfo.contact.phoneNumber
                    )}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400">Start a conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex group",
                      message.isFromMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative",
                        message.isFromMe
                          ? "bg-green-500 text-white"
                          : "bg-white text-gray-900 border border-gray-200"
                      )}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        // Show context menu
                      }}
                    >
                      {/* Message actions - show on hover */}
                      <div className={cn(
                        "absolute -top-8 right-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg p-1",
                        message.isFromMe ? "right-0" : "left-0"
                      )}>
                        <button
                          onClick={() => replyToMessage(message)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-600"
                          title="Reply"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => forwardMessage(message)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-600"
                          title="Forward"
                        >
                          <Forward className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => starMessage(message.id)}
                          className={cn(
                            "p-1 hover:bg-gray-100 rounded",
                            message.isStarred ? "text-yellow-500" : "text-gray-600"
                          )}
                          title={message.isStarred ? "Unstar" : "Star"}
                        >
                          <Star className={cn("w-3 h-3", message.isStarred && "fill-current")} />
                        </button>
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="p-1 hover:bg-gray-100 rounded text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Quoted message */}
                      {message.quotedMessage && (
                        <div className={cn(
                          "mb-2 p-2 rounded border-l-4",
                          message.isFromMe
                            ? "bg-green-600 border-green-300"
                            : "bg-gray-100 border-gray-400"
                        )}>
                          <p className={cn(
                            "text-xs font-medium",
                            message.isFromMe ? "text-green-100" : "text-gray-600"
                          )}>
                            {message.quotedMessage.isFromMe ? 'You' : selectedChatInfo.contact.name}
                          </p>
                          <p className={cn(
                            "text-sm truncate",
                            message.isFromMe ? "text-green-100" : "text-gray-700"
                          )}>
                            {message.quotedMessage.content}
                          </p>
                        </div>
                      )}

                      {/* Message content */}
                      <div className="message-content">
                        {renderMessageContent(message)}
                      </div>

                      {/* Message footer */}
                      <div className={cn(
                        "flex items-center justify-end space-x-1 mt-1",
                        message.isFromMe ? "text-green-100" : "text-gray-500"
                      )}>
                        {message.isForwarded && (
                          <Forward className="w-3 h-3" />
                        )}
                        {message.isStarred && (
                          <Star className="w-3 h-3 fill-current" />
                        )}
                        <span className="text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.isFromMe && (
                          <span className="ml-1">
                            {renderMessageStatus(message.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-3">
                {/* Attachment button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                {/* Message input */}
                <div className="flex-1 relative">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    disabled={!connected}
                  />
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Send button */}
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !connected}
                  className={cn(
                    "p-3 rounded-lg transition-colors",
                    newMessage.trim() && connected
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Connection status */}
              {!connected && (
                <div className="flex items-center justify-center mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Disconnected - Reconnecting...
                </div>
              )}
              
              {/* Error display */}
              {error && (
                <div className="flex items-center justify-between mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {error}
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  Array.from(files).forEach(file => {
                    sendMediaMessage(file)
                  })
                  // Reset input
                  e.target.value = ''
                }
              }}
            />
          </>
        ) : !selectedSession ? (
          /* No session selected */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Welcome to WhatsApp Inbox
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Select a WhatsApp session from the sidebar to start viewing and managing your conversations
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure messaging</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Zap className="w-4 h-4" />
                  <span>Real-time sync</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>Multi-session support</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No chat selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a chat to start messaging
              </h3>
              <p className="text-gray-500 mb-4">
                Choose a conversation from the sidebar to begin
              </p>
              <div className="text-sm text-gray-400">
                Session: {sessions.find(s => s.id === selectedSession)?.name}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
