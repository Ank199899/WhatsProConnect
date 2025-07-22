'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, Send, Search, Filter, MoreVertical, Phone, Video, Paperclip, 
  Smile, Star, Volume2, Archive, Trash2, Pin, Users, Clock, CheckCircle2, 
  Check, Image, FileText, Download, Reply, Forward, Copy, Mic, Play, Pause, 
  X, Eye, Camera, Headphones, File, MapPin, Calendar, Settings, Info,
  ChevronDown, ChevronUp, Zap, Shield, Bell, Hash, AtSign, Globe,
  Maximize2, Minimize2, RotateCcw, Share, Edit3, Bookmark, Flag,
  MessageSquare, PhoneCall, VideoIcon, UserPlus, UserMinus, Crown,
  Verified, Online, Offline, Typing, Recording, Seen, Delivered
} from 'lucide-react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import Card from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import { cn, formatTime, getTimeAgo } from '@/lib/utils'
import { API_BASE_URL, WEBSOCKET_URL } from '@/lib/dynamic-config'

interface UltraAdvancedInboxProps {
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
  avatar?: string
  profilePic?: string
  isOnline: boolean
  lastSeen?: number
  isTyping: boolean
  isRecording: boolean
  isBlocked: boolean
  isBusiness: boolean
  isVerified: boolean
  status?: string
  about?: string
  labels: string[]
  isPinned: boolean
  isMuted: boolean
  isArchived: boolean
  customName?: string
  tags: string[]
  notes?: string
  location?: { lat: number, lng: number, address: string }
  socialLinks?: { platform: string, url: string }[]
}

interface Message {
  id: string
  content: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'gif'
  timestamp: number
  isFromMe: boolean
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  mediaUrl?: string
  thumbnailUrl?: string
  fileName?: string
  fileSize?: number
  duration?: number
  mimeType?: string
  replyTo?: string
  mentions?: string[]
  isForwarded: boolean
  forwardedFrom?: string
  isStarred: boolean
  reactions?: { emoji: string, users: string[] }[]
  editedAt?: number
  deletedAt?: number
  quotedMessage?: Message
  location?: { lat: number, lng: number, address: string }
  contact?: { name: string, phone: string, avatar?: string }
}

interface Conversation {
  id: string
  contact: Contact
  messages: Message[]
  lastMessage?: Message
  unreadCount: number
  lastMessageTime: number
  isGroup: boolean
  groupInfo?: {
    name: string
    description: string
    participants: Contact[]
    admins: string[]
    creator: string
    createdAt: number
    avatar?: string
  }
  draftMessage?: string
  scheduledMessages: Message[]
  autoReplyEnabled: boolean
  aiAgentEnabled: boolean
  businessHours?: { start: string, end: string, timezone: string }
  customFields?: { [key: string]: any }
}

interface ChatState {
  isRecording: boolean
  recordingDuration: number
  selectedMessages: string[]
  replyingTo: Message | null
  editingMessage: string | null
  showEmojiPicker: boolean
  showAttachmentMenu: boolean
  isFullscreen: boolean
  searchQuery: string
  searchResults: Message[]
  currentSearchIndex: number
}

