'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { WhatsAppManagerClient, SessionStatus, MessageData } from '@/lib/whatsapp-manager'
import ChatWindow from './ChatWindow'
import { Button } from '@/components/ui/Button'
// Removed framer-motion for lighter UI
import {
  Smartphone,
  MessageCircle,
  Users,
  Search,
  RefreshCw,
  Phone,
  CheckCircle,
  Clock,
  Video,
  MoreVertical,
  Archive,
  Settings,
  Bell,
  Filter,
  SlidersHorizontal,
  Star,
  Pin,
  VolumeX,
  Zap,
  Sparkles,
  Wifi,
  WifiOff,
  Circle,
  ChevronDown,
  Plus,
  X,
  Maximize2,
  Minimize2,
  MessageSquarePlus,
  Send
} from 'lucide-react'

interface InboxProps {
  whatsappManager: WhatsAppManagerClient
  sessions: SessionStatus[]
  selectedSession: string | null
  onSessionSelected: (sessionId: string) => void
}

interface Chat {
  id: string
  name: string
  isGroup: boolean
  unreadCount: number
  whatsappNumberId: string
  phoneNumber?: string
  lastMessage?: {
    body: string
    timestamp: number
    from: string
  }
  isPinned?: boolean
  isMuted?: boolean
  isOnline?: boolean
  lastSeen?: number
  avatar?: string
  status?: string
}

