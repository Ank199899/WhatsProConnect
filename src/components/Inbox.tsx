'use client'

import { useState, useEffect } from 'react'
import { WhatsAppManagerClient, SessionStatus, MessageData } from '@/lib/whatsapp-manager'
import ChatWindow from './ChatWindow'
import { Button } from '@/components/ui/Button'
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
  SlidersHorizontal
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
  sessionId: string
  phoneNumber?: string
  lastMessage?: {
    body: string
    timestamp: number
    from: string
  }
}

export default function Inbox({
  whatsappManager,
  sessions,
  selectedSession,
  onSessionSelected
}: InboxProps) {
  const [allChats, setAllChats] = useState<Chat[]>([])
  const [filteredChats, setFilteredChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<MessageData[]>([])

  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('sidebarWidth') || '500')
    }
    return 500
  })
  const [showArchived, setShowArchived] = useState(false)
  const [archivedChats, setArchivedChats] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('archivedChats')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('activeTab') as 'all' | 'unread' | 'archived') || 'all'
    }
    return 'all'
  })

  // Load all chats from all connected sessions
  useEffect(() => {
    console.log('🔄 Sessions changed, reloading chats...', sessions.length, 'sessions')
    console.log('📊 Sessions status:', sessions.map(s => `${s.name}: ${s.status}`))

    if (sessions.length > 0) {
      loadAllChats()
    } else {
      console.log('⚠️ No sessions available')
      setAllChats([])
    }

    // Auto-refresh for real-time updates
    const interval = setInterval(() => {
      if (sessions.length > 0 && readySessions.length > 0) {
        console.log('🔄 Auto-refreshing chats...')
        loadAllChats()
      }
    }, 30000) // Refresh every 30 seconds

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessions])

  // Filter chats based on search, session, and active tab
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

    // Filter by session if selected
    if (selectedSessionFilter) {
      filtered = filtered.filter(chat => chat.sessionId === selectedSessionFilter)
    }



    // Sort by last message timestamp
    filtered.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || 0
      const bTime = b.lastMessage?.timestamp || 0
      return bTime - aTime
    })

    setFilteredChats(filtered)
  }, [allChats, selectedSessionFilter, activeTab, archivedChats])

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
        if ((chat.id === message.from || chat.id === message.to) && chat.sessionId === message.sessionId) {
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
        (chat.id === message.from || chat.id === message.to) && chat.sessionId === message.sessionId
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
          chat.id === chatData.id && chat.sessionId === chatData.sessionId
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
              sessionId: session.id,
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

  const loadChatMessages = async (chatId: string, sessionId: string) => {
    try {
      console.log(`📨 Loading messages for chat: ${chatId} in session: ${sessionId}`)
      setMessages([]) // Clear previous messages

      const chatMessages = await whatsappManager.getChatMessages(sessionId, chatId)
      console.log(`📊 Raw messages from API:`, chatMessages)

      if (chatMessages && chatMessages.length > 0) {
        // Format messages properly for ChatWindow
        const formattedMessages: MessageData[] = chatMessages.map((msg: any) => ({
          id: msg.id || msg.whatsapp_message_id || `msg_${Date.now()}_${Math.random()}`,
          sessionId: msg.session_id || sessionId,
          body: msg.body || msg.message_content || '',
          from: msg.from_number || msg.from || chatId,
          to: msg.to_number || msg.to || 'self',
          timestamp: msg.timestamp ? parseInt(msg.timestamp) : Date.now(),
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
    console.log(`🎯 Selected chat: ${chat.name} (${chat.id}) from session: ${chat.sessionId}`)
    setSelectedChat(chat.id)
    loadChatMessages(chat.id, chat.sessionId)

    // Mark chat as read
    setAllChats(prev => prev.map(c =>
      c.id === chat.id && c.sessionId === chat.sessionId ? { ...c, unreadCount: 0 } : c
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
      console.log(`📤 Sending message to: ${chat.name} via session: ${chat.sessionId}`)

      if (mediaFile) {
        // Handle media file upload
        const formData = new FormData()
        formData.append('file', mediaFile)
        formData.append('sessionId', chat.sessionId)
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
        const result = await whatsappManager.sendMessage(chat.sessionId, selectedChat, message)
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

  // Get session name for a chat
  const getSessionName = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    return session?.name || 'Unknown Session'
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

  // Save sidebar width to localStorage
  const handleSidebarWidthChange = (width: number) => {
    setSidebarWidth(width)
    localStorage.setItem('sidebarWidth', width.toString())
  }

  // Save active tab to localStorage
  const handleTabChange = (tab: 'all' | 'unread' | 'archived') => {
    setActiveTab(tab)
    localStorage.setItem('activeTab', tab)
  }

  // Get connected sessions count
  const connectedSessions = sessions.filter(s => s.status === 'ready')
  const totalChats = allChats.filter(c => !archivedChats.includes(c.id)).length
  const unreadChats = allChats.filter(c => c.unreadCount > 0 && !archivedChats.includes(c.id)).length
  const archivedCount = archivedChats.length

  // Enhanced session status check
  const readySessions = sessions.filter(s => s.status === 'ready')
  const connectingSessions = sessions.filter(s => s.status === 'connecting' || s.status === 'qr')

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">
          No active sessions available. Please create and connect a session first.
        </div>
        <div className="mt-4">
          <button
            onClick={() => window.location.href = '/whatsapp-numbers'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to WhatsApp Numbers
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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat List Sidebar */}
      <div className="bg-white border-r border-gray-300 flex flex-col" style={{ width: `${sidebarWidth}px` }}>
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="text-green-600" size={24} />
                <span className="font-semibold text-gray-800">Chat Manager</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Width Control */}
              <div className="flex items-center space-x-2 mr-2">
                <SlidersHorizontal size={14} className="text-gray-500" />
                <input
                  type="range"
                  min="250"
                  max="500"
                  value={sidebarWidth}
                  onChange={(e) => handleSidebarWidthChange(Number(e.target.value))}
                  className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                  title={`Width: ${sidebarWidth}px`}
                />
              </div>

              <button
                onClick={loadAllChats}
                disabled={loading}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="Refresh Chats"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin text-gray-600' : 'text-gray-600'} />
              </button>
              <button
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="Filter Options"
              >
                <Filter size={16} className="text-gray-600" />
              </button>
              <button
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="Settings"
              >
                <Settings size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={loadAllChats}
                disabled={loading}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Sync</span>
              </button>

              <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                <MessageCircle size={14} />
                <span>New Chat</span>
              </button>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{connectedSessions.length} Online</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({totalChats})
          </button>
          <button
            onClick={() => handleTabChange('unread')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'unread'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Unread ({unreadChats})
          </button>
          <button
            onClick={() => handleTabChange('archived')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'archived'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Archive size={14} className="inline mr-1" />
            Archived ({archivedCount})
          </button>
        </div>

        {/* Session Filter */}
        <div className="p-3 border-b border-gray-200">
          <select
            value={selectedSessionFilter || ''}
            onChange={(e) => setSelectedSessionFilter(e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            <option value="">All Sessions</option>
            {connectedSessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.name} ({session.phoneNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin mr-2" size={20} />
              <span>Loading chats...</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageCircle size={48} className="mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Chats Found</h3>
              <p className="text-sm text-center">
                No chats available from connected sessions
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={`${chat.sessionId}-${chat.id}`}
                className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors group ${
                  selectedChat === chat.id ? 'bg-green-50' : ''
                }`}
              >
                <div
                  onClick={() => handleChatSelect(chat)}
                  className="flex items-center flex-1"
                >
                {/* Avatar */}
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  {chat.isGroup ? (
                    <Users size={20} className="text-gray-600" />
                  ) : (
                    <span className="text-gray-600 font-medium text-lg">
                      {chat.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    <div className="flex flex-col items-end">
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                      {chat.unreadCount > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 mt-1 min-w-[20px] text-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Last Message */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 truncate flex-1">
                      {chat.lastMessage ? chat.lastMessage.body : 'No messages yet'}
                    </p>
                    <div className="flex items-center ml-2">
                      {chat.phoneNumber && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-1">
                          {getSessionName(chat.sessionId)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* Archive Button */}
                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {activeTab === 'archived' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnarchiveChat(chat.id)
                      }}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      title="Unarchive Chat"
                    >
                      <Archive size={16} className="text-green-600" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchiveChat(chat.id)
                      }}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      title="Archive Chat"
                    >
                      <Archive size={16} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar Resizer */}
      <div className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex items-center justify-center group">
        <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-gray-600 transition-colors"></div>
        <input
          type="range"
          min="250"
          max="500"
          value={sidebarWidth}
          onChange={(e) => handleSidebarWidthChange(Number(e.target.value))}
          className="absolute opacity-0 cursor-col-resize"
          style={{ width: '20px', height: '100%' }}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {selectedChat ? (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 bg-gray-100 border-b border-gray-300 flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                {filteredChats.find(c => c.id === selectedChat)?.isGroup ? (
                  <Users size={20} className="text-gray-600" />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {filteredChats.find(c => c.id === selectedChat)?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {filteredChats.find(c => c.id === selectedChat)?.name || 'Unknown'}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="text-xs">
                    {getSessionName(filteredChats.find(c => c.id === selectedChat)?.sessionId || '')}
                  </span>
                  <span>•</span>
                  <span className="text-xs text-green-600">Online</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <Phone size={16} />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <Video size={16} />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <ChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              chatName={filteredChats.find(c => c.id === selectedChat)?.name || 'Unknown'}
              isGroup={filteredChats.find(c => c.id === selectedChat)?.isGroup || false}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle size={64} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-light text-gray-800 mb-2">WhatsApp Web</h2>
              <p className="text-gray-500 mb-4">
                Send and receive messages without keeping your phone online.
              </p>
              <p className="text-sm text-gray-400">
                Select a chat to start messaging
              </p>
              <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <CheckCircle size={16} className="text-green-500 mr-2" />
                  {connectedSessions.length} Sessions
                </span>
                <span className="flex items-center">
                  <MessageCircle size={16} className="text-blue-500 mr-2" />
                  {totalChats} Chats
                </span>
                {unreadChats > 0 && (
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    {unreadChats} Unread
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