export default function UltraAdvancedInbox_OLD({ 
  whatsappManager, 
  sessions, 
  selectedSession, 
  onSessionSelected 
}: UltraAdvancedInboxProps) {
  // Core State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'pinned' | 'archived' | 'groups'>('all')
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'unread'>('time')
  
  // Chat State
  const [chatState, setChatState] = useState<ChatState>({
    isRecording: false,
    recordingDuration: 0,
    selectedMessages: [],
    replyingTo: null,
    editingMessage: null,
    showEmojiPicker: false,
    showAttachmentMenu: false,
    isFullscreen: false,
    searchQuery: '',
    searchResults: [],
    currentSearchIndex: 0
  })
  
  // Media State
  const [showMediaPreview, setShowMediaPreview] = useState<string | null>(null)
  const [mediaGallery, setMediaGallery] = useState<Message[]>([])
  const [showMediaGallery, setShowMediaGallery] = useState(false)
  
  // Real-time State
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [lastSeenUpdates, setLastSeenUpdates] = useState<Map<string, number>>(new Map())
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  
  // WebSocket connection for real-time updates
  const [socket, setSocket] = useState<WebSocket | null>(null)
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (selectedSession) {
      const ws = new WebSocket(WEBSOCKET_URL)

      ws.onopen = () => {
        console.log('🔌 WebSocket connected to:', WEBSOCKET_URL)
        ws.send(JSON.stringify({ type: 'join', sessionId: selectedSession }))
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleRealtimeUpdate(data)
      }
      
      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected')
      }
      
      setSocket(ws)
      
      return () => {
        ws.close()
      }
    }
  }, [selectedSession])
  
  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'new_message':
        handleNewMessage(data.message)
        break
      case 'message_status_update':
        updateMessageStatus(data.messageId, data.status)
        break
      case 'user_typing':
        setTypingUsers(prev => new Set([...prev, data.userId]))
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.userId)
            return newSet
          })
        }, 3000)
        break
      case 'user_online':
        setOnlineUsers(prev => new Set([...prev, data.userId]))
        break
      case 'user_offline':
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
        setLastSeenUpdates(prev => new Map(prev.set(data.userId, Date.now())))
        break
      case 'contact_updated':
        updateContactInfo(data.contact)
        break
    }
  }, [])
  
  // Load conversations with enhanced data
  const loadConversations = async () => {
    if (!selectedSession) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Loading ultra-advanced conversations for session:', selectedSession)
      
      const response = await fetch(`${API_BASE_URL}/ultra/conversations?sessionId=${selectedSession}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Ultra conversations loaded:', data.length)
        
        // Transform and enhance conversation data
        const enhancedConversations: Conversation[] = await Promise.all(
          data.map(async (conv: any) => {
            // Load contact details
            const contactDetails = await loadContactDetails(conv.contactId, selectedSession)
            
            return {
              id: conv.id || conv.contactId,
              contact: {
                id: conv.contactId,
                name: contactDetails.name || conv.name || conv.phoneNumber || 'Unknown',
                phoneNumber: conv.phoneNumber || conv.contactId,
                avatar: contactDetails.profilePic || conv.avatar,
                profilePic: contactDetails.profilePic,
                isOnline: onlineUsers.has(conv.contactId),
                lastSeen: lastSeenUpdates.get(conv.contactId) || contactDetails.lastSeen,
                isTyping: typingUsers.has(conv.contactId),
                isRecording: false,
                isBlocked: contactDetails.isBlocked || false,
                isBusiness: contactDetails.isBusiness || false,
                isVerified: contactDetails.isVerified || false,
                status: contactDetails.status,
                about: contactDetails.about,
                labels: contactDetails.labels || [],
                isPinned: conv.isPinned || false,
                isMuted: conv.isMuted || false,
                isArchived: conv.isArchived || false,
                customName: contactDetails.customName,
                tags: contactDetails.tags || [],
                notes: contactDetails.notes,
                location: contactDetails.location,
                socialLinks: contactDetails.socialLinks || []
              },
              messages: [],
              lastMessage: conv.lastMessage ? transformMessage(conv.lastMessage) : undefined,
              unreadCount: conv.unreadCount || 0,
              lastMessageTime: conv.lastMessageTime || Date.now(),
              isGroup: conv.isGroup || false,
              groupInfo: conv.groupInfo,
              draftMessage: conv.draftMessage,
              scheduledMessages: conv.scheduledMessages || [],
              autoReplyEnabled: conv.autoReplyEnabled || false,
              aiAgentEnabled: conv.aiAgentEnabled || false,
              businessHours: conv.businessHours,
              customFields: conv.customFields || {}
            }
          })
        )

        setConversations(enhancedConversations)
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to load conversations:', errorText)
        setError(`Failed to load conversations: ${response.status}`)
      }
    } catch (err) {
      console.error('❌ Error loading conversations:', err)
      setError('Network error while loading conversations')
    } finally {
      setLoading(false)
    }
  }

  // Load contact details with profile sync
  const loadContactDetails = async (contactId: string, sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ultra/contact/${contactId}?sessionId=${sessionId}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (err) {
      console.error('❌ Error loading contact details:', err)
    }
    return {}
  }

  // Transform message data
  const transformMessage = (msg: any): Message => ({
    id: msg.id || msg._id,
    content: msg.content || msg.body || '',
    type: msg.type || 'text',
    timestamp: msg.timestamp || Date.now(),
    isFromMe: msg.isFromMe || msg.fromMe || false,
    status: msg.status || 'delivered',
    mediaUrl: msg.mediaUrl || msg.media,
    thumbnailUrl: msg.thumbnailUrl,
    fileName: msg.fileName,
    fileSize: msg.fileSize,
    duration: msg.duration,
    mimeType: msg.mimeType,
    replyTo: msg.replyTo,
    mentions: msg.mentions || [],
    isForwarded: msg.isForwarded || false,
    forwardedFrom: msg.forwardedFrom,
    isStarred: msg.isStarred || false,
    reactions: msg.reactions || [],
    editedAt: msg.editedAt,
    deletedAt: msg.deletedAt,
    quotedMessage: msg.quotedMessage ? transformMessage(msg.quotedMessage) : undefined,
    location: msg.location,
    contact: msg.contact
  })

  // Load messages with enhanced features
  const loadMessages = async (conversationId: string) => {
    if (!selectedSession) return

    try {
      console.log('🔄 Loading ultra messages for conversation:', conversationId)

      const response = await fetch(`${API_BASE_URL}/ultra/messages/${conversationId}?sessionId=${selectedSession}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Ultra messages loaded:', data.length)

        const transformedMessages = data.map(transformMessage)
        setMessages(transformedMessages)

        // Load media gallery
        const mediaMessages = transformedMessages.filter(msg =>
          ['image', 'video', 'document'].includes(msg.type)
        )
        setMediaGallery(mediaMessages)

        scrollToBottom()
      } else {
        console.error('❌ Failed to load messages:', response.status)
      }
    } catch (err) {
      console.error('❌ Error loading messages:', err)
    }
  }

  // Handle new message from real-time
  const handleNewMessage = useCallback((message: any) => {
    const transformedMessage = transformMessage(message)
    setMessages(prev => [...prev, transformedMessage])

    // Update conversation list
    setConversations(prev => prev.map(conv => {
      if (conv.id === message.chatId) {
        return {
          ...conv,
          lastMessage: transformedMessage,
          lastMessageTime: transformedMessage.timestamp,
          unreadCount: transformedMessage.isFromMe ? conv.unreadCount : conv.unreadCount + 1
        }
      }
      return conv
    }))

    scrollToBottom()
  }, [])

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, status: status as any } : msg
    ))
  }, [])

  // Update contact info
  const updateContactInfo = useCallback((contact: any) => {
    setConversations(prev => prev.map(conv => {
      if (conv.contact.id === contact.id) {
        return {
          ...conv,
          contact: { ...conv.contact, ...contact }
        }
      }
      return conv
    }))
  }, [])

  // Send message with advanced features
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !selectedSession) return

    try {
      const messageData = {
        sessionId: selectedSession,
        chatId: selectedConversation,
        message: newMessage.trim(),
        replyTo: chatState.replyingTo?.id,
        mentions: extractMentions(newMessage),
        type: 'text'
      }

      console.log('📤 Sending ultra message:', messageData)

      // Optimistic update
      const tempMessage: Message = {
        id: `temp_${Date.now()}`,
        content: newMessage.trim(),
        type: 'text',
        timestamp: Date.now(),
        isFromMe: true,
        status: 'sending',
        replyTo: chatState.replyingTo?.id,
        mentions: extractMentions(newMessage),
        isForwarded: false,
        isStarred: false,
        reactions: []
      }

      setMessages(prev => [...prev, tempMessage])
      setNewMessage('')
      setChatState(prev => ({ ...prev, replyingTo: null }))
      scrollToBottom()

      const response = await fetch(`${API_BASE_URL}/ultra/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const result = await response.json()
        // Update temp message with real ID
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, id: result.messageId, status: 'sent' }
            : msg
        ))
        console.log('✅ Ultra message sent successfully')
      } else {
        // Mark message as failed
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, status: 'failed' }
            : msg
        ))
        console.error('❌ Failed to send message:', response.status)
      }
    } catch (err) {
      console.error('❌ Error sending message:', err)
    }
  }

  // Extract mentions from message
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1])
    }
    return mentions
  }

  // Send media with advanced processing
  const sendMediaFile = async (file: File) => {
    if (!selectedConversation || !selectedSession) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', selectedSession)
      formData.append('chatId', selectedConversation)
      formData.append('caption', newMessage.trim())

      console.log('📤 Sending ultra media file:', file.name)

      // Create preview message
      const tempMessage: Message = {
        id: `temp_media_${Date.now()}`,
        content: newMessage.trim(),
        type: getMediaType(file.type),
        timestamp: Date.now(),
        isFromMe: true,
        status: 'sending',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        mediaUrl: URL.createObjectURL(file),
        isForwarded: false,
        isStarred: false,
        reactions: []
      }

      setMessages(prev => [...prev, tempMessage])
      setNewMessage('')
      scrollToBottom()

      const response = await fetch(`${API_BASE_URL}/ultra/send-media`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, id: result.messageId, status: 'sent', mediaUrl: result.mediaUrl }
            : msg
        ))
        console.log('✅ Ultra media sent successfully')
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, status: 'failed' }
            : msg
        ))
        console.error('❌ Failed to send media:', response.status)
      }
    } catch (err) {
      console.error('❌ Error sending media:', err)
    }
  }

  // Get media type from MIME type
  const getMediaType = (mimeType: string): Message['type'] => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      if (!conv.contact.name.toLowerCase().includes(searchLower) &&
          !conv.contact.phoneNumber.includes(searchQuery) &&
          !conv.lastMessage?.content.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Type filter
    switch (selectedFilter) {
      case 'unread':
        return conv.unreadCount > 0
      case 'pinned':
        return conv.contact.isPinned
      case 'archived':
        return conv.contact.isArchived
      case 'groups':
        return conv.isGroup
      default:
        return !conv.contact.isArchived
    }
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.contact.name.localeCompare(b.contact.name)
      case 'unread':
        return b.unreadCount - a.unreadCount
      default:
        return b.lastMessageTime - a.lastMessageTime
    }
  })

  // Load conversations when session changes
  useEffect(() => {
    if (selectedSession) {
      loadConversations()
    }
  }, [selectedSession])

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && messageInputRef.current === document.activeElement) {
        e.preventDefault()
        sendMessage()
      }
      if (e.key === 'Escape') {
        setChatState(prev => ({
          ...prev,
          replyingTo: null,
          editingMessage: null,
          showEmojiPicker: false,
          showAttachmentMenu: false
        }))
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [newMessage, selectedConversation, selectedSession])

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Ultra Advanced Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-xl",
        sidebarCollapsed ? "w-16" : "w-96"
      )}>
        {/* Enhanced Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Ultra Inbox</h2>
                  <p className="text-sm opacity-90">Professional WhatsApp Management</p>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30"
            >
              {sidebarCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <div className="mt-4 space-y-3">
              {/* Session Selector */}
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

              {/* Search and Filters */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-70" size={16} />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white bg-opacity-20 border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70"
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
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="flex-1 px-2 py-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded text-white text-sm"
                      >
                        <option value="time" className="text-gray-900">Recent</option>
                        <option value="name" className="text-gray-900">Name</option>
                        <option value="unread" className="text-gray-900">Unread</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Ultra Advanced Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-500 font-medium">{error}</p>
              <Button
                onClick={loadConversations}
                className="mt-4"
                size="sm"
              >
                Retry
              </Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                {selectedSession ? 'No conversations found' : 'Please select a session'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery ? 'Try adjusting your search' : 'Start a new conversation to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 relative group",
                    selectedConversation === conversation.id && "bg-green-50 border-r-4 border-green-500",
                    conversation.contact.isPinned && "bg-yellow-50",
                    !sidebarCollapsed ? "px-4" : "px-2"
                  )}
                  onClick={() => setSelectedConversation(conversation.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center space-x-3">
                    {/* Enhanced Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        "rounded-full flex items-center justify-center text-white font-semibold relative overflow-hidden",
                        !sidebarCollapsed ? "w-12 h-12" : "w-8 h-8"
                      )}>
                        {conversation.contact.profilePic || conversation.contact.avatar ? (
                          <img
                            src={conversation.contact.profilePic || conversation.contact.avatar}
                            alt={conversation.contact.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling!.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div
                          className={cn(
                            "w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center",
                            conversation.contact.profilePic || conversation.contact.avatar ? "hidden" : "flex"
                          )}
                        >
                          {!sidebarCollapsed ? conversation.contact.name.charAt(0).toUpperCase() : conversation.contact.name.charAt(0)}
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="absolute -bottom-1 -right-1 flex items-center space-x-1">
                        {conversation.contact.isOnline && (
                          <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                        {conversation.contact.isTyping && (
                          <div className="w-3 h-3 bg-blue-400 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                        {conversation.contact.isRecording && (
                          <div className="w-3 h-3 bg-red-400 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                      </div>

                      {/* Verification Badge */}
                      {conversation.contact.isVerified && (
                        <div className="absolute -top-1 -right-1">
                          <Verified className="w-4 h-4 text-blue-500 bg-white rounded-full" />
                        </div>
                      )}

                      {/* Business Badge */}
                      {conversation.contact.isBusiness && (
                        <div className="absolute -top-1 -left-1">
                          <Crown className="w-4 h-4 text-yellow-500 bg-white rounded-full" />
                        </div>
                      )}
                    </div>

                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        {/* Contact Info */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {conversation.contact.customName || conversation.contact.name}
                            </h3>
                            {conversation.contact.isPinned && (
                              <Pin className="w-3 h-3 text-yellow-500" />
                            )}
                            {conversation.contact.isMuted && (
                              <Volume2 className="w-3 h-3 text-gray-400" />
                            )}
                            {conversation.isGroup && (
                              <Users className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                            {conversation.lastMessage?.isFromMe && (
                              <div className="flex items-center">
                                {conversation.lastMessage.status === 'sent' && <Check className="w-3 h-3 text-gray-400" />}
                                {conversation.lastMessage.status === 'delivered' && <CheckCircle2 className="w-3 h-3 text-gray-400" />}
                                {conversation.lastMessage.status === 'read' && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                                {conversation.lastMessage.status === 'failed' && <X className="w-3 h-3 text-red-500" />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Last Message */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {conversation.contact.isTyping ? (
                              <div className="flex items-center space-x-1 text-green-500">
                                <div className="flex space-x-1">
                                  <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
                                  <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-sm">typing...</span>
                              </div>
                            ) : conversation.contact.isRecording ? (
                              <div className="flex items-center space-x-1 text-red-500">
                                <Mic className="w-3 h-3 animate-pulse" />
                                <span className="text-sm">recording...</span>
                              </div>
                            ) : (
                              <>
                                {conversation.lastMessage?.type !== 'text' && (
                                  <div className="flex-shrink-0">
                                    {conversation.lastMessage?.type === 'image' && <Image className="w-4 h-4 text-gray-400" />}
                                    {conversation.lastMessage?.type === 'video' && <Video className="w-4 h-4 text-gray-400" />}
                                    {conversation.lastMessage?.type === 'audio' && <Headphones className="w-4 h-4 text-gray-400" />}
                                    {conversation.lastMessage?.type === 'document' && <FileText className="w-4 h-4 text-gray-400" />}
                                    {conversation.lastMessage?.type === 'location' && <MapPin className="w-4 h-4 text-gray-400" />}
                                  </div>
                                )}
                                <p className="text-sm text-gray-600 truncate">
                                  {conversation.lastMessage?.isForwarded && "↪ "}
                                  {conversation.lastMessage?.content || 'No messages'}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Unread Count */}
                          {conversation.unreadCount > 0 && (
                            <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {conversation.contact.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            {conversation.contact.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                            {conversation.contact.tags.length > 2 && (
                              <span className="text-xs text-gray-400">+{conversation.contact.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Actions */}
                    {!sidebarCollapsed && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="p-1">
                          <MoreVertical size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ultra Advanced Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Enhanced Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Contact Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      {filteredConversations.find(c => c.id === selectedConversation)?.contact.profilePic ? (
                        <img
                          src={filteredConversations.find(c => c.id === selectedConversation)?.contact.profilePic}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                          {filteredConversations.find(c => c.id === selectedConversation)?.contact.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {filteredConversations.find(c => c.id === selectedConversation)?.contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">
                        {filteredConversations.find(c => c.id === selectedConversation)?.contact.name}
                      </h3>
                      {filteredConversations.find(c => c.id === selectedConversation)?.contact.isVerified && (
                        <Verified className="w-4 h-4 text-blue-500" />
                      )}
                      {filteredConversations.find(c => c.id === selectedConversation)?.contact.isBusiness && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {filteredConversations.find(c => c.id === selectedConversation)?.contact.isTyping ? (
                        <span className="text-green-500 font-medium">typing...</span>
                      ) : filteredConversations.find(c => c.id === selectedConversation)?.contact.isRecording ? (
                        <span className="text-red-500 font-medium">recording...</span>
                      ) : filteredConversations.find(c => c.id === selectedConversation)?.contact.isOnline ? (
                        <span className="text-green-500 font-medium">Online</span>
                      ) : (
                        <span>
                          Last seen {getTimeAgo(filteredConversations.find(c => c.id === selectedConversation)?.contact.lastSeen || 0)}
                        </span>
                      )}
                      <span>•</span>
                      <span>{filteredConversations.find(c => c.id === selectedConversation)?.contact.phoneNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Chat Actions */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="hover:bg-green-50">
                    <Search size={16} />
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-blue-50">
                    <Phone size={16} />
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-purple-50">
                    <Video size={16} />
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-gray-50">
                    <Info size={16} />
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-gray-50">
                    <MoreVertical size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Ultra Advanced Messages Area */}
            <div
              ref={chatContainerRef}
              className={cn(
                "flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white",
                chatState.isFullscreen && "fixed inset-0 z-50 bg-white"
              )}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {messages.length === 0 ? (
                <div className="text-center mt-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Start a conversation</h3>
                  <p className="text-gray-500">Send a message to begin chatting with {filteredConversations.find(c => c.id === selectedConversation)?.contact.name}</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isFromMe ? "justify-end" : "justify-start"
                    )}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md relative group",
                        message.isFromMe ? "ml-12" : "mr-12"
                      )}
                    >
                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "px-4 py-3 rounded-2xl relative shadow-sm",
                          message.isFromMe
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-md"
                            : "bg-white text-gray-900 border border-gray-200 rounded-bl-md",
                          message.status === 'failed' && "bg-red-100 border-red-200",
                          chatState.selectedMessages.includes(message.id) && "ring-2 ring-blue-500"
                        )}
                        onClick={() => {
                          if (chatState.selectedMessages.length > 0) {
                            setChatState(prev => ({
                              ...prev,
                              selectedMessages: prev.selectedMessages.includes(message.id)
                                ? prev.selectedMessages.filter(id => id !== message.id)
                                : [...prev.selectedMessages, message.id]
                            }))
                          }
                        }}
                      >
                        {/* Reply Indicator */}
                        {message.replyTo && (
                          <div className="mb-2 p-2 bg-black bg-opacity-10 rounded-lg text-xs">
                            <div className="flex items-center space-x-2">
                              <Reply size={12} />
                              <span className="font-semibold">Replying to:</span>
                            </div>
                            <p className="truncate mt-1 opacity-75">
                              {messages.find(m => m.id === message.replyTo)?.content || 'Message'}
                            </p>
                          </div>
                        )}

                        {/* Forwarded Indicator */}
                        {message.isForwarded && (
                          <div className="flex items-center space-x-1 mb-2 text-xs opacity-75">
                            <Forward size={12} />
                            <span>Forwarded</span>
                            {message.forwardedFrom && <span>from {message.forwardedFrom}</span>}
                          </div>
                        )}

                        {/* Message Content */}
                        {message.type === 'text' ? (
                          <div className="break-words">
                            {message.content.split('\n').map((line, i) => (
                              <div key={i}>
                                {line.split(' ').map((word, j) => {
                                  if (word.startsWith('@') && message.mentions?.includes(word.slice(1))) {
                                    return (
                                      <span key={j} className="bg-blue-200 text-blue-800 px-1 rounded">
                                        {word}
                                      </span>
                                    )
                                  }
                                  if (word.startsWith('#')) {
                                    return (
                                      <span key={j} className="text-blue-400 font-medium">
                                        {word}
                                      </span>
                                    )
                                  }
                                  return word + ' '
                                })}
                              </div>
                            ))}
                          </div>
                        ) : message.type === 'image' ? (
                          <div className="space-y-2">
                            <div className="relative group">
                              <img
                                src={message.mediaUrl}
                                alt="Image"
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setShowMediaPreview(message.mediaUrl || '')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                              </div>
                            </div>
                            {message.content && (
                              <p className="break-words">{message.content}</p>
                            )}
                          </div>
                        ) : message.type === 'video' ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <video
                                src={message.mediaUrl}
                                controls
                                className="max-w-full rounded-lg"
                                poster={message.thumbnailUrl}
                              />
                            </div>
                            {message.content && (
                              <p className="break-words">{message.content}</p>
                            )}
                          </div>
                        ) : message.type === 'audio' ? (
                          <div className="flex items-center space-x-3 min-w-[200px]">
                            <Button
                              size="sm"
                              variant="outline"
                              className={cn(
                                "rounded-full p-2",
                                message.isFromMe ? "bg-white bg-opacity-20 border-white border-opacity-30" : ""
                              )}
                            >
                              <Play size={16} />
                            </Button>
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full w-1/3"></div>
                              </div>
                            </div>
                            <span className="text-xs opacity-75">
                              {message.duration || '0:00'}
                            </span>
                          </div>
                        ) : message.type === 'document' ? (
                          <div className="flex items-center space-x-3 p-3 bg-black bg-opacity-10 rounded-lg min-w-[250px]">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <FileText size={20} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{message.fileName}</p>
                              <p className="text-xs opacity-75">
                                {message.fileSize ? `${(message.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Download size={16} />
                            </Button>
                          </div>
                        ) : message.type === 'location' ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 p-3 bg-black bg-opacity-10 rounded-lg">
                              <MapPin size={20} className="text-red-500" />
                              <div>
                                <p className="font-semibold text-sm">Location</p>
                                <p className="text-xs opacity-75">{message.location?.address}</p>
                              </div>
                            </div>
                            {message.content && (
                              <p className="break-words">{message.content}</p>
                            )}
                          </div>
                        ) : null}

                        {/* Message Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            {message.reactions.map((reaction, i) => (
                              <div key={i} className="flex items-center space-x-1 bg-black bg-opacity-10 rounded-full px-2 py-1">
                                <span>{reaction.emoji}</span>
                                <span className="text-xs">{reaction.users.length}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message Info */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            {message.isStarred && (
                              <Star size={12} className="text-yellow-400 fill-current" />
                            )}
                            {message.editedAt && (
                              <span className="text-xs opacity-50">edited</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs opacity-75">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.isFromMe && (
                              <div className="flex items-center">
                                {message.status === 'sending' && (
                                  <Clock size={12} className="text-gray-400 animate-pulse" />
                                )}
                                {message.status === 'sent' && (
                                  <Check size={12} className="text-gray-400" />
                                )}
                                {message.status === 'delivered' && (
                                  <CheckCircle2 size={12} className="text-gray-400" />
                                )}
                                {message.status === 'read' && (
                                  <CheckCircle2 size={12} className="text-blue-400" />
                                )}
                                {message.status === 'failed' && (
                                  <X size={12} className="text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message Actions */}
                      <div className="absolute top-0 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="flex items-center space-x-1 bg-white rounded-lg shadow-lg p-1 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setChatState(prev => ({ ...prev, replyingTo: message }))}
                            className="p-1"
                          >
                            <Reply size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-1"
                          >
                            <Forward size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            className="p-1"
                          >
                            <Copy size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-1"
                          >
                            <Star size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-1"
                          >
                            <MoreVertical size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Bar */}
            <AnimatePresence>
              {chatState.replyingTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Reply className="text-blue-500" size={16} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-800">
                          Replying to {chatState.replyingTo.isFromMe ? 'yourself' : filteredConversations.find(c => c.id === selectedConversation)?.contact.name}
                        </p>
                        <p className="text-sm text-blue-700 truncate max-w-md">
                          {chatState.replyingTo.content}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setChatState(prev => ({ ...prev, replyingTo: null }))}
                      className="text-blue-500 hover:bg-blue-200"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ultra Advanced Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end space-x-3">
                {/* Attachment Button */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChatState(prev => ({ ...prev, showAttachmentMenu: !prev.showAttachmentMenu }))}
                    className="p-2 hover:bg-gray-50"
                  >
                    <Paperclip size={18} />
                  </Button>

                  {/* Attachment Menu */}
                  <AnimatePresence>
                    {chatState.showAttachmentMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[200px]"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              fileInputRef.current?.click()
                              setChatState(prev => ({ ...prev, showAttachmentMenu: false }))
                            }}
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <Image className="text-purple-500 mb-1" size={20} />
                            <span className="text-xs">Photos</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <Camera className="text-blue-500 mb-1" size={20} />
                            <span className="text-xs">Camera</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <FileText className="text-green-500 mb-1" size={20} />
                            <span className="text-xs">Document</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <MapPin className="text-red-500 mb-1" size={20} />
                            <span className="text-xs">Location</span>
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Message Input */}
                <div className="flex-1 relative">
                  <div className="relative">
                    <textarea
                      ref={messageInputRef as any}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-32 min-h-[48px]"
                      rows={1}
                      style={{
                        height: 'auto',
                        minHeight: '48px',
                        maxHeight: '128px'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                      }}
                    />

                    {/* Emoji Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChatState(prev => ({ ...prev, showEmojiPicker: !prev.showEmojiPicker }))}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-50"
                    >
                      <Smile size={16} />
                    </Button>
                  </div>

                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {chatState.showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
                      >
                        <div className="grid grid-cols-8 gap-2">
                          {['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                setNewMessage(prev => prev + emoji)
                                setChatState(prev => ({ ...prev, showEmojiPicker: false }))
                              }}
                              className="p-2 hover:bg-gray-100 rounded text-xl"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Send/Voice Button */}
                {newMessage.trim() ? (
                  <Button
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 p-3 rounded-full"
                  >
                    <Send size={18} />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onMouseDown={() => setChatState(prev => ({ ...prev, isRecording: true }))}
                    onMouseUp={() => setChatState(prev => ({ ...prev, isRecording: false }))}
                    onMouseLeave={() => setChatState(prev => ({ ...prev, isRecording: false }))}
                    className={cn(
                      "p-3 rounded-full transition-all duration-200",
                      chatState.isRecording
                        ? "bg-red-500 text-white scale-110"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <Mic size={18} />
                  </Button>
                )}
              </div>

              {/* Recording Indicator */}
              <AnimatePresence>
                {chatState.isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-3 flex items-center justify-center space-x-2 text-red-500"
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording voice message...</span>
                    <span className="text-sm">00:{chatState.recordingDuration.toString().padStart(2, '0')}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                files.forEach(file => sendMediaFile(file))
                setChatState(prev => ({ ...prev, showAttachmentMenu: false }))
              }}
              className="hidden"
            />
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center max-w-md">
              <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-8">
                <MessageCircle size={64} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Welcome to Ultra Inbox</h3>
              <p className="text-gray-500 mb-6">
                Select a conversation from the sidebar to start messaging with advanced features like real-time sync,
                media sharing, voice messages, and professional contact management.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Zap size={16} />
                  <span>Real-time</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield size={16} />
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Crown size={16} />
                  <span>Professional</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {showMediaPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => setShowMediaPreview(null)}
          >
            <div className="relative max-w-4xl max-h-4xl">
              <img
                src={showMediaPreview}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30"
                >
                  <Download size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30"
                  onClick={() => setShowMediaPreview(null)}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Gallery Modal */}
      <AnimatePresence>
        {showMediaGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50"
          >
            <div className="p-4 flex items-center justify-between text-white">
              <h3 className="text-xl font-semibold">Media Gallery</h3>
              <Button
                variant="outline"
                size="sm"
                className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30"
                onClick={() => setShowMediaGallery(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaGallery.map((media) => (
                  <div key={media.id} className="relative group">
                    <img
                      src={media.mediaUrl}
                      alt="Media"
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setShowMediaPreview(media.mediaUrl || '')
                        setShowMediaGallery(false)
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                      <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