export default function Inbox({
  whatsappManager,
  sessions,
  selectedSession,
  onSessionSelected
}: InboxProps) {
  const [mounted, setMounted] = useState(false)
  const [allChats, setAllChats] = useState<Chat[]>([])
  const [filteredChats, setFilteredChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<MessageData[]>([])

  const [selectedWhatsAppNumberFilter, setSelectedWhatsAppNumberFilter] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false) // Disabled by default
  const [sidebarWidth, setSidebarWidth] = useState(500)
  const [showArchived, setShowArchived] = useState(false)
  const [archivedChats, setArchivedChats] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all')

  // New advanced states
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [pinnedChats, setPinnedChats] = useState<string[]>([])
  const [mutedChats, setMutedChats] = useState<string[]>([])
  const [isCompactMode, setIsCompactMode] = useState(false)

  // Derived state for session filtering
  const readySessions = sessions.filter(session => session.status === 'ready' || session.status === 'connected')
  const connectingSessions = sessions.filter(session =>
    session.status === 'connecting' ||
    session.status === 'initializing' ||
    session.status === 'qr_code' ||
    session.status === 'scanning'
  )
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'unread'>('time')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Initialize mounted state and load localStorage values
  useEffect(() => {
    setMounted(true)

    // Load localStorage values after mounting
    if (typeof window !== 'undefined') {
      const savedArchived = localStorage.getItem('archivedChats')
      if (savedArchived) setArchivedChats(JSON.parse(savedArchived))

      const savedActiveTab = localStorage.getItem('activeTab') as 'all' | 'unread' | 'archived'
      if (savedActiveTab) setActiveTab(savedActiveTab)

      const savedPinned = localStorage.getItem('pinnedChats')
      if (savedPinned) setPinnedChats(JSON.parse(savedPinned))

      const savedMuted = localStorage.getItem('mutedChats')
      if (savedMuted) setMutedChats(JSON.parse(savedMuted))

      const savedCompact = localStorage.getItem('compactMode')
      if (savedCompact) setIsCompactMode(savedCompact === 'true')
    }
  }, [])

  // Load all chats from all connected sessions
  useEffect(() => {
    if (!mounted) return
    console.log('🔄 Sessions changed, reloading chats...', sessions.length, 'sessions')
    console.log('📊 Sessions status:', sessions.map(s => `${s.name}: ${s.status}`))

    if (sessions.length > 0) {
      loadAllChats()
    } else {
      console.log('⚠️ No sessions available')
      setAllChats([])
    }

    // Auto-refresh disabled - manual sync only
    // const interval = setInterval(() => {
    //   if (sessions.length > 0 && readySessions.length > 0) {
    //     console.log('🔄 Auto-refreshing chats...')
    //     loadAllChats()
    //   }
    // }, 30000) // Refresh every 30 seconds

    // return () => {
    //   if (interval) clearInterval(interval)
    // }
  }, [sessions, mounted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Enhanced filter chats based on search, session, and active tab
  useEffect(() => {
    let filtered = allChats

    // Filter by tab
    if (activeTab === 'archived') {
      filtered = filtered.filter(chat => archivedChats.includes(chat.id))
    } else if (activeTab === 'unread') {
      filtered = filtered.filter(chat => chat.unreadCount > 0 && !archivedChats.includes(chat.id))
    } else {
      // 'all' tab - exclude archived chats
      filtered = filtered.filter(chat => !archivedChats.includes(chat.id))
    }

    // Filter by WhatsApp number if selected
    if (selectedWhatsAppNumberFilter) {
      filtered = filtered.filter(chat => chat.whatsappNumberId === selectedWhatsAppNumberFilter)
    }

    // Enhanced search functionality
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(chat => {
        // Search in chat name
        const nameMatch = chat.name.toLowerCase().includes(query)

        // Search in phone number
        const phoneMatch = chat.phoneNumber?.toLowerCase().includes(query)

        // Search in last message
        const messageMatch = chat.lastMessage?.body?.toLowerCase().includes(query)

        // Search in WhatsApp number name
        const whatsappNumberMatch = getWhatsAppNumberName(chat.whatsappNumberId).toLowerCase().includes(query)

        return nameMatch || phoneMatch || messageMatch || whatsappNumberMatch
      })
    }

    // Enhanced sorting
    filtered.sort((a, b) => {
      // First, prioritize pinned chats
      const aPinned = pinnedChats.includes(a.id)
      const bPinned = pinnedChats.includes(b.id)

      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1

      // Then sort by sortBy preference
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'unread':
          return b.unreadCount - a.unreadCount
        case 'time':
        default:
          const aTime = a.lastMessage?.timestamp || 0
          const bTime = b.lastMessage?.timestamp || 0
          return bTime - aTime
      }
    })

    setFilteredChats(filtered)
  }, [allChats, selectedWhatsAppNumberFilter, activeTab, archivedChats, searchQuery, pinnedChats, sortBy])

  // Setup real-time message listeners
  useEffect(() => {
    console.log('🔄 Setting up real-time message listeners...')

    // Initialize socket if not already done
    if (!whatsappManager.socket) {
      console.log('🔌 Initializing socket connection...')
      whatsappManager.initializeSocket()
    }

    // Listen for new messages from any session
    whatsappManager.onNewMessage((message) => {
      console.log('📨 New message received:', message)

      // Update messages if it's for current chat
      if (selectedChat && (message.from === selectedChat || message.to === selectedChat)) {
        console.log('✅ Message is for current chat, adding to messages')
        setMessages(prev => [...prev, message])
      }

      // Update chat list with new message for all sessions
      setAllChats(prev => prev.map(chat => {
        if ((chat.id === message.from || chat.id === message.to) && chat.whatsappNumberId === message.sessionId) {
          return {
            ...chat,
            lastMessage: {
              body: message.body,
              timestamp: message.timestamp,
              from: message.from
            },
            unreadCount: chat.id === selectedChat ? chat.unreadCount : chat.unreadCount + 1
          }
        }
        return chat
      }))

      // If no existing chat found, reload all chats to get new contact
      const existingChat = prev => prev.find(chat =>
        (chat.id === message.from || chat.id === message.to) && chat.whatsappNumberId === message.sessionId
      )
      if (!existingChat) {
        console.log('🆕 New contact detected, reloading chats...')
        setTimeout(loadAllChats, 1000)
      }
    })

    // Listen for session status changes
    whatsappManager.onClientReady((data) => {
      console.log('🎉 Session ready:', data.sessionId)
      setTimeout(() => {
        console.log('🔄 Reloading chats after session ready...')
        loadAllChats()
      }, 2000) // Reload chats when session becomes ready
    })

    // Listen for session disconnections
    whatsappManager.onClientDisconnected?.((data) => {
      console.log('❌ Session disconnected:', data.sessionId)
      setTimeout(() => {
        console.log('🔄 Reloading chats after session disconnect...')
        loadAllChats()
      }, 1000)
    })

    // Listen for chat updates (new contacts, updated last messages)
    whatsappManager.onChatUpdated((chatData) => {
      console.log('📊 Chat updated:', chatData)

      // Update existing chat or add new one
      setAllChats(prev => {
        const existingIndex = prev.findIndex(chat =>
          chat.id === chatData.id && chat.whatsappNumberId === chatData.sessionId
        )

        if (existingIndex !== -1) {
          // Update existing chat
          const updated = [...prev]
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...chatData,
            phoneNumber: prev[existingIndex].phoneNumber // Keep existing phone number
          }
          return updated
        } else {
          // Add new chat
          const newChat = {
            ...chatData,
            phoneNumber: sessions.find(s => s.id === chatData.sessionId)?.phoneNumber
          }
          return [newChat, ...prev]
        }
      })
    })

  }, [whatsappManager, selectedChat, sessions])

  // Load all chats from all connected sessions
  const loadAllChats = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading chats from all sessions...')

      const allChatsData: Chat[] = []

      // Get chats from each connected session
      for (const session of sessions) {
        if (session.status === 'ready') {
          console.log(`📱 Loading chats for session: ${session.name} (${session.id})`)

          try {
            const sessionChats = await whatsappManager.getChats(session.id)

            // Add session info to each chat
            const chatsWithSession = sessionChats.map(chat => ({
              ...chat,
              whatsappNumberId: session.id,
              phoneNumber: session.phoneNumber
            }))

            allChatsData.push(...chatsWithSession)
            console.log(`✅ Loaded ${chatsWithSession.length} chats for ${session.name}`)
          } catch (error) {
            console.error(`❌ Failed to load chats for session ${session.name}:`, error)
          }
        } else {
          console.log(`⚠️ Session ${session.name} not ready (${session.status})`)
        }
      }

      console.log(`📊 Total chats loaded: ${allChatsData.length}`)
      setAllChats(allChatsData)

    } catch (error) {
      console.error('❌ Error loading all chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadChatMessages = async (chatId: string, whatsappNumberId: string) => {
    try {
      console.log(`📨 Loading messages for chat: ${chatId} in WhatsApp number: ${whatsappNumberId}`)
      setMessages([]) // Clear previous messages

      const chatMessages = await whatsappManager.getChatMessages(whatsappNumberId, chatId)
      console.log(`📊 Raw messages from API:`, chatMessages)

      if (chatMessages && chatMessages.length > 0) {
        // Format messages properly for ChatWindow
        const formattedMessages: MessageData[] = chatMessages.map((msg: any) => ({
          id: msg.id || msg.whatsapp_message_id || `msg_${msg.timestamp || 0}_${msg.from || 'unknown'}`,
          sessionId: msg.session_id || whatsappNumberId,
          body: msg.body || msg.message_content || '',
          from: msg.from_number || msg.from || chatId,
          to: msg.to_number || msg.to || 'self',
          timestamp: msg.timestamp ? parseInt(msg.timestamp) : 0,
          type: msg.message_type || 'text',
          isGroupMsg: msg.is_group_message || false,
          author: msg.author,
          mediaUrl: msg.media_url,
          filename: msg.filename,
          fileSize: msg.file_size,
          mimeType: msg.mime_type
        }))

        console.log(`✅ Formatted ${formattedMessages.length} messages for chat`)
        setMessages(formattedMessages)
      } else {
        console.log('📭 No messages found for this chat')
        setMessages([])
      }
    } catch (error) {
      console.error('❌ Error loading chat messages:', error)
      setMessages([])
    }
  }

  const handleChatSelect = (chat: Chat) => {
    console.log(`🎯 Selected chat: ${chat.name} (${chat.id}) from WhatsApp number: ${chat.whatsappNumberId}`)
    setSelectedChat(chat.id)
    loadChatMessages(chat.id, chat.whatsappNumberId)

    // Mark chat as read
    setAllChats(prev => prev.map(c =>
      c.id === chat.id && c.whatsappNumberId === chat.whatsappNumberId ? { ...c, unreadCount: 0 } : c
    ))
  }

  const handleSendMessage = async (message: string, mediaFile?: File): Promise<void> => {
    if (!selectedChat) {
      throw new Error('No chat selected')
    }

    // Find the session for the selected chat
    const chat = filteredChats.find(c => c.id === selectedChat)
    if (!chat) {
      throw new Error('Chat not found')
    }

    try {
      console.log(`📤 Sending message to: ${chat.name} via WhatsApp number: ${chat.whatsappNumberId}`)

      if (mediaFile) {
        // Handle media file upload
        const formData = new FormData()
        formData.append('file', mediaFile)
        formData.append('sessionId', chat.whatsappNumberId)
        formData.append('to', selectedChat)
        formData.append('caption', message)

        const response = await fetch('/api/messages/send-media', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        if (result.success) {
          console.log('✅ Media message sent successfully')
          // Show success toast
          if (typeof window !== 'undefined' && (window as any).toast) {
            (window as any).toast.success('Media Sent', 'Your media file has been sent successfully')
          }
        } else {
          console.error('❌ Failed to send media:', result.message)
          if (typeof window !== 'undefined' && (window as any).toast) {
            (window as any).toast.error('Failed to Send Media', result.message || 'Unknown error')
          }
          throw new Error(result.message || 'Failed to send media')
        }
      } else {
        // Handle text message
        const result = await whatsappManager.sendMessage(chat.whatsappNumberId, selectedChat, message)
        if (result.success) {
          console.log('✅ Message sent successfully')
          // Show success toast
          if (typeof window !== 'undefined' && (window as any).toast) {
            (window as any).toast.success('Message Sent', 'Your message has been delivered')
          }
        } else {
          console.error('❌ Failed to send message:', result.message)
          if (typeof window !== 'undefined' && (window as any).toast) {
            (window as any).toast.error('Failed to Send', result.message || 'Message could not be sent')
          }
          throw new Error(result.message || 'Failed to send message')
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      // Show error toast only for actual failures
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error('Error', 'Something went wrong while sending the message')
      }
      // Don't re-throw since message might have been sent successfully
    }
  }

  // Get WhatsApp number name for a chat
  const getWhatsAppNumberName = (whatsappNumberId: string) => {
    const whatsappNumber = sessions.find(s => s.id === whatsappNumberId)
    return whatsappNumber?.name || 'Unknown WhatsApp Number'
  }

  // Archive/Unarchive chat functions
  const handleArchiveChat = (chatId: string) => {
    const newArchivedChats = [...archivedChats, chatId]
    setArchivedChats(newArchivedChats)
    localStorage.setItem('archivedChats', JSON.stringify(newArchivedChats))
    if (selectedChat === chatId) {
      setSelectedChat(null)
    }
  }

  const handleUnarchiveChat = (chatId: string) => {
    const newArchivedChats = archivedChats.filter(id => id !== chatId)
    setArchivedChats(newArchivedChats)
    localStorage.setItem('archivedChats', JSON.stringify(newArchivedChats))
  }

  // Enhanced sidebar width handler
  const handleSidebarWidthChange = (width: number) => {
    // Ensure width is within bounds
    const clampedWidth = Math.max(300, Math.min(600, width))
    setSidebarWidth(clampedWidth)

    // Save to localStorage if available
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarWidth', clampedWidth.toString())
    }
  }

  // Mouse drag functionality for sidebar resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const startX = e.clientX
    const startWidth = sidebarWidth

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const newWidth = startWidth + deltaX
      handleSidebarWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Save active tab to localStorage
  const handleTabChange = (tab: 'all' | 'unread' | 'archived') => {
    setActiveTab(tab)
    localStorage.setItem('activeTab', tab)
  }

  // Get connected WhatsApp numbers count
  const connectedWhatsAppNumbers = sessions.filter(s => s.status === 'ready')
  const totalChats = allChats.filter(c => !archivedChats.includes(c.id)).length
  const unreadChats = allChats.filter(c => c.unreadCount > 0 && !archivedChats.includes(c.id)).length
  const archivedCount = archivedChats.length

  // Enhanced WhatsApp number status check
  const readyWhatsAppNumbers = sessions.filter(s => s.status === 'ready')
  const connectingWhatsAppNumbers = sessions.filter(s => s.status === 'connecting' || s.status === 'qr')

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">
          No active WhatsApp numbers available. Please create and connect a WhatsApp number first.
        </div>
        <div className="mt-4">
          <button
            onClick={() => window.location.href = '/whatsapp-numbers'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Manage WhatsApp Numbers
          </button>
        </div>
      </div>
    )
  }

  if (readySessions.length === 0 && connectingSessions.length > 0) {
    return (
      <div className="text-center py-12">
        <div className="text-yellow-600 text-lg">
          Sessions are connecting... Please wait.
        </div>
        <div className="text-gray-500 mt-2">
          {connectingSessions.length} session(s) connecting
        </div>
        <div className="mt-4">
          <button
            onClick={loadAllChats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Again'}
          </button>
        </div>
      </div>
    )
  }

  if (readySessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">
          No connected sessions found.
        </div>
        <div className="text-gray-500 mt-2">
          Please check your WhatsApp sessions and ensure they are connected.
        </div>
        <div className="mt-4 space-x-2">
          <button
            onClick={loadAllChats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => window.location.href = '/whatsapp-numbers'}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Manage Sessions
          </button>
        </div>
      </div>
    )
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="flex items-center justify-center w-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex h-full ${
        isFullscreen ? 'fixed inset-0 z-50 bg-black/95 backdrop-blur-xl' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'
      }`}
    >
      {/* Ultra-Modern Sidebar */}
      <div
        className={`${isFullscreen ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col shadow-sm`}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Professional Header */}
        <div className={`border-b ${isFullscreen ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="relative">
            {/* Professional Top Tabs Section */}
            <div className={`${isFullscreen ? 'bg-gray-800' : 'bg-gray-50'} border-b ${isFullscreen ? 'border-gray-700' : 'border-gray-200'}`}>

              <div className="flex p-3">
                {[
                  { key: 'all', label: 'All Chats', count: totalChats, icon: MessageCircle },
                  { key: 'unread', label: 'Unread', count: unreadChats, icon: Circle },
                  { key: 'archived', label: 'Archived', count: archivedCount, icon: Archive }
                ].map((tab, index) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key as 'all' | 'unread' | 'archived')}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg mx-1 transition-colors ${
                      activeTab === tab.key
                        ? isFullscreen
                          ? 'text-white bg-gray-700 shadow-sm'
                          : 'text-gray-900 bg-white shadow-sm border border-gray-200'
                        : isFullscreen
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <tab.icon size={16} />
                      <span className="font-medium">{tab.label}</span>
                      {tab.count > 0 && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium min-w-[20px] text-center ${
                            activeTab === tab.key
                              ? isFullscreen
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-200 text-gray-800'
                              : isFullscreen
                                ? 'bg-gray-600 text-gray-300'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tab.count > 999 ? '999+' : tab.count}
                        </span>
                      )}
                    </div>

                  </button>
                ))}
              </div>
            </div>

            {/* Actions and Status Section */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`text-sm font-medium ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                  {mounted ? `${readySessions.length} Session${readySessions.length !== 1 ? 's' : ''} Online` : 'Loading...'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsCompactMode(!isCompactMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    isCompactMode
                      ? isFullscreen
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-800'
                      : isFullscreen
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title={isCompactMode ? 'Compact mode on' : 'Compact mode off'}
                >
                  <SlidersHorizontal size={16} />
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className={`p-2 rounded-lg transition-colors ${
                    isFullscreen
                      ? 'bg-gray-700 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </div>

            {/* Session Dropdown and Search Section */}
            <div className={`p-4 border-b ${isFullscreen ? 'border-gray-700' : 'border-gray-200'} space-y-3`}>
              {/* Session Filter */}
              <div className="relative">
                <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                  isFullscreen ? 'text-gray-400' : 'text-gray-500'
                }`} size={16} />
                <select
                  value={selectedWhatsAppNumberFilter || ''}
                  onChange={(e) => setSelectedWhatsAppNumberFilter(e.target.value || null)}
                  className={`w-full p-3 pr-10 rounded-lg text-sm font-medium appearance-none cursor-pointer border transition-colors ${
                    isFullscreen
                      ? 'bg-gray-800 border-gray-600 text-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 hover:bg-gray-750'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50'
                  } focus:outline-none`}
                >
                  <option value="" className={isFullscreen ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}>All WhatsApp Numbers ({mounted ? connectedWhatsAppNumbers.length : 0})</option>
                  {connectedWhatsAppNumbers.map(whatsappNumber => (
                    <option key={whatsappNumber.id} value={whatsappNumber.id} className={isFullscreen ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}>
                      {whatsappNumber.name} {whatsappNumber.phoneNumber ? `(${whatsappNumber.phoneNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isFullscreen ? 'text-gray-400' : 'text-gray-500'
                }`} size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search conversations, contacts, messages..."
                  className={`w-full pl-10 pr-10 py-3 rounded-lg text-sm font-medium border transition-colors ${
                    isFullscreen
                      ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                      isFullscreen
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <X size={14} />
                  </button>
                )}
                {searchQuery && (
                  <div className={`mt-2 text-xs font-medium ${
                    isFullscreen ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {mounted ? `${filteredChats.length} result${filteredChats.length !== 1 ? 's' : ''} found` : 'Searching...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats and Actions Bar */}
        <div className={`p-4 border-b ${isFullscreen ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            {/* Status Section */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${mounted && connectedWhatsAppNumbers.length > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <span className={`text-sm font-medium ${isFullscreen ? 'text-gray-200' : 'text-gray-800'}`}>
                  {mounted ? `${connectedWhatsAppNumbers.length} WhatsApp Numbers Online` : 'Loading...'}
                </span>
                <div className={`text-xs ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                  {mounted ? `${filteredChats.length} conversations • ${unreadChats} unread` : 'Loading...'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={loadAllChats}
                disabled={loading}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isFullscreen
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <RefreshCw size={14} />
                <span>Sync</span>
              </button>

              <button
                onClick={() => {
                  console.log('New chat clicked')
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isFullscreen
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title="Start New Chat"
              >
                <MessageSquarePlus size={14} />
                <span>New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Toggles */}
        <div className={`p-3 border-b ${isFullscreen ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showOnlineOnly
                    ? isFullscreen
                      ? 'bg-green-600 text-white'
                      : 'bg-green-600 text-white'
                    : isFullscreen
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {showOnlineOnly ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span>Online Only</span>
              </button>

              <button
                onClick={() => setIsCompactMode(!isCompactMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCompactMode
                    ? isFullscreen
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isFullscreen
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Compact</span>
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                Sort:
              </span>
              <div className="flex items-center space-x-1">
                {[
                  { key: 'time', label: 'Time', icon: Clock },
                  { key: 'name', label: 'Name', icon: Users },
                  { key: 'unread', label: 'Unread', icon: Circle }
                ].map((sort, index) => (
                  <button
                    key={sort.key}
                    onClick={() => setSortBy(sort.key as 'time' | 'name' | 'unread')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      sortBy === sort.key
                        ? isFullscreen
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                        : isFullscreen
                          ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <sort.icon size={12} />
                    <span>{sort.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mb-4 ${
                isFullscreen ? 'border-gray-400' : 'border-blue-500'
              }`} />
              <span className={`text-sm font-medium ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading conversations...
              </span>
            </div>
          ) : !mounted ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className={`text-sm font-medium ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading...
              </span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isFullscreen ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <MessageCircle size={24} className={`${isFullscreen ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isFullscreen ? 'text-gray-200' : 'text-gray-900'}`}>
                No Conversations Found
              </h3>
              <p className={`text-sm text-center max-w-xs ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchQuery ? 'No chats match your search criteria' : 'Start a new conversation to see it here'}
              </p>
            </div>
          ) : (
            <div>
              {filteredChats.map((chat, index) => (
                <div
                  key={`${chat.whatsappNumberId}-${chat.id}`}
                  className={`cursor-pointer border-b transition-colors ${
                    selectedChat === chat.id
                      ? isFullscreen
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-blue-50 border-blue-200'
                      : isFullscreen
                        ? 'hover:bg-gray-800 border-gray-700'
                        : 'hover:bg-gray-50 border-gray-200'
                  } ${isCompactMode ? 'py-2' : 'py-3'}`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex items-center px-4">
                    {/* Avatar */}
                    <div className={`relative ${isCompactMode ? 'w-10 h-10' : 'w-12 h-12'} rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                      chat.isGroup
                        ? isFullscreen ? 'bg-purple-600' : 'bg-purple-500'
                        : isFullscreen ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      {chat.isGroup ? (
                        <Users size={isCompactMode ? 14 : 16} className="text-white" />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {chat.name.charAt(0).toUpperCase()}
                        </span>
                      )}

                      {/* Online Status */}
                      {chat.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}

                      {/* Pinned Indicator */}
                      {pinnedChats.includes(chat.id) && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Pin size={6} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Enhanced Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <h3 className={`font-semibold truncate ${
                            isFullscreen ? 'text-white' : 'text-gray-900'
                          } ${isCompactMode ? 'text-sm' : 'text-base'}`}>
                            {chat.name}
                          </h3>

                          {/* Status Indicators */}
                          <div className="flex items-center space-x-1">
                            {mutedChats.includes(chat.id) && (
                              <VolumeX size={12} className={`${isFullscreen ? 'text-white/50' : 'text-gray-400'}`} />
                            )}
                            {chat.isGroup && (
                              <Users size={12} className={`${isFullscreen ? 'text-blue-400' : 'text-blue-500'}`} />
                            )}
                            {pinnedChats.includes(chat.id) && (
                              <Pin size={12} className={`${isFullscreen ? 'text-yellow-400' : 'text-yellow-500'}`} />
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          {chat.lastMessage && (
                            <span
                              className={`text-xs font-medium ${
                                isFullscreen ? 'text-white/60' : 'text-gray-500'
                              }`}
                            >
                              {chat.lastMessage.timestamp ?
                                new Date(chat.lastMessage.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }) : '--:--'
                              }
                            </span>
                          )}

                          {chat.unreadCount > 0 && (
                            <span
                              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-bold shadow-lg"
                            >
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Last Message */}
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${
                            isFullscreen ? 'text-white/70' : 'text-gray-600'
                          } ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
                            {chat.lastMessage ? (
                              <>
                                {chat.lastMessage.from !== 'me' && chat.isGroup && (
                                  <span className={`font-medium mr-1 ${
                                    isFullscreen ? 'text-blue-400' : 'text-blue-600'
                                  }`}>
                                    {chat.lastMessage.from.split('@')[0]}:
                                  </span>
                                )}
                                {chat.lastMessage.body || '📎 Media'}
                              </>
                            ) : (
                              <span className={`italic ${
                                isFullscreen ? 'text-white/50' : 'text-gray-400'
                              }`}>
                                No messages yet
                              </span>
                            )}
                          </p>

                          {!isCompactMode && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                isFullscreen
                                  ? 'bg-white/10 text-white/60'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                📱 {getWhatsAppNumberName(chat.whatsappNumberId)}
                              </span>

                              {chat.isOnline && (
                                <span className={`text-xs flex items-center space-x-1 ${
                                  isFullscreen ? 'text-green-400' : 'text-green-600'
                                }`}>
                                  <div className="w-2 h-2 bg-green-500 rounded-full "></div>
                                  <span>Online</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Action Buttons */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                    {/* Pin Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle pin toggle
                      }}
                      className={`p-2 rounded-xl ${
                        pinnedChats.includes(chat.id)
                          ? isFullscreen
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-yellow-100 text-yellow-600'
                          : isFullscreen
                            ? 'hover:bg-white/10 text-white/60'
                            : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title={pinnedChats.includes(chat.id) ? 'Unpin Chat' : 'Pin Chat'}
                    >
                      <Pin size={14} />
                    </button>

                    {/* Mute Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle mute toggle
                      }}
                      className={`p-2 rounded-xl ${
                        mutedChats.includes(chat.id)
                          ? isFullscreen
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-red-100 text-red-600'
                          : isFullscreen
                            ? 'hover:bg-white/10 text-white/60'
                            : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title={mutedChats.includes(chat.id) ? 'Unmute Chat' : 'Mute Chat'}
                    >
                      {mutedChats.includes(chat.id) ? <VolumeX size={14} /> : <Bell size={14} />}
                    </button>

                    {/* Archive Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (activeTab === 'archived') {
                          handleUnarchiveChat(chat.id)
                        } else {
                          handleArchiveChat(chat.id)
                        }
                      }}
                      className={`p-2 rounded-xl ${
                        activeTab === 'archived'
                          ? isFullscreen
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-green-100 text-green-600'
                          : isFullscreen
                            ? 'hover:bg-white/10 text-white/60'
                            : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title={activeTab === 'archived' ? 'Unarchive Chat' : 'Archive Chat'}
                    >
                      <Archive size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Sidebar Resizer */}
      <div
        className={`w-4 cursor-col-resize flex flex-col items-center justify-center group relative select-none ${
          isDragging
            ? isFullscreen ? 'bg-white/20' : 'bg-blue-200'
            : isFullscreen ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
        } border-l border-r ${
          isFullscreen ? 'border-white/10' : 'border-gray-200'
        } ${isDragging ? 'scale-105' : ''}`}
        title={`Sidebar Width: ${sidebarWidth}px (Drag to resize)`}
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      >
        {/* Visual Grip Lines */}
        <div className="flex flex-col space-y-1 pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-0.5 h-3 rounded-full ${
                isDragging
                  ? isFullscreen ? 'bg-white/70' : 'bg-blue-500'
                  : isFullscreen ? 'bg-white/30 group-hover:bg-white/50' : 'bg-gray-400 group-hover:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Alternative Range Input */}
        <input
          type="range"
          min="300"
          max="600"
          step="5"
          value={sidebarWidth}
          onChange={(e) => handleSidebarWidthChange(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-col-resize w-full h-full pointer-events-auto"
          style={{ writingMode: 'bt-lr' }}
        />

        {/* Width Indicator */}
        <div>
          {(isDragging || false) && (
            <div
              className={`absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                isFullscreen
                  ? 'bg-white/20 text-white backdrop-blur-sm border border-white/30'
                  : 'bg-gray-900 text-white shadow-xl border border-gray-700'
              }`}
            >
              {sidebarWidth}px
              <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 ${
                isFullscreen ? 'bg-white/20' : 'bg-gray-900'
              }`} />
            </div>
          )}
        </div>

        {/* Hover Tooltip */}
        <div
          className={`absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none ${
            isFullscreen
              ? 'bg-white/10 text-white/80 backdrop-blur-sm'
              : 'bg-gray-700 text-white shadow-lg'
          }`}
        >
          Drag to resize
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${
        isFullscreen ? 'bg-gray-900' : 'bg-white'
      }`}>
        {selectedChat ? (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className={`p-4 border-b ${
              isFullscreen ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center">
                {/* Avatar */}
                <div className="relative mr-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    filteredChats.find(c => c.id === selectedChat)?.isGroup
                      ? isFullscreen ? 'bg-purple-600' : 'bg-purple-500'
                      : isFullscreen ? 'bg-blue-600' : 'bg-blue-500'
                  }`}>
                    {filteredChats.find(c => c.id === selectedChat)?.isGroup ? (
                      <Users size={18} className="text-white" />
                    ) : (
                      <span className="text-white font-medium text-sm">
                        {filteredChats.find(c => c.id === selectedChat)?.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Online Status */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold mb-1 ${
                    isFullscreen ? 'text-white' : 'text-gray-900'
                  }`}>
                    {filteredChats.find(c => c.id === selectedChat)?.name || 'Unknown'}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      isFullscreen
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getWhatsAppNumberName(filteredChats.find(c => c.id === selectedChat)?.whatsappNumberId || '')}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className={`text-xs font-medium ${
                        isFullscreen ? 'text-green-400' : 'text-green-600'
                      }`}>
                        Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1">
                  {[
                    { icon: Phone, label: 'Voice Call' },
                    { icon: Video, label: 'Video Call' },
                    { icon: MoreVertical, label: 'More Options' }
                  ].map((action, index) => (
                    <button
                      key={action.label}
                      className={`p-2 rounded-lg transition-colors ${
                        isFullscreen
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                      title={action.label}
                    >
                      <action.icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Chat Messages */}
            <div
              className="flex-1 relative"
            >
              <ChatWindow
                messages={messages}
                onSendMessage={handleSendMessage}
                chatName={filteredChats.find(c => c.id === selectedChat)?.name || 'Unknown'}
                isGroup={filteredChats.find(c => c.id === selectedChat)?.isGroup || false}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              {/* Logo */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                isFullscreen ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <MessageCircle size={40} className={`${
                  isFullscreen ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>

              <h2 className={`text-2xl font-semibold mb-3 ${
                isFullscreen ? 'text-white' : 'text-gray-900'
              }`}>
                WhatsApp Pro
              </h2>

              <p className={`text-base mb-4 ${
                isFullscreen ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Professional messaging platform
              </p>

              <p className={`text-sm ${
                isFullscreen ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Select a conversation to start messaging
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center space-x-6">
                {[
                  { icon: CheckCircle, label: 'WhatsApp Numbers', count: mounted ? connectedWhatsAppNumbers.length : 0 },
                  { icon: MessageCircle, label: 'Chats', count: totalChats },
                  ...(unreadChats > 0 ? [{ icon: Circle, label: 'Unread', count: unreadChats }] : [])
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`flex flex-col items-center p-3 rounded-lg ${
                      isFullscreen
                        ? 'bg-gray-800'
                        : 'bg-gray-50'
                    }`}
                  >
                    <stat.icon size={20} className={`${
                      isFullscreen ? 'text-gray-400' : 'text-gray-500'
                    } mb-2`} />
                    <span className={`text-lg font-semibold ${
                      isFullscreen ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stat.count}
                    </span>
                    <span className={`text-xs ${
                      isFullscreen ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
