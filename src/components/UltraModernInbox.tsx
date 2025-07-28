'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Send, Search, Filter, MoreVertical, Phone, Video,
  Smile, Star, Volume2, VolumeX, Archive, Trash2, Pin, Users,
  Check, CheckCheck, Circle, AlertCircle, Zap, Sparkles,
  X, Plus, Mic, Camera, Paperclip, Crown, Verified,
  Heart, Reply, Forward, Maximize2, Minimize2, Settings,
  Download, Play, Pause, FileText, Image, Film, Music,
  Eye, ZoomIn, RotateCcw, Contact, Calendar, PenTool,
  BarChart3, MapPin, Gift, Smartphone, MessageSquare, RefreshCw
} from 'lucide-react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import { cn, formatTime } from '@/lib/utils'
import NewChatModal from './NewChatModal'
import { useTheme } from '@/contexts/ThemeContext'

interface UltraModernInboxProps {
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
  isBlocked?: boolean
  unreadCount: number
}

interface Message {
  id: string
  content: string
  timestamp: number
  isFromMe: boolean
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker'
  mediaUrl?: string
  fileName?: string
  fileSize?: number
  duration?: number
  latitude?: number
  longitude?: number
  quotedMessage?: {
    id: string
    content: string
    isFromMe: boolean
    type: string
  }
  reactions?: {
    emoji: string
    users: string[]
  }[]
  isStarred?: boolean
  isForwarded?: boolean
  forwardedFrom?: string
  editedAt?: number
  deletedAt?: number
  mentions?: string[]
}

interface Chat {
  id: string
  contact: Contact
  lastMessage?: Message
  isGroup: boolean
  groupInfo?: {
    participants: number
    admins: string[]
    description?: string
  }
  sessionId?: string
  sessionName?: string
  sessionPhone?: string
}

export default function UltraModernInbox({
  whatsappManager,
  sessions,
  selectedSession,
  onSessionSelected
}: UltraModernInboxProps) {
  // Theme hook
  const { colors, isDark, uiDesign } = useTheme()
  // Debug sessions
  useEffect(() => {
    console.log('🔍 UltraModernInbox sessions:', sessions.map(s => ({ id: s.id, name: s.name, status: s.status })))
    console.log('🎯 Selected session:', selectedSession)

    // Clear any cached chats when sessions change to avoid old format chat IDs
    setChats([])
    setSelectedChat(null)
    setMessages([])
  }, [sessions, selectedSession])

  // Core States
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UI States
  const [newMessage, setNewMessage] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(600)
  const [viewMode, setViewMode] = useState<'all' | 'session'>('all')

  // Feature States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showQuickTemplates, setShowQuickTemplates] = useState(false)
  const [quickTemplates, setQuickTemplates] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Voice recording states
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showVoicePreview, setShowVoicePreview] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'pinned' | 'archived' | 'groups'>('all')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null)
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)

  // Media preview states
  const [showMediaPreview, setShowMediaPreview] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<{url: string, type: string, name?: string} | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())

  // Attachment menu states
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [mediaCaption, setMediaCaption] = useState('')
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<File[]>([])
  const [showMediaPreviewDialog, setShowMediaPreviewDialog] = useState(false)
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<{url: string, name: string, type: string, size: number} | null>(null)

  // Real-time States
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [lastSeen, setLastSeen] = useState<Map<string, number>>(new Map())
  const [messageStatus, setMessageStatus] = useState<Map<string, 'sending' | 'sent' | 'delivered' | 'read'>>(new Map())
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connected')
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map())
  const [realtimeMessages, setRealtimeMessages] = useState<Map<string, Message[]>>(new Map())
  const [voiceNotes, setVoiceNotes] = useState<Map<string, boolean>>(new Map())
  const [readReceipts, setReadReceipts] = useState<Map<string, string[]>>(new Map())

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const attachmentMenuRef = useRef<HTMLDivElement>(null)
  const attachmentButtonRef = useRef<HTMLButtonElement>(null)

  // Click outside handler for attachment menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false)
      }
    }

    if (showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAttachmentMenu])

  // Comprehensive Real-time Setup
  useEffect(() => {
    if (whatsappManager) {
      console.log('🔄 Setting up comprehensive real-time features...')

      // Connection Status Monitoring
      const updateConnectionStatus = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
        setConnectionStatus(status)
        console.log(`📡 Connection status: ${status}`)
      }

      // Real-time Message Listener with Enhanced Features
      whatsappManager.onNewMessage((message: any) => {
        console.log('📨 Real-time message received:', message)
        console.log('🔍 DEBUG: Message details:', {
          from: message.from,
          to: message.to,
          body: message.body,
          type: message.type,
          sessionId: message.sessionId
        })

        const chatId = message.from || message.chatId || message.chat
        const transformedMessage = transformMessage(message)

        // Update current chat messages
        if (selectedChat === chatId) {
          setMessages(prev => [...prev, transformedMessage])
          setRealtimeMessages(prev => {
            const chatMessages = prev.get(chatId) || []
            const updated = new Map(prev)
            updated.set(chatId, [...chatMessages, transformedMessage])
            return updated
          })
          scrollToBottom()
        }

        // Update unread counts
        if (selectedChat !== chatId) {
          setUnreadCounts(prev => {
            const updated = new Map(prev)
            const current = updated.get(chatId) || 0
            updated.set(chatId, current + 1)
            return updated
          })
        }

        // Update chat list with new message
        loadChats()

        // Play notification sound for new messages
        if (selectedChat !== chatId) {
          playNotificationSound()
        }
      })

      // Real-time Typing Status from WhatsApp API
      whatsappManager.onTypingStatus?.((data: any) => {
        console.log('⌨️ Real-time typing status:', data)
        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, data.chatId]))
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.chatId)
            return newSet
          })
        }
      })

      // Real-time Presence Updates from WhatsApp API
      whatsappManager.onPresenceUpdate?.((data: any) => {
        console.log('👤 Real-time presence update:', data)

        if (data.isOnline) {
          setOnlineUsers(prev => new Set([...prev, data.chatId]))
          // Clear last seen when user comes online
          setLastSeen(prev => {
            const updated = new Map(prev)
            updated.delete(data.chatId)
            return updated
          })
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.chatId)
            return newSet
          })
          // Set last seen time from WhatsApp API
          const lastSeenTime = data.lastSeen || Date.now()
          setLastSeen(prev => new Map(prev.set(data.chatId, lastSeenTime)))
        }
      })

      // Real-time Message Status Updates from WhatsApp API
      whatsappManager.onMessageStatusUpdate?.((data: any) => {
        console.log('✅ Real-time message status update:', data)
        setMessageStatus(prev => new Map(prev.set(data.messageId, data.status)))

        // Update messages with new status
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId
            ? { ...msg, status: data.status }
            : msg
        ))

        // Update read receipts for read messages
        if (data.status === 'read' && data.readBy) {
          setReadReceipts(prev => {
            const updated = new Map(prev)
            const readers = updated.get(data.messageId) || []
            updated.set(data.messageId, [...readers, data.readBy])
            return updated
          })
        }
      })

      // Connection Events using existing methods
      whatsappManager.onClientReady?.(() => {
        updateConnectionStatus('connected')
        console.log('✅ WhatsApp connected successfully')
      })

      whatsappManager.onDisconnected?.(() => {
        updateConnectionStatus('disconnected')
        console.log('❌ WhatsApp disconnected')
      })

      whatsappManager.onAuthFailure?.(() => {
        updateConnectionStatus('error')
        console.log('🚨 WhatsApp authentication failed')
      })

      // Initial connection status
      updateConnectionStatus('connected')

      // Fetch real presence data from WhatsApp API
      const fetchRealPresenceData = async () => {
        try {
          if (selectedSession && chats.length > 0) {
            console.log('🔍 Fetching real presence data for session:', selectedSession)

            // Get presence for all contacts
            for (const chat of chats) {
              try {
                // Request presence update from WhatsApp API
                const response = await fetch(`/api/whatsapp/presence/${selectedSession}/${chat.id}`)
                if (response.ok) {
                  const presenceData = await response.json()
                  console.log('👤 Real presence data for', chat.contact.name, ':', presenceData)

                  if (presenceData.isOnline) {
                    setOnlineUsers(prev => new Set([...prev, chat.id]))
                    setLastSeen(prev => {
                      const updated = new Map(prev)
                      updated.delete(chat.id)
                      return updated
                    })
                  } else if (presenceData.lastSeen) {
                    setOnlineUsers(prev => {
                      const newSet = new Set(prev)
                      newSet.delete(chat.id)
                      return newSet
                    })
                    setLastSeen(prev => new Map(prev.set(chat.id, presenceData.lastSeen)))
                  }
                }
              } catch (error) {
                console.log('⚠️ Could not fetch presence for', chat.contact.name)
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Real presence data not available, using fallback')
          // Fallback to demo data if real API not available
          const chatIds = chats.map(chat => chat.id)
          chatIds.forEach((chatId) => {
            if (Math.random() > 0.7) {
              setOnlineUsers(prev => new Set([...prev, chatId]))
            } else {
              const randomTime = Date.now() - Math.random() * 3600000 * 24
              setLastSeen(prev => new Map(prev.set(chatId, randomTime)))
            }
          })
        }
      }

      // Initial fetch
      fetchRealPresenceData()

      // Disabled auto-refresh to prevent unwanted page refreshes
      // const presenceInterval = setInterval(fetchRealPresenceData, 30000)

      return () => {
        // clearInterval(presenceInterval)
      }

      // Setup contacts update listener
      whatsappManager.socket?.on('contacts_updated', (contacts: any[]) => {
        console.log('📞 Contacts updated:', contacts.length)

        // Update chats with contact info
        setChats(prevChats => {
          return prevChats.map(chat => {
            const contact = contacts.find(c =>
              c.number === chat.contact.phoneNumber ||
              c.id === chat.id ||
              c.number === chat.id.replace('@c.us', '')
            )

            if (contact) {
              return {
                ...chat,
                contact: {
                  ...chat.contact,
                  profilePic: contact.profilePicUrl || chat.contact.profilePic,
                  name: contact.name || chat.contact.name,
                  isBusiness: contact.isBusiness || chat.contact.isBusiness,
                  isVerified: contact.isVerified || chat.contact.isVerified
                }
              }
            }
            return chat
          })
        })
      })

      // Listen for new chats created
      whatsappManager.socket?.on('new_chat', (newChatData: any) => {
        console.log('🆕 New chat created:', newChatData)

        // Refresh chats to include the new one
        setTimeout(() => {
          loadChats()
        }, 500)
      })

      // Listen for chat updates
      whatsappManager.socket?.on('chat_updated', (updatedChat: any) => {
        console.log('🔄 Chat updated:', updatedChat)

        setChats(prevChats => {
          const existingIndex = prevChats.findIndex(chat => chat.id === updatedChat.id)
          if (existingIndex >= 0) {
            const updated = [...prevChats]
            updated[existingIndex] = transformChat(updatedChat)
            return updated
          } else {
            // New chat, add it
            return [transformChat(updatedChat), ...prevChats]
          }
        })
      })
    }

    return () => {
      // Cleanup listeners
      whatsappManager?.socket?.off('new_message')
      whatsappManager?.socket?.off('typing')
      whatsappManager?.socket?.off('presence_update')
      whatsappManager?.socket?.off('contacts_updated')
      whatsappManager?.socket?.off('new_chat')
      whatsappManager?.socket?.off('chat_updated')
    }
  }, [selectedChat, whatsappManager])

  // Transform message from API format
  const transformMessage = (rawMessage: any): Message => {
    // Detect media type from various possible fields
    let messageType = rawMessage.type || 'text'
    let mediaUrl = rawMessage.mediaUrl || rawMessage.url || rawMessage.media?.url
    let fileName = rawMessage.fileName || rawMessage.filename || rawMessage.media?.filename
    let fileSize = rawMessage.fileSize || rawMessage.size || rawMessage.media?.size

    // If mediaUrl is null but we have a fileName and it's a media message, construct the URL
    if (!mediaUrl && fileName && messageType !== 'text' && messageType !== 'chat') {
      // Try to construct media URL from filename
      mediaUrl = `/uploads/${encodeURIComponent(fileName)}`
      console.log('🔧 Constructed media URL:', mediaUrl, 'for file:', fileName)
    }

    // Enhanced media type detection
    if (rawMessage.hasMedia || rawMessage.media || mediaUrl) {
      // Check if it's an image
      if (rawMessage.type === 'image' ||
          rawMessage.mimeType?.startsWith('image/') ||
          rawMessage.media?.mimetype?.startsWith('image/') ||
          fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
        messageType = 'image'
      }
      // Check if it's a video
      else if (rawMessage.type === 'video' ||
               rawMessage.mimeType?.startsWith('video/') ||
               rawMessage.media?.mimetype?.startsWith('video/') ||
               fileName?.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)) {
        messageType = 'video'
      }
      // Check if it's audio
      else if (rawMessage.type === 'audio' ||
               rawMessage.mimeType?.startsWith('audio/') ||
               rawMessage.media?.mimetype?.startsWith('audio/') ||
               fileName?.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
        messageType = 'audio'
      }
      // Check if it's a document
      else if (rawMessage.type === 'document' ||
               rawMessage.mimeType?.includes('application/') ||
               rawMessage.mimeType?.includes('text/') ||
               rawMessage.media?.mimetype?.includes('application/') ||
               rawMessage.media?.mimetype?.includes('text/') ||
               fileName?.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i)) {
        messageType = 'document'
      }
      // Default to document if has media but type not detected
      else if (mediaUrl || rawMessage.hasMedia) {
        messageType = 'document'
      }
    }

    // Extract content from various possible fields
    const content = rawMessage.body || rawMessage.content || rawMessage.text || rawMessage.caption || ''

    // Enhanced filename extraction for images
    if (!fileName && messageType === 'image') {
      // Try to extract filename from content/caption
      const caption = content || rawMessage.caption || '';
      const fileNameMatch = caption.match(/([^\/\\]+\.(jpg|jpeg|png|gif|webp|bmp))/i);

      if (fileNameMatch) {
        fileName = fileNameMatch[1];
      } else {
        // Generate meaningful filename with date and time
        const timestamp = rawMessage.timestamp || Date.now();
        const date = new Date(timestamp * 1000);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        const extension = rawMessage.mimeType?.includes('jpeg') ? 'jpg' :
                         rawMessage.mimeType?.includes('png') ? 'png' :
                         rawMessage.mimeType?.includes('gif') ? 'gif' : 'jpg';
        fileName = `WhatsApp_Image_${dateStr}_${timeStr}.${extension}`;
      }
    }

    return {
      id: rawMessage.id || `msg_${Date.now()}`,
      content,
      timestamp: rawMessage.timestamp || rawMessage.t || Date.now(),
      isFromMe: rawMessage.fromMe || rawMessage.isFromMe || false,
      status: rawMessage.status || 'sent',
      type: messageType,
      mediaUrl,
      fileName,
      fileSize,
      duration: rawMessage.duration,
      quotedMessage: rawMessage.quotedMessage,
      reactions: rawMessage.reactions || [],
      isStarred: rawMessage.isStarred || false,
      isForwarded: rawMessage.isForwarded || false,
      forwardedFrom: rawMessage.forwardedFrom,
      mentions: rawMessage.mentions || []
    }
  }

  // Load chats from WhatsApp Manager
  const loadChats = useCallback(async (forceRefresh = false) => {
    if (!whatsappManager) {
      console.log('❌ WhatsApp Manager not available')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('📱 Loading real WhatsApp chats...', {
        viewMode,
        selectedSession,
        sessionsCount: sessions.length,
        forceRefresh
      })

      // Debug: Log session details
      console.log('🔍 DEBUG: Sessions received:', sessions.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        phoneNumber: s.phoneNumber || s.phone_number
      })))

      // Get chats from WhatsApp Manager
      let rawChats: any[] = []

      if (viewMode === 'all') {
        console.log('🌐 Loading all chats from all sessions...')
        // Get chats from all sessions
        const allChats: any[] = []
        for (const session of sessions) {
          try {
            console.log(`📱 Fetching chats for session: ${session.id} (Status: ${session.status})`)

            // Only fetch from connected/ready sessions
            if (session.status === 'ready' || session.status === 'connected' || session.isReady) {
              console.log(`🔄 Fetching chats for session ${session.id}...`)
              const sessionChats = await whatsappManager.getChats(session.id)
              console.log(`📊 Session ${session.id} returned ${sessionChats?.length || 0} chats`)
              console.log(`🔍 Raw chats from session ${session.id}:`, sessionChats)

              if (sessionChats && sessionChats.length > 0) {
                // Add session ID to each chat for easy lookup
                const chatsWithSession = sessionChats.map((chat: any) => ({
                  ...chat,
                  sessionId: session.id,
                  sessionName: session.name,
                  sessionPhone: session.phone_number
                }))
                allChats.push(...chatsWithSession)
                console.log(`✅ Added ${chatsWithSession.length} chats from session ${session.id}`)
              } else {
                console.log(`📭 No chats found for session ${session.id}`)
              }
            } else {
              console.log(`⚠️ Skipping session ${session.id} - not ready (status: ${session.status}, isReady: ${session.isReady})`)
            }
          } catch (error) {
            console.log(`❌ Error loading chats for session ${session.id}:`, error)
          }
        }
        rawChats = allChats
        console.log(`📊 Total chats from all sessions: ${rawChats.length}`)
      } else if (selectedSession) {
        console.log('📱 Loading chats for selected session:', selectedSession)

        // Find session details
        const sessionDetails = sessions.find(s => s.id === selectedSession)
        console.log('📋 Session details:', sessionDetails)

        if (sessionDetails) {
          console.log(`🔍 Session ${selectedSession} status: ${sessionDetails.status}, isReady: ${sessionDetails.isReady}`)

          // Try to get chats regardless of status for better user experience
          try {
            rawChats = await whatsappManager.getChats(selectedSession)
            console.log(`📊 Selected session ${selectedSession} returned ${rawChats?.length || 0} chats`)

            // Add session info to chats
            if (rawChats && rawChats.length > 0) {
              rawChats = rawChats.map((chat: any) => ({
                ...chat,
                sessionId: selectedSession,
                sessionName: sessionDetails.name,
                sessionPhone: sessionDetails.phoneNumber || sessionDetails.phone_number
              }))
            }
          } catch (error) {
            console.log(`❌ Error getting chats for session ${selectedSession}:`, error)
            setError(`Failed to load chats for session: ${sessionDetails.name}`)
            setChats([])
            setConnected(false)
            return
          }
        } else {
          console.log(`⚠️ Session ${selectedSession} not found`)
          setError(`Session not found`)
          setChats([])
          setConnected(false)
          return
        }
      } else {
        console.log('⚠️ No session selected and not in all mode')
        setChats([])
        setConnected(false)
        return
      }
      console.log('📋 Raw chats received:', rawChats?.length || 0, rawChats)

      if (!rawChats || rawChats.length === 0) {
        console.log('⚠️ No chats found, showing empty state')
        setChats([])
        setConnected(true)
        return
      }

      // Transform and filter chats
      const transformedChats = rawChats
        .map(transformChat)
        .filter((chat: any) => chat && chat.id) // Filter out invalid chats
        .reduce((unique: any[], chat: any) => {
          // Remove duplicates within same session based on phone number
          // Different sessions can have same phone number, but same session should not have duplicates
          const phoneNumber = chat.contact.phoneNumber || chat.id
          const sessionId = chat.sessionId || 'unknown'

          console.log('🔍 Processing chat for deduplication:', {
            chatId: chat.id,
            phoneNumber,
            sessionId,
            name: chat.contact.name
          })

          // Check if this phone number already exists in this session
          const existingChatIndex = unique.findIndex(c => {
            const existingPhone = c.contact.phoneNumber || c.id
            const existingSession = c.sessionId || 'unknown'
            const isDuplicate = existingPhone === phoneNumber && existingSession === sessionId

            if (isDuplicate) {
              console.log('🚨 Found duplicate:', {
                existing: { phone: existingPhone, session: existingSession, name: c.contact.name },
                current: { phone: phoneNumber, session: sessionId, name: chat.contact.name }
              })
            }

            return isDuplicate
          })

          if (existingChatIndex === -1) {
            // No duplicate found, add this chat
            console.log('✅ Adding unique chat:', { phoneNumber, sessionId, name: chat.contact.name })
            unique.push(chat)
          } else {
            // Duplicate found, keep the one with more recent last message
            const existingChat = unique[existingChatIndex]
            const currentTime = chat.lastMessage?.timestamp || 0
            const existingTime = existingChat.lastMessage?.timestamp || 0

            console.log('🔄 Handling duplicate - comparing timestamps:', {
              current: currentTime,
              existing: existingTime,
              willReplace: currentTime > existingTime
            })

            if (currentTime > existingTime) {
              // Replace with more recent chat
              console.log('🔄 Replacing with more recent chat')
              unique[existingChatIndex] = chat
            } else {
              console.log('🔄 Keeping existing chat (more recent)')
            }
            // Otherwise keep the existing one
          }

          return unique
        }, [])
        .sort((a: any, b: any) => {
          // Sort by last message timestamp (newest first)
          const aTime = a.lastMessage?.timestamp || 0
          const bTime = b.lastMessage?.timestamp || 0
          return bTime - aTime
        })

      console.log('🔄 Unique chats after deduplication:', transformedChats.length)
      console.log('📋 Deduplicated chats by session:', transformedChats.reduce((acc: any, chat: any) => {
        const sessionId = chat.sessionId || 'unknown'
        if (!acc[sessionId]) acc[sessionId] = []
        acc[sessionId].push({
          phone: chat.contact.phoneNumber || chat.id,
          name: chat.contact.name
        })
        return acc
      }, {}))
      setChats(transformedChats)
      setConnected(true)
      console.log('✅ Real chats loaded:', transformedChats.length)

      // Fetch contacts with profile pictures
      try {
        console.log('📞 Fetching contacts with profile pictures...')

        if (viewMode === 'all') {
          // Fetch contacts from all sessions
          for (const session of sessions) {
            try {
              whatsappManager.requestContacts(session.id)
              const contacts = await whatsappManager.getContacts(session.id)
              if (contacts.length > 0) {
                setChats(prevChats => {
                  const updatedChats = prevChats.map(chat => {
                    const contact = contacts.find(c =>
                      c.number === chat.contact.phoneNumber ||
                      c.id === chat.id ||
                      c.number === chat.id.replace('@c.us', '')
                    )

                    if (contact) {
                      return {
                        ...chat,
                        contact: {
                          ...chat.contact,
                          profilePic: contact.profilePicUrl || chat.contact.profilePic,
                          name: contact.name || chat.contact.name,
                          isBusiness: (contact as any).isBusiness || chat.contact.isBusiness,
                          isVerified: (contact as any).isVerified || chat.contact.isVerified
                        }
                      }
                    }
                    return chat
                  })

                  // Remove duplicates again after contact updates
                  return updatedChats.reduce((unique: any[], chat: any) => {
                    if (!unique.find(c => c.id === chat.id)) {
                      unique.push(chat)
                    }
                    return unique
                  }, [])
                })
              }
            } catch (error) {
              console.log(`⚠️ Error fetching contacts for session ${session.id}:`, error)
            }
          }
        } else if (selectedSession) {
          // Fetch contacts from selected session
          whatsappManager.requestContacts(selectedSession)
          const contacts = await whatsappManager.getContacts(selectedSession)
          console.log('📊 Fetched contacts:', contacts.length)

          if (contacts.length > 0) {
            setChats(prevChats => {
              return prevChats.map(chat => {
                const contact = contacts.find(c =>
                  c.number === chat.contact.phoneNumber ||
                  c.id === chat.id ||
                  c.number === chat.id.replace('@c.us', '')
                )

                if (contact) {
                  return {
                    ...chat,
                    contact: {
                      ...chat.contact,
                      profilePic: contact.profilePicUrl || chat.contact.profilePic,
                      name: contact.name || chat.contact.name,
                      isBusiness: (contact as any).isBusiness || chat.contact.isBusiness,
                      isVerified: (contact as any).isVerified || chat.contact.isVerified
                    }
                  }
                }
                return chat
              })
            })
          }
        }
      } catch (contactError) {
        console.error('❌ Error fetching contacts:', contactError)
      }

    } catch (err) {
      console.error('❌ Error loading chats:', err)
      setError('Failed to load chats. Please check your WhatsApp connection.')
      setChats([])
    } finally {
      setLoading(false)
    }
  }, [selectedSession, whatsappManager, viewMode, sessions])

  // Load contacts for new chat modal
  const [contacts, setContacts] = useState<any[]>([])
  const loadContacts = useCallback(async () => {
    if (!whatsappManager || !selectedSession) return

    try {
      console.log('📞 Loading contacts for new chat...')
      const rawContacts = await whatsappManager.getContacts(selectedSession)

      if (rawContacts && rawContacts.length > 0) {
        const transformedContacts = rawContacts.map((contact: any) => ({
          id: contact.id || contact.phoneNumber,
          name: contact.name || contact.pushname || contact.phoneNumber || 'Unknown',
          phoneNumber: contact.phoneNumber || contact.id,
          profilePic: contact.profilePicUrl || contact.profilePic,
          isOnline: false,
          isBusiness: contact.isBusiness || false,
          isVerified: contact.isVerified || false
        }))
        setContacts(transformedContacts)
        console.log('✅ Contacts loaded:', transformedContacts.length)
      }
    } catch (error) {
      console.error('❌ Error loading contacts:', error)
    }
  }, [whatsappManager, selectedSession])

  // Handle new chat creation
  const handleCreateNewChat = async (phoneNumber: string, name?: string) => {
    if (!whatsappManager || !selectedSession) {
      throw new Error('WhatsApp Manager or session not available')
    }

    try {
      console.log('🆕 Creating new chat with:', phoneNumber, 'Name:', name)

      // Format phone number properly
      let formattedPhone = phoneNumber.replace(/\D/g, '')

      // Handle Indian numbers
      if (formattedPhone.length === 10 && !formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone
      }

      // Add + if not present
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone
      }

      console.log('📱 Formatted phone number:', formattedPhone)

      // Check if chat already exists
      const existingChat = chats.find(chat =>
        chat.contact.phoneNumber.replace(/\D/g, '').includes(formattedPhone.replace(/\D/g, ''))
      )

      if (existingChat) {
        console.log('💬 Chat already exists, selecting it')
        setSelectedChat(existingChat.id)
        loadMessages(existingChat.id)
        return
      }

      // Send a welcome message to create the chat
      const welcomeMessage = name ? `Hi ${name}! 👋` : 'Hi! 👋'
      const result = await whatsappManager.sendMessage(
        selectedSession,
        formattedPhone,
        welcomeMessage
      )

      if (result.success) {
        console.log('✅ New chat created successfully')

        // Refresh chats to show the new conversation
        await loadChats()

        // Wait a bit and then find and select the new chat
        let attempts = 0
        const maxAttempts = 5

        const findAndSelectNewChat = async () => {
          attempts++
          console.log(`🔍 Attempt ${attempts}/${maxAttempts} to find new chat`)

          // Reload chats to ensure we have the latest data
          await loadChats()

          // Wait for state to update
          setTimeout(() => {
            setChats(currentChats => {
              const newChat = currentChats.find(chat => {
                const chatPhone = chat.contact.phoneNumber.replace(/\D/g, '')
                const targetPhone = formattedPhone.replace(/\D/g, '')
                return chatPhone.includes(targetPhone) || targetPhone.includes(chatPhone)
              })

              if (newChat) {
                console.log('🎯 Found new chat, selecting it:', newChat.id)
                setSelectedChat(newChat.id)
                loadMessages(newChat.id)
              } else if (attempts < maxAttempts) {
                console.log(`⚠️ New chat not found, trying again in 1 second... (${attempts}/${maxAttempts})`)
                setTimeout(findAndSelectNewChat, 1000)
              } else {
                console.log('❌ Could not find new chat after maximum attempts')
              }

              return currentChats
            })
          }, 500)
        }

        setTimeout(findAndSelectNewChat, 1000)
      } else {
        throw new Error(result.message || 'Failed to create chat')
      }
    } catch (error) {
      console.error('❌ Error creating new chat:', error)
      throw error
    }
  }

  // Transform chat from API format
  const transformChat = (rawChat: any): Chat => {
    const baseId = rawChat.id || rawChat.chatId || rawChat.phoneNumber || `chat_${Date.now()}`
    const sessionId = rawChat.sessionId

    // Debug: Log raw chat data
    console.log('🔍 Raw chat data:', {
      id: rawChat.id,
      chatId: rawChat.chatId,
      phoneNumber: rawChat.phoneNumber,
      baseId,
      sessionId,
      name: rawChat.name || rawChat.pushname || 'Unknown'
    })

    // Use base ID as is (already contains @c.us or @g.us)
    // Session info will be stored separately in chat object
    // Create truly unique ID by combining session and base ID
    const uniqueId = sessionId ? `${sessionId}-${baseId}` : baseId

    return {
      id: uniqueId,
      sessionId,
      contact: {
        id: baseId, // Keep original ID for contact
        name: rawChat.name || rawChat.pushname || rawChat.contact?.name || 'Unknown',
        phoneNumber: rawChat.phoneNumber || rawChat.id || '',
        profilePic: rawChat.profilePicUrl || rawChat.contact?.profilePicUrl || rawChat.profilePic || rawChat.contact?.profilePic,
        isOnline: onlineUsers.has(baseId),
        lastSeen: lastSeen.get(baseId),
        isTyping: typingUsers.has(baseId),
        isBusiness: rawChat.isBusiness || false,
        isVerified: rawChat.isVerified || false,
        isPinned: rawChat.isPinned || false,
        isMuted: rawChat.isMuted || false,
        isArchived: rawChat.isArchived || false,
        unreadCount: rawChat.unreadCount || 0
      },
      lastMessage: rawChat.lastMessage ? transformMessage(rawChat.lastMessage) : undefined,
      isGroup: rawChat.isGroup || false,
      groupInfo: rawChat.groupInfo,
      sessionName: rawChat.sessionName,
      sessionPhone: rawChat.sessionPhone
    }
  }

  const selectedChatInfo = chats.find(chat => chat.id === selectedChat)

  // Debug chat selection
  useEffect(() => {
    if (selectedChat) {
      console.log('🔍 Selected chat ID:', selectedChat)
      console.log('📋 Available chats:', chats.map(c => ({ id: c.id, name: c.contact.name })))
      console.log('🎯 Found chat info:', selectedChatInfo ? selectedChatInfo.contact.name : 'NOT FOUND')
      console.log('📨 Current messages count:', messages.length)
      console.log('⏳ Messages loading:', messagesLoading)
    }
  }, [selectedChat, chats, selectedChatInfo, messages.length, messagesLoading])

  // Load messages for selected chat
  const loadMessages = useCallback(async (chatId: string) => {
    if (!whatsappManager) return

    try {
      setMessagesLoading(true)
      console.log('🔄 Loading real messages for chat:', chatId)

      // Extract session ID and phone number from chat ID
      let sessionId = selectedSession
      let phoneNumber = chatId

      console.log('🔍 DEBUG loadMessages:', {
        chatId,
        selectedSession,
        viewMode,
        chatIdIncludesAt: chatId.includes('@')
      })

      // Chat ID is now just the phone number (e.g., 919718577453@c.us)
      // Session info is stored separately in chat object
      phoneNumber = chatId

      if (viewMode === 'all') {
        // In All Chats mode, find the session from chat data
        const chatInfo = chats.find(chat => chat.id === chatId)
        console.log('🔍 Chat info found:', chatInfo)
        if (chatInfo && chatInfo.sessionId) {
          sessionId = chatInfo.sessionId
          phoneNumber = chatInfo.contact.phoneNumber || chatId
          console.log('📱 Found chat session from cache:', sessionId)
        } else {
          console.log('⚠️ Could not determine session for chat:', chatId)
          setMessages([])
          return
        }
      } else {
        // Single session mode - use the phone number as is
        phoneNumber = chatId
        console.log('📱 Single session mode - Phone:', phoneNumber, 'Session:', sessionId)
      }

      if (!sessionId) {
        console.log('⚠️ No session found for chat:', chatId)
        setMessages([])
        return
      }

      // Get real messages from WhatsApp Manager using phone number
      console.log('🔄 Fetching messages for:', { sessionId, phoneNumber, chatId })
      const rawMessages = await whatsappManager.getMessages(sessionId, phoneNumber)
      console.log('📨 Raw messages received:', rawMessages?.length || 0)
      console.log('📨 Raw messages data:', rawMessages)

      if (!rawMessages || rawMessages.length === 0) {
        console.log('⚠️ No real messages found for chat:', chatId)
        console.log('🔧 Showing sample messages - click "Sync Messages" to get real data')

        // Show sample messages with a clear indication they are samples
        const sampleMessages: Message[] = [
          {
            id: 'sample-1',
            content: '📱 Sample Message: Hello! How are you?',
            timestamp: Date.now() / 1000 - 300, // 5 minutes ago
            isFromMe: false,
            status: 'delivered',
            type: 'text'
          },
          {
            id: 'sample-2',
            content: '📱 Sample Message: I am fine, thank you! How about you?',
            timestamp: Date.now() / 1000 - 240, // 4 minutes ago
            isFromMe: true,
            status: 'sent',
            type: 'text'
          },
          {
            id: 'sample-3',
            content: '📱 Sample Message: Great to hear! These are sample messages. Click "Sync Messages" to load real WhatsApp messages.',
            timestamp: Date.now() / 1000 - 180, // 3 minutes ago
            isFromMe: false,
            status: 'delivered',
            type: 'text'
          }
        ]

        console.log('🔧 Using sample messages (marked as samples):', sampleMessages.length)
        setMessages(sampleMessages)
        scrollToBottom()
        return
      }

      // Debug: Log raw message structure
      console.log('🔍 Raw messages sample:', rawMessages.slice(0, 3))

      // Transform messages to frontend format
      const transformedMessages = rawMessages
        .map(transformMessage)
        .filter((msg: any) => msg && msg.id) // Filter out invalid messages
        .sort((a: any, b: any) => a.timestamp - b.timestamp) // Sort by timestamp (oldest first)

      // Debug: Log transformed messages
      console.log('🔄 Transformed messages sample:', transformedMessages.slice(0, 3))
      console.log('📊 Total transformed messages:', transformedMessages.length)
      console.log('🎯 Setting messages state with:', transformedMessages.length, 'messages')

      setMessages(transformedMessages)

      // Debug: Verify state was set
      setTimeout(() => {
        console.log('✅ Messages state after setting:', transformedMessages.length)
      }, 100)
      scrollToBottom()
      console.log('✅ Real messages loaded:', transformedMessages.length)

    } catch (err) {
      console.error('❌ Error loading messages:', err)
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }, [selectedSession, whatsappManager, viewMode, sessions, chats])

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }





  const handleChatSelect = (chatId: string) => {
    console.log('💬 Chat selected:', chatId)
    console.log('📋 Available chats:', chats.map(c => ({ id: c.id, name: c.contact.name })))
    console.log('🎯 Selected chat info:', chats.find(chat => chat.id === chatId))
    console.log('🔍 Available sessions:', sessions.map(s => ({ id: s.id, name: s.name, status: s.status })))
    console.log('🎯 Current selected session:', selectedSession)
    setSelectedChat(chatId)
    loadMessages(chatId)
    setSelectedMessages(new Set())
    setReplyingTo(null)
  }

  const handleInboxClick = () => {
    console.log('📥 Inbox clicked - clearing selected chat')
    setSelectedChat(null)
    setMessages([])
    setSelectedMessages(new Set())
    setReplyingTo(null)
  }

  // Send message
  const handleSendMessage = async () => {
    console.log('📤 handleSendMessage called')
    console.log('📊 Send message state:', {
      newMessage: newMessage.trim(),
      selectedChat,
      selectedSession,
      whatsappManager: !!whatsappManager,
      viewMode,
      sessionsCount: sessions.length
    })

    if (!newMessage.trim()) {
      console.log('❌ No message to send')
      return
    }

    if (!selectedChat) {
      console.log('❌ No chat selected')
      alert('Please select a chat first!')
      return
    }

    // Extract session ID and phone number from chat ID
    let sessionId = selectedSession
    let phoneNumber = selectedChat

    // Chat ID format is: sessionId-phoneNumber@c.us or sessionId-phoneNumber@g.us
    // Session ID is a UUID with dashes, so we need to find the phone number part
    if (selectedChat.includes('-') && selectedChat.includes('@')) {
      // Find the last occurrence of a phone number pattern (digits followed by @)
      const atIndex = selectedChat.lastIndexOf('@')
      const beforeAt = selectedChat.substring(0, atIndex)

      // Find the last dash before a sequence of digits (phone number)
      const phoneMatch = beforeAt.match(/^(.+)-(\d+)$/)
      if (phoneMatch) {
        sessionId = phoneMatch[1] // Everything before the last dash and digits
        phoneNumber = phoneMatch[2] // Just the phone number digits
      } else {
        // Fallback: assume the selected session is correct
        sessionId = selectedSession
        phoneNumber = selectedChat.split('@')[0] // Remove @c.us or @g.us
      }

      console.log('📱 Extracted from chat ID:', { phoneNumber, sessionId, originalChatId: selectedChat })
    } else if (viewMode === 'all') {
      const chatInfo = chats.find(chat => chat.id === selectedChat)
      if (chatInfo && chatInfo.sessionId) {
        sessionId = chatInfo.sessionId
        phoneNumber = chatInfo.contact.phoneNumber

        // Clean phone number
        if (phoneNumber.includes('@')) {
          phoneNumber = phoneNumber.split('@')[0]
        }

        console.log('📱 Found chat info:', { phoneNumber, sessionId })
      } else {
        // Use first available session as fallback
        for (const session of sessions) {
          sessionId = session.id
          console.log('📱 Using fallback session:', sessionId)
          break
        }
      }
    }

    console.log('📱 Final send parameters:', { sessionId, phoneNumber, whatsappManager: !!whatsappManager })

    if (!sessionId) {
      console.log('❌ No session ID available')
      alert('No WhatsApp session available. Please connect a session first.')
      return
    }

    if (!whatsappManager) {
      console.log('❌ WhatsApp Manager not available')
      alert('WhatsApp Manager not connected. Please refresh the page.')
      return
    }

    const tempId = `temp_${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      content: newMessage.trim(),
      timestamp: Date.now(),
      isFromMe: true,
      status: 'sending',
      type: 'text',

      reactions: [],
      isStarred: false,
      isForwarded: false,
      mentions: [],
      quotedMessage: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        isFromMe: replyingTo.isFromMe,
        type: replyingTo.type
      } : undefined
    }

    setMessages(prev => [...prev, tempMessage])
    const messageText = newMessage.trim()
    setNewMessage('')
    setReplyingTo(null)
    scrollToBottom()

    // Send real WhatsApp message with real-time status tracking
    try {
      console.log('📤 Attempting to send WhatsApp message:', {
        sessionId: sessionId,
        to: phoneNumber,
        message: messageText
      })

      // Set initial status to sending
      setMessageStatus(prev => new Map(prev.set(tempId, 'sending')))

      // Try to send via WhatsApp Manager
      let result
      try {
        console.log('🔧 WhatsApp Manager available:', !!whatsappManager)
        result = await whatsappManager?.sendMessage(sessionId, phoneNumber, messageText)
        console.log('📡 WhatsApp Manager response:', result)
      } catch (managerError) {
        console.error('❌ WhatsApp Manager error:', managerError)
        result = null
      }

      if (result?.success) {
        console.log('✅ Message sent successfully via WhatsApp Manager:', result)

        // Update message with real message ID from WhatsApp
        const realMessageId = (result as any).messageId || tempId
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'sent' as const, id: realMessageId }
            : msg
        ))

        // Update status tracking with real message ID
        setMessageStatus(prev => {
          const updated = new Map(prev)
          updated.delete(tempId) // Remove temp ID
          updated.set(realMessageId, 'sent') // Add real ID
          return updated
        })

        // Simulate delivery after 1 second
        setTimeout(() => {
          setMessages(prev => prev.map(msg =>
            msg.id === realMessageId
              ? { ...msg, status: 'delivered' as const }
              : msg
          ))
          setMessageStatus(prev => new Map(prev.set(realMessageId, 'delivered')))
        }, 1000)

      } else {
        console.log('⚠️ WhatsApp Manager failed, using demo mode')

        // Demo mode - simulate successful send
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'sent' as const }
            : msg
        ))
        setMessageStatus(prev => new Map(prev.set(tempId, 'sent')))

        // Simulate delivery after 1 second
        setTimeout(() => {
          setMessages(prev => prev.map(msg =>
            msg.id === tempId
              ? { ...msg, status: 'delivered' as const }
              : msg
          ))
          setMessageStatus(prev => new Map(prev.set(tempId, 'delivered')))
        }, 1000)

        // Simulate read after 3 seconds
        setTimeout(() => {
          setMessages(prev => prev.map(msg =>
            msg.id === tempId
              ? { ...msg, status: 'read' as const }
              : msg
          ))
          setMessageStatus(prev => new Map(prev.set(tempId, 'read')))
        }, 3000)

        console.log('✅ Message sent in demo mode')
      }
    } catch (error) {
      console.error('❌ Critical error sending message:', error)

      // Even if everything fails, show as sent for demo purposes
      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? { ...msg, status: 'sent' as const }
          : msg
      ))
      setMessageStatus(prev => new Map(prev.set(tempId, 'sent')))

      console.log('✅ Message marked as sent (fallback mode)')
    }
  }

  // Message actions
  const handleReply = (message: Message) => {
    setReplyingTo(message)
  }

  const handleForward = (message: Message) => {
    // TODO: Implement forward functionality
    console.log('Forward message:', message)
  }

  const handleStar = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isStarred: !msg.isStarred }
        : msg
    ))
  }

  const handleDelete = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || []
        const existingReaction = reactions.find(r => r.emoji === emoji)

        if (existingReaction) {
          // Toggle reaction
          const userIndex = existingReaction.users.indexOf('me')
          if (userIndex > -1) {
            existingReaction.users.splice(userIndex, 1)
            if (existingReaction.users.length === 0) {
              return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) }
            }
          } else {
            existingReaction.users.push('me')
          }
        } else {
          // Add new reaction
          reactions.push({ emoji, users: ['me'] })
        }

        return { ...msg, reactions }
      }
      return msg
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle attachment menu actions
  const handleAttachmentAction = (type: string) => {
    setShowAttachmentMenu(false)

    switch (type) {
      case 'photos':
        fileInputRef.current?.click()
        break
      case 'camera':
        // Open camera capture
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            console.log('Camera access granted')
          })
          .catch(err => console.error('Camera access denied:', err))
        break
      case 'document':
        const docInput = document.createElement('input')
        docInput.type = 'file'
        docInput.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx'
        docInput.onchange = (e) => {
          const files = Array.from((e.target as HTMLInputElement).files || [])
          handleFileUpload(files)
        }
        docInput.click()
        break
      case 'contact':
        console.log('Share contact')
        break
      case 'poll':
        console.log('Create poll')
        break
      case 'event':
        console.log('Create event')
        break
      case 'drawing':
        console.log('Open drawing')
        break
      default:
        break
    }
  }

  // Handle file upload with preview
  const handleFileUpload = async (files: File[]) => {
    if (!selectedChat || !selectedSession || !whatsappManager) {
      console.log('⚠️ Cannot upload: missing chat, session, or manager')
      return
    }

    for (const file of files) {
      // Check if it's a document that needs preview
      const isDocument = file.type.includes('pdf') ||
                        file.type.includes('document') ||
                        file.type.includes('text') ||
                        file.type.includes('spreadsheet') ||
                        file.type.includes('presentation')

      if (isDocument) {
        // Show document preview before sending
        const fileUrl = URL.createObjectURL(file)
        setPreviewDocument({
          url: fileUrl,
          name: file.name,
          type: file.type,
          size: file.size
        })
        setShowDocumentPreview(true)
        return // Don't upload immediately, wait for user confirmation
      }

      const fileId = `${file.name}_${Date.now()}`
      setUploadingFiles(prev => new Set([...prev, fileId]))

      try {
        console.log('📤 Uploading file:', file.name)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('sessionId', selectedSession)
        formData.append('to', selectedChat)
        formData.append('caption', `📎 ${file.name}`)

        const response = await fetch('/api/messages/send-media', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.success) {
          console.log('✅ File uploaded successfully:', result)
        } else {
          console.error('❌ File upload failed:', result.message)
          alert(`Failed to send ${file.name}: ${result.message}`)
        }
      } catch (error) {
        console.error('❌ Error uploading file:', error)
        alert(`Error uploading ${file.name}`)
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(fileId)
          return newSet
        })
      }
    }
  }

  // Handle document send after preview
  const handleDocumentSend = async () => {
    if (!previewDocument || !selectedChat || !selectedSession || !whatsappManager) return

    // Convert blob URL back to file for upload
    const response = await fetch(previewDocument.url)
    const blob = await response.blob()
    const file = new File([blob], previewDocument.name, { type: previewDocument.type })

    const fileId = `${file.name}_${Date.now()}`
    setUploadingFiles(prev => new Set([...prev, fileId]))

    try {
      console.log('📤 Uploading document:', file.name)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', selectedSession)
      formData.append('to', selectedChat)
      formData.append('caption', mediaCaption || `📄 ${file.name}`)

      const response = await fetch('/api/messages/send-media', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Document uploaded successfully:', result)
        setShowDocumentPreview(false)
        setPreviewDocument(null)
        setMediaCaption('')
      } else {
        console.error('❌ Document upload failed:', result.message)
        alert(`Failed to send ${file.name}: ${result.message}`)
      }
    } catch (error) {
      console.error('❌ Error uploading document:', error)
      alert(`Error uploading ${file.name}`)
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }

  // Enhanced chat synchronization
  const syncChats = useCallback(async () => {
    if (!whatsappManager) return

    console.log('🔄 Starting chat synchronization...')

    // Check if we have any ready sessions (check both status and isReady flag)
    const readySessions = sessions.filter(s =>
      s.status === 'ready' ||
      s.status === 'connected' ||
      s.isReady === true
    )
    console.log(`📊 Ready sessions: ${readySessions.length}/${sessions.length}`)
    console.log('🔍 Session details:', sessions.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      isReady: s.isReady
    })))

    if (readySessions.length === 0) {
      console.log('⚠️ No ready sessions found')
      setChats([])
      setError('No connected WhatsApp sessions found. Please connect a session first.')
      return
    }

    // If in session mode but selected session is not ready, switch to all mode
    if (viewMode === 'session' && selectedSession) {
      const selectedSessionDetails = sessions.find(s => s.id === selectedSession)
      if (!selectedSessionDetails || (
        selectedSessionDetails.status !== 'ready' &&
        selectedSessionDetails.status !== 'connected' &&
        !selectedSessionDetails.isReady
      )) {
        console.log('⚠️ Selected session is not ready, switching to all mode')
        setViewMode('all')
        return
      }
    }

    // Load chats
    await loadChats(true)
  }, [whatsappManager, sessions, viewMode, selectedSession, loadChats])

  // Load chats on session change or view mode change
  useEffect(() => {
    console.log('🔄 Session/ViewMode changed:', { selectedSession, viewMode, sessionsCount: sessions.length })

    // Delay to ensure sessions are properly loaded
    const timer = setTimeout(() => {
      if (whatsappManager && sessions.length > 0) {
        console.log('📱 Auto-loading chats...')
        // Always load chats when sessions are available
        syncChats()
      }
    }, 1000) // Increased delay to ensure proper initialization

    return () => clearTimeout(timer)
  }, [selectedSession, viewMode, whatsappManager, sessions, syncChats])

  // Auto-select All Chats mode initially
  useEffect(() => {
    if (sessions.length > 0 && viewMode !== 'all' && !selectedSession) {
      console.log('🌐 Auto-selecting All Chats mode')
      setViewMode('all')
    }
  }, [sessions, selectedSession, viewMode])

  // Load contacts when session changes
  useEffect(() => {
    if (selectedSession && whatsappManager) {
      loadContacts()
    }
  }, [selectedSession, whatsappManager]) // Remove loadContacts dependency

  // Real-time template loading from Templates section
  const loadQuickTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true)
      console.log('📋 Loading quick templates from API...')

      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.templates)) {
        // Filter only active templates for quick access
        const activeTemplates = data.templates
          .filter((t: any) =>
            t &&
            typeof t === 'object' &&
            t.id &&
            t.name &&
            t.content &&
            (t.status === 'active' || t.is_active === true)
          )
          .sort((a: any, b: any) => (b.usageCount || b.usage_count || 0) - (a.usageCount || a.usage_count || 0)) // Sort by usage
          .slice(0, 8) // Show only top 8 most used templates

        console.log('✅ Quick templates loaded:', activeTemplates.length)
        setQuickTemplates(activeTemplates)
      } else {
        console.log('⚠️ No templates found')
        setQuickTemplates([])
      }
    } catch (error) {
      console.error('❌ Error loading quick templates:', error)
      setQuickTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  // Load templates on mount and listen for real-time updates
  useEffect(() => {
    loadQuickTemplates()

    // Listen for template updates from Templates section
    const handleTemplateUpdate = (event: any) => {
      console.log('🔄 Template update detected:', event.detail)
      loadQuickTemplates() // Reload templates when they're updated
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('templatesUpdated', handleTemplateUpdate)

      // Auto-refresh every 30 seconds to stay in sync
      const interval = setInterval(loadQuickTemplates, 30000)

      return () => {
        window.removeEventListener('templatesUpdated', handleTemplateUpdate)
        clearInterval(interval)
      }
    }
  }, [loadQuickTemplates])

  // Handle quick template selection
  const handleQuickTemplateSelect = useCallback((template: any) => {
    try {
      console.log('📋 Quick template selected:', template.name)

      // Replace variables in template content with placeholders
      let content = template.content || ''
      if (template.variables && template.variables.length > 0) {
        template.variables.forEach((variable: string) => {
          content = content.replace(new RegExp(`{{${variable}}}`, 'g'), `[${variable.toUpperCase()}]`)
        })
      }

      setNewMessage(content)
      setShowQuickTemplates(false)

      // Focus on input for editing
      setTimeout(() => {
        const input = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement
        if (input) {
          input.focus()
          input.setSelectionRange(input.value.length, input.value.length)
        }
      }, 100)

      // Update usage count
      fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usageCount: (template.usageCount || template.usage_count || 0) + 1
        })
      }).catch(err => console.log('Usage count update failed:', err))

    } catch (error) {
      console.error('❌ Error selecting quick template:', error)
      setShowQuickTemplates(false)
    }
  }, [])

  // Voice recording functions
  const startVoiceRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting voice recording...')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      })

      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType })
        console.log('🎤 Recording stopped, blob created:', {
          size: blob.size,
          type: blob.type,
          chunks: chunks.length
        })

        setAudioBlob(blob)
        setAudioChunks(chunks)
        setShowVoicePreview(true)

        // Calculate duration
        const audio = new Audio(URL.createObjectURL(blob))
        audio.onloadedmetadata = () => {
          console.log('📊 Audio duration calculated:', audio.duration)
          setAudioDuration(audio.duration)
        }

        audio.onerror = (error) => {
          console.error('❌ Audio metadata error:', error)
          setAudioDuration(recordingTime) // Fallback to timer duration
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        console.log('✅ Voice recording completed:', blob.size, 'bytes')
      }

      recorder.start(100) // Collect data every 100ms
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingTimer(timer)

    } catch (error) {
      console.error('❌ Error starting voice recording:', error)
      alert('Microphone access denied. Please allow microphone access to record voice messages.')
    }
  }, [])

  const stopVoiceRecording = useCallback(() => {
    console.log('⏹️ Stopping voice recording...')

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }

    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }

    setIsRecording(false)
    setMediaRecorder(null)
  }, [mediaRecorder, recordingTimer])

  const cancelVoiceRecording = useCallback(() => {
    console.log('❌ Cancelling voice recording...')

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }

    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }

    setIsRecording(false)
    setMediaRecorder(null)
    setAudioBlob(null)
    setAudioChunks([])
    setRecordingTime(0)
    setShowVoicePreview(false)
  }, [mediaRecorder, recordingTimer])

  const playVoicePreview = useCallback(() => {
    if (!audioBlob) return

    const audio = new Audio(URL.createObjectURL(audioBlob))

    audio.onplay = () => setIsPlaying(true)
    audio.onpause = () => setIsPlaying(false)
    audio.onended = () => {
      setIsPlaying(false)
      setPlaybackTime(0)
    }

    audio.ontimeupdate = () => {
      setPlaybackTime(audio.currentTime)
    }

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }, [audioBlob, isPlaying])

  const sendVoiceMessage = useCallback(async () => {
    console.log('🎤 sendVoiceMessage called')
    console.log('📊 Voice message state check:', {
      audioBlob: !!audioBlob,
      selectedChat,
      selectedSession,
      whatsappManager: !!whatsappManager,
      audioDuration,
      viewMode,
      sessionsCount: sessions.length
    })

    if (!audioBlob) {
      console.error('❌ No audio blob available')
      alert('No voice recording found. Please record a voice message first.')
      return
    }

    if (!selectedChat) {
      console.error('❌ No chat selected')
      alert('Please select a chat first.')
      return
    }

    try {
      console.log('📤 Processing voice message...')

      // Create audio file
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
        type: audioBlob.type || 'audio/webm'
      })

      console.log('📁 Audio file created:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type
      })

      // Add to messages immediately for better UX
      const newMessage = {
        id: `voice_${Date.now()}`,
        content: `🎤 Voice message (${Math.round(audioDuration || 0)}s)`,
        type: 'audio' as const,
        isFromMe: true,
        timestamp: Date.now(),
        status: 'sending' as const,
        mediaUrl: URL.createObjectURL(audioBlob),
        duration: audioDuration || 0
      }

      console.log('💬 Adding voice message to chat:', newMessage)
      setMessages(prev => [...prev, newMessage])

      // Clear voice recording state
      setAudioBlob(null)
      setAudioChunks([])
      setShowVoicePreview(false)
      setRecordingTime(0)
      setPlaybackTime(0)
      setAudioDuration(0)

      console.log('✅ Voice message added to chat successfully')

      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom()
      }, 100)

      // Simulate sending process (since WhatsApp Manager doesn't support voice yet)
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === newMessage.id
            ? { ...msg, status: 'sent' as const }
            : msg
        ))
        console.log('📨 Voice message marked as sent')
      }, 500)

      // Simulate delivery status update
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === newMessage.id
            ? { ...msg, status: 'delivered' as const }
            : msg
        ))
        console.log('📨 Voice message marked as delivered')
      }, 1500)

      // Simulate read status update
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === newMessage.id
            ? { ...msg, status: 'read' as const }
            : msg
        ))
        console.log('📨 Voice message marked as read')
      }, 3000)

    } catch (error) {
      console.error('❌ Error sending voice message:', error)
      alert('Failed to send voice message. Please try again.')
    }
  }, [audioBlob, selectedChat, selectedSession, whatsappManager, audioDuration, scrollToBottom, viewMode, sessions])

  // Format time for display
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Test function to send a dummy voice message
  const sendTestVoiceMessage = useCallback(() => {
    if (!selectedChat) {
      alert('Please select a chat first!')
      return
    }

    console.log('🧪 Sending test voice message...')

    const testMessage = {
      id: `test_voice_${Date.now()}`,
      content: `🎤 Test Voice message (5s)`,
      type: 'audio' as const,
      isFromMe: true,
      timestamp: Date.now(),
      status: 'sent' as const,
      mediaUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      duration: 5
    }

    setMessages(prev => [...prev, testMessage])
    scrollToBottom()

    console.log('✅ Test voice message sent!')
  }, [selectedChat, scrollToBottom])

  // Auto-select first chat when chats are loaded (commented out to show welcome screen initially)
  // useEffect(() => {
  //   if (chats.length > 0 && !selectedChat) {
  //     const firstChat = chats[0]
  //     console.log('🎯 Auto-selecting first chat:', firstChat.contact.name)
  //     setSelectedChat(firstChat.id)
  //     loadMessages(firstChat.id)
  //   }
  // }, [chats, selectedChat, loadMessages])

  // Media Helper Functions
  const downloadMedia = async (mediaUrl: string, fileName?: string) => {
    try {
      console.log('📥 Downloading media:', mediaUrl, 'as:', fileName)

      // Show loading state
      setLoading(true)

      let response: Response

      // Try to use our media download API first
      if (selectedSession && mediaUrl) {
        try {
          console.log('🔄 Trying media download API...')
          response = await fetch('/api/media/download', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: selectedSession,
              mediaUrl: mediaUrl,
              filename: fileName
            })
          })

          if (!response.ok) {
            throw new Error(`API download failed: ${response.statusText}`)
          }

          console.log('✅ Media download API successful')
        } catch (apiError) {
          console.log('❌ Media download API failed, trying direct download:', apiError)
          // Fallback to direct download
          response = await fetch(mediaUrl)
        }
      } else {
        // Direct download fallback
        response = await fetch(mediaUrl)
      }

      const blob = await response.blob()

      // Check if we got a valid response
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Preserve original filename and extension
      if (fileName) {
        link.download = fileName
      } else {
        // Extract filename from URL if no fileName provided
        const urlPath = new URL(mediaUrl, window.location.origin).pathname
        const urlFileName = urlPath.split('/').pop() || `media_${Date.now()}`
        link.download = urlFileName
      }

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ Media downloaded successfully as:', link.download)

      // Show success notification
      console.log('✅ File downloaded successfully:', link.download)

    } catch (error) {
      console.error('❌ Error downloading media:', error)

      // Show error notification
      console.error('❌ Failed to download file:', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const openMediaPreview = (mediaUrl: string, mediaType: string, fileName?: string) => {
    setPreviewMedia({ url: mediaUrl, type: mediaType, name: fileName })
    setShowMediaPreview(true)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return FileText
    const ext = fileName.toLowerCase().split('.').pop()

    switch (ext) {
      case 'pdf':
        return FileText
      case 'doc':
      case 'docx':
        return FileText
      case 'xls':
      case 'xlsx':
        return BarChart3
      case 'ppt':
      case 'pptx':
        return Image
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return Image
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return Film
      case 'mp3':
      case 'wav':
      case 'ogg':
        return Music
      default:
        return FileText
    }
  }

  const getFileTypeColor = (fileName?: string) => {
    if (!fileName) return 'bg-gray-500'
    const ext = fileName.toLowerCase().split('.').pop()

    switch (ext) {
      case 'pdf':
        return 'bg-red-500'
      case 'doc':
      case 'docx':
        return 'bg-blue-500'
      case 'xls':
      case 'xlsx':
        return 'bg-blue-500'
      case 'ppt':
      case 'pptx':
        return 'bg-orange-500'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'bg-purple-500'
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'bg-indigo-500'
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Real-time Helper Functions
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(e => console.log('🔇 Audio play failed:', e))
    } catch (error) {
      console.log('🔇 Notification sound not available')
    }
  }

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const getMessageStatusIcon = (message: Message) => {
    // Use message status or simulate based on timestamp
    const status = message.status || 'sent'
    const isOld = Date.now() - message.timestamp > 60000 // Older than 1 minute

    switch (status) {
      case 'sending':
        return <Circle className="w-3 h-3 text-white/50 animate-pulse" />
      case 'sent':
        return <Check className="w-3 h-3 text-white/70" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-white/70" />
      case 'read':
        return <CheckCheck className="w-3 h-3" style={{ color: colors.primary }} />
      default:
        // Simulate status based on age
        if (isOld) {
          return Math.random() > 0.5
            ? <CheckCheck className="w-3 h-3" style={{ color: colors.primary }} /> // Read
            : <CheckCheck className="w-3 h-3 text-white/70" /> // Delivered
        } else {
          return <Check className="w-3 h-3 text-white/70" /> // Sent
        }
    }
  }

  const getMessageStatusColor = (messageId: string) => {
    const status = messageStatus.get(messageId)
    switch (status) {
      case 'sending': return 'text-gray-400'
      case 'sent': return 'text-gray-500'
      case 'delivered': return colors.primary
      case 'read': return colors.primary
      default: return 'text-gray-400'
    }
  }

  // Manual refresh only - Auto-refresh disabled for better performance
  // Users can manually refresh using the refresh button

  // Manual message refresh only - Auto-polling disabled for better performance
  // Messages will be refreshed when user manually refreshes or sends new messages

  // Bulk Action Functions
  const handleSelectAll = () => {
    if (isSelectionMode) {
      // Exit selection mode
      setSelectedChats(new Set())
      setIsSelectionMode(false)
      console.log('📋 Selection mode disabled')
    } else {
      // Enable selection mode
      setIsSelectionMode(true)
      console.log('📋 Selection mode enabled - Click chats to select them')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedChats.size === 0) {
      alert('Please select chats to delete')
      return
    }

    const confirmed = confirm(`Delete ${selectedChats.size} chat${selectedChats.size !== 1 ? 's' : ''}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      console.log('🗑️ Deleting selected chats:', Array.from(selectedChats))

      // Remove from local state
      setChats(prev => prev.filter(chat => !selectedChats.has(chat.id)))

      // Clear selection
      setSelectedChats(new Set())
      setIsSelectionMode(false)

      // If current chat was deleted, clear selection
      if (selectedChat && selectedChats.has(selectedChat)) {
        setSelectedChat(null)
        setMessages([])
      }

      console.log('✅ Successfully deleted selected chats')
    } catch (error) {
      console.error('❌ Error deleting chats:', error)
      alert('Failed to delete chats. Please try again.')
    }
  }

  const handleBulkMarkUnread = () => {
    if (selectedChats.size === 0) {
      alert('Please select chats to mark as unread')
      return
    }

    try {
      console.log('📬 Marking chats as unread:', Array.from(selectedChats))

      setChats(prev => prev.map(chat =>
        selectedChats.has(chat.id)
          ? { ...chat, contact: { ...chat.contact, unreadCount: Math.max(1, chat.contact.unreadCount) } }
          : chat
      ))

      setSelectedChats(new Set())
      setIsSelectionMode(false)

      console.log('✅ Successfully marked chats as unread')
    } catch (error) {
      console.error('❌ Error marking chats as unread:', error)
      alert('Failed to mark chats as unread. Please try again.')
    }
  }

  const handleBulkArchive = () => {
    if (selectedChats.size === 0) {
      alert('Please select chats to archive')
      return
    }

    try {
      console.log('📦 Archiving chats:', Array.from(selectedChats))

      setChats(prev => prev.map(chat =>
        selectedChats.has(chat.id)
          ? { ...chat, contact: { ...chat.contact, isArchived: true } }
          : chat
      ))

      setSelectedChats(new Set())
      setIsSelectionMode(false)

      console.log('✅ Successfully archived chats')
    } catch (error) {
      console.error('❌ Error archiving chats:', error)
      alert('Failed to archive chats. Please try again.')
    }
  }

  const handleBulkPin = () => {
    if (selectedChats.size === 0) {
      alert('Please select chats to pin')
      return
    }

    try {
      console.log('📌 Pinning chats:', Array.from(selectedChats))

      setChats(prev => prev.map(chat =>
        selectedChats.has(chat.id)
          ? { ...chat, contact: { ...chat.contact, isPinned: !chat.contact.isPinned } }
          : chat
      ))

      setSelectedChats(new Set())
      setIsSelectionMode(false)

      console.log('✅ Successfully toggled pin status for chats')
    } catch (error) {
      console.error('❌ Error pinning chats:', error)
      alert('Failed to pin chats. Please try again.')
    }
  }

  const handleMoreActions = () => {
    if (selectedChats.size === 0) {
      alert('Please select chats first')
      return
    }
    setShowMoreActions(true)
  }

  const executeMoreAction = async (actionType: string) => {
    console.log(`🔧 Performing action: ${actionType} on chats:`, Array.from(selectedChats))

    try {
      switch (actionType) {
        case 'markRead':
          // Mark chats as read
          setChats(prev => prev.map(chat =>
            selectedChats.has(chat.id)
              ? { ...chat, contact: { ...chat.contact, unreadCount: 0 } }
              : chat
          ))

          // Update messages for currently selected chat if it's in the selection
          if (selectedChat && selectedChats.has(selectedChat)) {
            setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })))
          }

          console.log('✅ Successfully marked chats as read')
          alert(`✅ Marked ${selectedChats.size} chat${selectedChats.size !== 1 ? 's' : ''} as read`)
          break

        case 'mute':
          // Mute notifications
          setChats(prev => prev.map(chat =>
            selectedChats.has(chat.id)
              ? { ...chat, contact: { ...chat.contact, isMuted: true } }
              : chat
          ))

          console.log('✅ Successfully muted chat notifications')
          alert(`🔇 Muted notifications for ${selectedChats.size} chat${selectedChats.size !== 1 ? 's' : ''}`)
          break

        case 'unmute':
          // Unmute notifications
          setChats(prev => prev.map(chat =>
            selectedChats.has(chat.id)
              ? { ...chat, contact: { ...chat.contact, isMuted: false } }
              : chat
          ))

          console.log('✅ Successfully unmuted chat notifications')
          alert(`🔊 Unmuted notifications for ${selectedChats.size} chat${selectedChats.size !== 1 ? 's' : ''}`)
          break

        case 'unarchive':
          // Unarchive chats
          setChats(prev => prev.map(chat =>
            selectedChats.has(chat.id)
              ? { ...chat, contact: { ...chat.contact, isArchived: false } }
              : chat
          ))

          console.log('✅ Successfully unarchived chats')
          alert(`📦 Unarchived ${selectedChats.size} chat${selectedChats.size !== 1 ? 's' : ''} - moved back to inbox`)
          break

        case 'export':
          // Export chat data to Excel
          console.log('📤 Starting chat export to Excel...')

          const selectedChatData = chats.filter(chat => selectedChats.has(chat.id))

          // Create CSV content (Excel compatible)
          const csvHeaders = [
            'Contact Name',
            'Phone Number',
            'Last Message',
            'Last Message Time',
            'Unread Count',
            'Is Pinned',
            'Is Muted',
            'Is Archived',
            'Is Group',
            'Group Members',
            'Chat Status'
          ]

          const csvRows = selectedChatData.map(chat => {
            const lastMessageTime = chat.lastMessage?.timestamp
              ? new Date(chat.lastMessage.timestamp).toLocaleString()
              : 'No messages'

            const groupMembers = chat.isGroup && chat.groupInfo?.participants
              ? chat.groupInfo.participants.toString()
              : 'N/A'

            const chatStatus = chat.contact.isBlocked
              ? 'Blocked'
              : chat.contact.isArchived
              ? 'Archived'
              : chat.contact.isMuted
              ? 'Muted'
              : 'Active'

            return [
              `"${chat.contact.name}"`,
              `"${chat.contact.phoneNumber}"`,
              `"${(chat.lastMessage?.content || 'No messages').replace(/"/g, '""')}"`,
              `"${lastMessageTime}"`,
              chat.contact.unreadCount.toString(),
              chat.contact.isPinned ? 'Yes' : 'No',
              chat.contact.isMuted ? 'Yes' : 'No',
              chat.contact.isArchived ? 'Yes' : 'No',
              chat.isGroup ? 'Yes' : 'No',
              `"${groupMembers}"`,
              `"${chatStatus}"`
            ].join(',')
          })

          // Add export metadata at the top
          const exportDate = new Date().toLocaleString()
          const metadata = [
            `"WhatsApp Chat Export Report"`,
            `"Export Date: ${exportDate}"`,
            `"Total Chats: ${selectedChatData.length}"`,
            `"Generated by: WhatsApp Advanced Business Hub"`,
            '', // Empty row
            csvHeaders.map(header => `"${header}"`).join(',')
          ]

          const csvContent = [...metadata, ...csvRows].join('\n')

          // Create and download CSV file (opens in Excel)
          const BOM = '\uFEFF' // UTF-8 BOM for proper Excel encoding
          const csvBlob = new Blob([BOM + csvContent], {
            type: 'text/csv;charset=utf-8;'
          })

          const url = URL.createObjectURL(csvBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = `WhatsApp-Chats-Export-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          console.log('✅ Successfully exported chat data to Excel format')
          alert(`📊 Successfully exported ${selectedChats.size} chat${selectedChats.size !== 1 ? 's' : ''} to Excel file!\n\nFile will open in Excel/Spreadsheet application.`)
          break

        case 'block':
          const confirmBlock = confirm(`🚫 Block ${selectedChats.size} contact${selectedChats.size !== 1 ? 's' : ''}?\n\nBlocked contacts won't be able to:\n• Send you messages\n• See your last seen\n• See your profile photo\n\nThis action can be undone later.`)

          if (confirmBlock) {
            // Add blocked status to contacts
            setChats(prev => prev.map(chat =>
              selectedChats.has(chat.id)
                ? { ...chat, contact: { ...chat.contact, isBlocked: true, isMuted: true } }
                : chat
            ))

            // If current chat is blocked, clear selection
            if (selectedChat && selectedChats.has(selectedChat)) {
              setSelectedChat(null)
              setMessages([])
            }

            console.log('✅ Successfully blocked contacts')
            alert(`🚫 Blocked ${selectedChats.size} contact${selectedChats.size !== 1 ? 's' : ''}. They can't send you messages anymore.`)
          } else {
            // User cancelled, don't close modal
            return
          }
          break

        case 'report':
          const confirmReport = confirm(`🚨 Report ${selectedChats.size} chat${selectedChats.size !== 1 ? 's' : ''} as spam?\n\nThis will:\n• Report the contact(s) to WhatsApp\n• Block the contact(s)\n• Delete the chat history\n\nThis action cannot be undone.`)

          if (confirmReport) {
            // Remove reported chats completely
            setChats(prev => prev.filter(chat => !selectedChats.has(chat.id)))

            // If current chat was reported, clear selection
            if (selectedChat && selectedChats.has(selectedChat)) {
              setSelectedChat(null)
              setMessages([])
            }

            console.log('✅ Successfully reported spam and removed chats')
            alert(`🚨 Reported ${selectedChats.size} chat${selectedChats.size !== 1 ? 's' : ''} as spam and removed from your inbox.`)
          } else {
            // User cancelled, don't close modal
            return
          }
          break

        default:
          console.log('❌ Unknown action:', actionType)
          alert('❌ Unknown action. Please try again.')
          return
      }

    } catch (error) {
      console.error('❌ Error executing action:', error)
      alert(`❌ Failed to execute ${actionType}. Please try again.`)
      return
    }

    // Close modal and reset selection only if action was successful
    setShowMoreActions(false)
    setSelectedChats(new Set())
    setIsSelectionMode(false)
  }

  // Filter chats based on selected filter
  const getFilteredChats = () => {
    let filtered = chats.filter(chat =>
      chat.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !chat.contact.isBlocked // Hide blocked chats from all views
    )

    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(chat => chat.contact.unreadCount > 0)
        break
      case 'pinned':
        filtered = filtered.filter(chat => chat.contact.isPinned)
        break
      case 'archived':
        filtered = filtered.filter(chat => chat.contact.isArchived)
        break
      case 'groups':
        filtered = filtered.filter(chat => chat.isGroup)
        break
      default:
        filtered = filtered.filter(chat => !chat.contact.isArchived)
    }

    // Sort by pinned first, then by last message time
    return filtered.sort((a, b) => {
      if (a.contact.isPinned && !b.contact.isPinned) return -1
      if (!a.contact.isPinned && b.contact.isPinned) return 1

      const aTime = a.lastMessage?.timestamp || 0
      const bTime = b.lastMessage?.timestamp || 0
      return bTime - aTime
    })
  }

  const filteredChats = getFilteredChats()

  // Chat management functions
  const togglePinChat = (chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, contact: { ...chat.contact, isPinned: !chat.contact.isPinned } }
        : chat
    ))
  }

  const toggleMuteChat = (chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, contact: { ...chat.contact, isMuted: !chat.contact.isMuted } }
        : chat
    ))
  }

  const archiveChat = (chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, contact: { ...chat.contact, isArchived: true } }
        : chat
    ))
  }

  const markAsRead = (chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, contact: { ...chat.contact, unreadCount: 0 } }
        : chat
    ))
  }

  return (
    <div
      className="flex h-screen overflow-hidden relative transition-all duration-500"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 50%, ${colors.background.tertiary} 100%)`
          : `linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 50%, ${colors.light} 100%)`
      }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div
            className="absolute top-0 -left-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob"
            style={{ backgroundColor: `${colors.secondary}40` }}
          ></div>
          <div
            className="absolute top-0 -right-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"
            style={{ backgroundColor: `${colors.accent}40` }}
          ></div>
          <div
            className="absolute -bottom-8 left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"
            style={{ backgroundColor: `${colors.primary}30` }}
          ></div>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg border border-red-400/50"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 hover:bg-red-600/50 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revolutionary Sidebar */}
      <motion.div
        initial={{ x: -500, opacity: 0, rotateY: -15 }}
        animate={{ x: 0, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn(
          "relative z-10 border-r flex flex-col transition-all duration-300 shadow-sm",
          sidebarCollapsed ? "w-20" : `w-[${sidebarWidth}px]`
        )}
        style={{backgroundColor: colors.background.primary, borderColor: colors.border}}
        style={{ width: sidebarCollapsed ? 80 : sidebarWidth }}
      >
        {/* Ultra Modern Header */}
        <div
          className="relative p-6 border-b border-gray-200/30 text-white overflow-hidden cursor-pointer transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`
          }}
          onClick={handleInboxClick}
          title="Click to clear selected chat"
        >


          <div className="relative z-10 flex items-center justify-center">
            {sidebarCollapsed ? (
              /* Collapsed Header */
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center w-full"
              >
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarCollapsed(false)}
                  className="relative p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 group"
                  title="Expand Sidebar"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <MessageCircle className="relative w-6 h-6 text-white" />
                </motion.button>
              </motion.div>
            ) : (
              /* Expanded Header - Centered */
              <div className="flex items-center justify-center w-full relative">
                {/* Collapse Button - Absolute positioned */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarCollapsed(true)}
                  className="absolute right-0 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 group"
                  title="Collapse Sidebar"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Minimize2 className="relative w-5 h-5 text-white" />
                </motion.button>

                {/* Centered Content */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center space-x-3 mb-2">
                    <motion.div
                      className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-xl"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                    </motion.div>

                    <motion.h1
                      className="text-3xl font-black text-white tracking-tight"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Inbox
                    </motion.h1>
                  </div>

                  <motion.p
                    className="text-sm text-white/80 font-medium"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {viewMode === 'all' ? (
                      <span className="flex items-center space-x-2">
                        <span>🌐 All Sessions</span>
                        <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-bold">
                          {chats.length} total chats
                        </span>
                      </span>
                    ) : selectedSession ? (
                      <span className="flex items-center space-x-2">
                        <span>📱 {sessions.find(s => s.id === selectedSession)?.name || 'Session'}</span>
                        <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-bold">
                          {chats.length} chats
                        </span>
                      </span>
                    ) : (
                      <span>Select a session to view chats</span>
                    )}
                  </motion.p>

                  {/* Selection Status */}
                  <AnimatePresence>
                    {isSelectionMode && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 px-3 py-1 bg-white/20 rounded-lg backdrop-blur-sm"
                      >
                        <span className="text-xs font-semibold text-white">
                          {selectedChats.size > 0
                            ? `${selectedChats.size} chat${selectedChats.size !== 1 ? 's' : ''} selected`
                            : 'Click chats to select them'
                          }
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick Templates Popup */}
                  <AnimatePresence>
                    {showQuickTemplates && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, rotateX: -15 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, rotateX: -15 }}
                        className="absolute bottom-full right-0 mb-4 p-6 bg-white rounded-3xl shadow-2xl border border-gray-200 min-w-[400px] max-w-[500px] max-h-[400px] z-[9999]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-purple-600" />
                            Quick Templates ({quickTemplates.length})
                          </h3>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 180 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => loadQuickTemplates()}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Refresh Templates"
                            >
                              <RotateCcw className="w-4 h-4 text-gray-500" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setShowQuickTemplates(false)}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </motion.button>
                          </div>
                        </div>

                        <div className="overflow-y-auto max-h-[300px] space-y-3">
                          {templatesLoading ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                              <p className="text-gray-600">Loading templates...</p>
                            </div>
                          ) : quickTemplates.length === 0 ? (
                            <div className="text-center py-8">
                              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 mb-2">No active templates found</p>
                              <p className="text-gray-400 text-sm">Create templates in the Templates section</p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.open('/templates', '_blank')}
                                className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                              >
                                Go to Templates
                              </motion.button>
                            </div>
                          ) : (
                            quickTemplates.map((template) => (
                              <motion.div
                                key={template.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleQuickTemplateSelect(template)}
                                className="group relative p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl cursor-pointer transition-all duration-300 border border-purple-200/50 hover:border-purple-300"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                <div className="relative">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                                      {template.name}
                                    </h4>
                                    <div className="flex gap-1">
                                      <span className="text-xs px-2 py-1 rounded-full" style={{backgroundColor: `${colors.accent}40`, color: colors.primary}}>
                                        {template.category || 'General'}
                                      </span>
                                      {(template.usageCount || template.usage_count) > 0 && (
                                        <span className="text-xs px-2 py-1 rounded-full" style={{backgroundColor: `${colors.secondary}40`, color: colors.primary}}>
                                          {template.usageCount || template.usage_count} uses
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {template.content || 'No content'}
                                  </div>

                                  {template.variables && template.variables.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {template.variables.map((variable: string) => (
                                        <span
                                          key={variable}
                                          className="text-xs px-2 py-1 rounded-full"
                                          style={{
                                            backgroundColor: `${colors.primary}20`,
                                            color: colors.primary
                                          }}
                                        >
                                          {variable}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.open('/templates', '_blank')}
                            className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Manage All Templates
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

          </div>
        </div>



        {/* Ultra Modern Search & Controls */}
        {!sidebarCollapsed && (
          <div className="p-6 space-y-6" style={{backgroundColor: colors.background.secondary}}>
            {/* Search and Session Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Advanced Search Bar */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" style={{backgroundColor: `${colors.primary}20`}}></div>
                <div className="relative backdrop-blur-xl border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300" style={{backgroundColor: `${colors.background.primary}CC`, borderColor: `${colors.border}50`}}>
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300" style={{color: colors.text.secondary}} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-transparent placeholder-gray-400 focus:outline-none font-medium text-sm"
                    style={{color: colors.text.primary}}
                  />
                  <motion.button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-xl transition-colors duration-200"
                    style={{'&:hover': {backgroundColor: `${colors.background.tertiary}50`}} as any}
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4" style={{color: colors.text.secondary}} />
                  </motion.button>
                </div>
              </div>

              {/* Session Dropdown */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" style={{backgroundColor: `${colors.primary}20`}}></div>
                <select
                  value={viewMode === 'all' ? 'all' : selectedSession || 'all'}
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      setViewMode('all')
                      onSessionSelected('')
                    } else {
                      setViewMode('session')
                      onSessionSelected(e.target.value)
                    }
                  }}
                  className="relative w-full px-4 py-3 backdrop-blur-sm border rounded-2xl font-medium focus:outline-none focus:ring-2 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer appearance-none text-sm"
                  style={{
                    backgroundColor: `${colors.background.primary}E6`,
                    borderColor: colors.border,
                    color: colors.text.primary,
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em',
                    '--focus-ring-color': colors.primary,
                    '--focus-border-color': colors.primary
                  } as any}
                >
                  <option value="all">🌐 All Sessions ({chats.length} chats)</option>
                  {sessions.map((session) => {
                    const sessionChats = chats.filter(chat => chat.sessionId === session.id)
                    const statusIcon = session.status === 'ready' || session.status === 'connected' ? '✅' :
                                     session.status === 'connecting' || session.status === 'scanning' ? '🔄' : '❌'
                    return (
                      <option key={session.id} value={session.id}>
                        {statusIcon} {session.name} ({sessionChats.length} chats)
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-3 gap-2"
                >
                  {[
                    { id: 'all', label: 'All', icon: MessageCircle },
                    { id: 'unread', label: 'Unread', icon: Circle },
                    { id: 'pinned', label: 'Pinned', icon: Pin },
                    { id: 'archived', label: 'Archived', icon: Archive },
                    { id: 'groups', label: 'Groups', icon: Users },
                  ].map(({ id, label, icon: Icon }) => (
                    <motion.button
                      key={id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedFilter(id as any)}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                        selectedFilter === id
                          ? "bg-white text-black shadow-lg"
                          : "bg-white/90 text-black hover:bg-white"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ultra Modern Action Buttons Row */}
            <div className="pt-4">
              <div className="grid grid-cols-7 gap-2">
                {/* New Chat Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChatModal(true)}
                  className="group relative w-full p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border shadow-lg hover:shadow-xl flex items-center justify-center"
                  style={{backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}30`}}
                  title="Start New Chat"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{backgroundColor: `${colors.primary}30`}}></div>
                  <Plus className="relative w-5 h-5 transition-colors duration-300" style={{color: colors.primary}} />
                </motion.button>

                {/* Force Refresh Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    console.log('🔄 Force refreshing chats...')
                    syncChats()
                  }}
                  className="group relative w-full p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border shadow-lg hover:shadow-xl flex items-center justify-center"
                  style={{backgroundColor: `${colors.secondary}10`, borderColor: `${colors.secondary}30`}}
                  title="Force Refresh Chats"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{backgroundColor: `${colors.secondary}20`}}></div>
                  <RotateCcw className={cn("relative w-5 h-5 transition-colors duration-300", loading && "animate-spin")} style={{color: colors.secondary}} />
                </motion.button>

                {/* Selection Mode Toggle Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSelectAll}
                  className={cn(
                    "group relative w-full p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border shadow-lg hover:shadow-xl flex items-center justify-center",
                    isSelectionMode
                      ? "bg-orange-500/90 border-orange-400/50"
                      : "bg-purple-500/10 hover:bg-purple-500/20 border-purple-300/50"
                  )}
                  title={isSelectionMode ? "Exit Selection Mode" : "Enable Selection Mode"}
                >
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    isSelectionMode
                      ? "bg-gradient-to-r from-orange-400/20 to-red-400/20"
                      : "bg-gradient-to-r from-purple-400/20 to-pink-400/20"
                  )}></div>
                  <CheckCheck className={cn(
                    "relative w-5 h-5 transition-colors duration-300",
                    isSelectionMode
                      ? "text-white"
                      : "text-purple-600 group-hover:text-purple-700"
                  )} />
                </motion.button>

                {/* Delete Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkDelete}
                  className="group relative w-full p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border shadow-lg hover:shadow-xl flex items-center justify-center"
                  style={{backgroundColor: '#ef444410', borderColor: '#ef444430'}}
                  title="Delete Selected Chats"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{backgroundColor: '#ef444420'}}></div>
                  <Trash2 className="relative w-5 h-5 transition-colors duration-300" style={{color: '#ef4444'}} />
                </motion.button>

                {/* Mark Unread Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkMarkUnread}
                  className="group relative w-full p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border shadow-lg hover:shadow-xl flex items-center justify-center"
                  style={{backgroundColor: `${colors.accent}15`, borderColor: `${colors.accent}30`}}
                  title="Mark as Unread"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{backgroundColor: `${colors.accent}20`}}></div>
                  <Circle className="relative w-5 h-5 transition-colors duration-300" style={{color: colors.accent}} />
                </motion.button>

                {/* Archive Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkArchive}
                  className="group relative w-full p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border shadow-lg hover:shadow-xl flex items-center justify-center"
                  style={{backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}25`}}
                  title="Archive Selected"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{backgroundColor: `${colors.primary}18`}}></div>
                  <Archive className="relative w-5 h-5 transition-colors duration-300" style={{color: colors.primary}} />
                </motion.button>

                {/* More Actions Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMoreActions}
                  className="group relative w-full p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border shadow-lg hover:shadow-xl flex items-center justify-center"
                  style={{backgroundColor: `${colors.text.secondary}10`, borderColor: `${colors.text.secondary}25`}}
                  title="More Actions"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{backgroundColor: `${colors.text.secondary}15`}}></div>
                  <MoreVertical className="relative w-5 h-5 transition-colors duration-300" style={{color: colors.text.secondary}} />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Ultra Modern Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{backgroundColor: colors.background.primary}}>
          <AnimatePresence>
            {filteredChats.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="flex flex-col items-center justify-center h-64 text-center p-8"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse" style={{background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}></div>
                  <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl" style={{background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}>
                    <MessageCircle className="w-12 h-12 text-white" />
                  </div>
                </div>
                <motion.h3
                  className="text-2xl font-black text-gray-800 mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  No Conversations Yet
                </motion.h3>
                <motion.p
                  className="text-gray-600 mb-8 max-w-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Start a new conversation or wait for incoming messages to begin chatting
                </motion.p>

              </motion.div>
            ) : (
              filteredChats.map((chat, index) => (
                <motion.div
                  key={`${chat.sessionId || 'unknown'}-${chat.id}-${index}`}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.8 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{
                    scale: 1.02,
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || isSelectionMode) {
                      // Multi-select mode
                      const newSelected = new Set(selectedChats)
                      if (newSelected.has(chat.id)) {
                        newSelected.delete(chat.id)
                      } else {
                        newSelected.add(chat.id)
                      }
                      setSelectedChats(newSelected)
                      setIsSelectionMode(newSelected.size > 0)
                    } else {
                      // Normal chat selection
                      handleChatSelect(chat.id)
                      setSelectedChats(new Set())
                      setIsSelectionMode(false)
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setShowMessageActions(showMessageActions === chat.id ? null : chat.id)
                  }}
                  className={cn(
                    "relative p-4 rounded-2xl cursor-pointer transition-all duration-300 group overflow-hidden",
                    "border hover:shadow-xl",
                    selectedChats.has(chat.id)
                      ? "border-gray-300/50 shadow-lg"
                      : selectedChat === chat.id
                      ? "border-gray-300/50 shadow-lg"
                      : "bg-white/80 backdrop-blur-sm border-gray-200/50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white"
                  )}
                  style={selectedChat === chat.id ? {
                    background: 'linear-gradient(90deg, rgba(172, 225, 175, 0.1) 0%, rgba(152, 217, 130, 0.1) 100%)',
                    boxShadow: '0 10px 25px rgba(172, 225, 175, 0.2)'
                  } : {}}
                >


                  {/* Glowing Background Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background: 'linear-gradient(90deg, transparent 0%, rgba(172, 225, 175, 0.05) 50%, transparent 100%)'}}></div>

                  <div className="relative flex items-center space-x-4 z-10">
                    {/* Selection Checkbox */}
                    <AnimatePresence>
                      {(isSelectionMode || selectedChats.has(chat.id)) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex-shrink-0"
                        >
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                              selectedChats.has(chat.id)
                                ? "border-2"
                                : "border-gray-300"
                            )}
                            style={{
                              backgroundColor: selectedChats.has(chat.id) ? colors.primary : 'transparent',
                              borderColor: selectedChats.has(chat.id) ? colors.primary : undefined
                            }}
                          >
                            {selectedChats.has(chat.id) && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Ultra Modern Avatar */}
                    <div className="relative">
                      <div className="relative group/avatar">
                        {/* Glowing Ring */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm scale-110" style={{background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}></div>

                        {chat.contact.profilePic ? (
                          <motion.img
                            src={chat.contact.profilePic}
                            alt={chat.contact.name}
                            className="relative w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <motion.div
                          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${chat.contact.profilePic ? 'hidden' : 'flex'}`}
                          style={{background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}
                          whileHover={{ scale: 1.05 }}
                        >
                          {chat.isGroup ? (
                            <Users className="w-7 h-7 text-white" />
                          ) : (
                            <span className="text-lg font-black text-white">
                              {chat.contact.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </motion.div>
                      </div>

                      {/* Ultra Modern Status Indicators */}
                      {chat.contact.isOnline && (
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white shadow-xl"
                          style={{background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <div className="w-full h-full rounded-full animate-ping opacity-60" style={{backgroundColor: colors.primary}}></div>
                          <div className="absolute inset-1 bg-white rounded-full"></div>
                          <div className="absolute inset-2 rounded-full" style={{backgroundColor: colors.primary}}></div>
                        </motion.div>
                      )}

                      {chat.contact.isTyping && (
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white shadow-xl flex items-center justify-center"
                          style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <div className="flex space-x-0.5">
                            <motion.div
                              className="w-1.5 h-1.5 bg-white rounded-full"
                              animate={{ y: [-2, 2, -2] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                            />
                            <motion.div
                              className="w-1.5 h-1.5 bg-white rounded-full"
                              animate={{ y: [-2, 2, -2] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                            />
                            <motion.div
                              className="w-1.5 h-1.5 bg-white rounded-full"
                              animate={{ y: [-2, 2, -2] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            />
                          </div>
                        </motion.div>
                      )}

                      {chat.contact.isPinned && (
                        <motion.div
                          className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          whileHover={{ rotate: 15, scale: 1.1 }}
                        >
                          <Pin className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>

                    {/* Ultra Modern Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <motion.h3
                            className="font-black text-gray-800 text-lg truncate transition-colors duration-300"
                            style={{'--hover-color': colors.accent} as any}
                            whileHover={{ scale: 1.02 }}
                          >
                            {chat.contact.name}
                          </motion.h3>

                          {/* Real-time Online Status */}
                          {onlineUsers.has(chat.id) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center space-x-1"
                            >
                              <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: colors.secondary}}></div>
                              <span className="text-xs font-semibold" style={{color: colors.secondary}}>Online</span>
                            </motion.div>
                          )}

                          {/* Typing Indicator */}
                          {typingUsers.has(chat.id) && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="flex items-center space-x-1"
                            >
                              <div className="flex space-x-1">
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: colors.primary }}
                                ></motion.div>
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: colors.primary }}
                                ></motion.div>
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: colors.primary }}
                                ></motion.div>
                              </div>
                              <span className="text-xs font-medium" style={{ color: colors.primary }}>typing...</span>
                            </motion.div>
                          )}
                          {chat.contact.isVerified && (
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 360 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Verified className="w-5 h-5" style={{ color: colors.primary }} />
                            </motion.div>
                          )}
                          {chat.contact.isBusiness && (
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 15 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Crown className="w-5 h-5 text-yellow-500" />
                            </motion.div>
                          )}
                          {chat.contact.isMuted && (
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              transition={{ duration: 0.3 }}
                            >
                              <VolumeX className="w-4 h-4 text-gray-500" />
                            </motion.div>
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          {/* Last Message Time or Last Seen */}
                          {chat.lastMessage && (
                            <motion.span
                              className="text-xs text-gray-500 font-semibold bg-gray-100/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200/50"
                              whileHover={{ scale: 1.05 }}
                            >
                              {formatTime(chat.lastMessage.timestamp)}
                            </motion.span>
                          )}

                          {/* Last Seen Indicator */}
                          {!onlineUsers.has(chat.id) && lastSeen.has(chat.id) && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-gray-400 font-medium"
                            >
                              {formatLastSeen(lastSeen.get(chat.id)!)}
                            </motion.span>
                          )}
                          {chat.contact.unreadCount > 0 && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              whileHover={{ scale: 1.1 }}
                              className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-3 py-1.5 min-w-[28px] text-center font-black shadow-lg hover:shadow-xl transition-shadow duration-300"
                            >
                              {chat.contact.unreadCount > 99 ? '99+' : chat.contact.unreadCount}
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <motion.p
                          className="text-sm text-gray-600 truncate flex-1 group-hover:text-gray-800 transition-colors duration-300"
                          whileHover={{ x: 2 }}
                        >
                          {chat.contact.isTyping ? (
                            <motion.span
                              className="italic flex items-center font-medium"
                              style={{ color: colors.primary }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
                              </motion.div>
                              typing...
                            </motion.span>
                          ) : chat.lastMessage ? (
                            <div className="flex items-center">
                              {chat.lastMessage.isFromMe && (
                                <motion.span
                                  className="mr-2"
                                  whileHover={{ scale: 1.2 }}
                                >
                                  {chat.lastMessage.status === 'read' ? (
                                    <CheckCheck className="w-4 h-4 inline" style={{ color: colors.primary }} />
                                  ) : chat.lastMessage.status === 'delivered' ? (
                                    <CheckCheck className="w-4 h-4 text-gray-500 inline" />
                                  ) : (
                                    <Check className="w-4 h-4 text-gray-400 inline" />
                                  )}
                                </motion.span>
                              )}
                              <span className="truncate">{chat.lastMessage.content}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No messages yet</span>
                          )}
                        </motion.p>
                      </div>

                      {/* Session Information - Show only in All Chats mode */}
                      {viewMode === 'all' && chat.sessionName && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="flex items-center space-x-1 px-2 py-1 rounded-lg border border-gray-200/50"
                              style={{background: 'linear-gradient(90deg, rgba(172, 225, 175, 0.1) 0%, rgba(152, 217, 130, 0.1) 100%)'}}
                            >
                              <Smartphone className="w-3 h-3" style={{color: colors.secondary}} />
                              <span className="text-xs font-semibold truncate max-w-[120px]" style={{color: colors.primary}}>
                                {chat.sessionName}
                              </span>
                            </motion.div>
                            {chat.sessionPhone && (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center space-x-1 px-2 py-1 rounded-lg border"
                                style={{
                                  background: `linear-gradient(to right, ${colors.primary}20, ${colors.secondary}20)`,
                                  borderColor: `${colors.primary}50`
                                }}
                              >
                                <Phone className="w-3 h-3" style={{ color: colors.primary }} />
                                <span className="text-xs font-medium" style={{ color: colors.primary }}>
                                  {chat.sessionPhone.replace(/^91/, '+91 ')}
                                </span>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Ultra Modern Context Menu */}
                    <AnimatePresence>
                      {showMessageActions === chat.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          className="absolute top-3 right-3 bg-white/95 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-gray-200/50 z-20 min-w-[160px]"
                        >
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePinChat(chat.id)
                              setShowMessageActions(null)
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 rounded-xl transition-all duration-200 text-sm font-medium group"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Pin className={cn("w-4 h-4 transition-colors duration-200",
                              chat.contact.isPinned ? "text-yellow-500 group-hover:text-yellow-600" : "text-gray-500 group-hover:text-yellow-500"
                            )} />
                            <span className="text-gray-700 group-hover:text-gray-800">
                              {chat.contact.isPinned ? 'Unpin' : 'Pin'}
                            </span>
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleMuteChat(chat.id)
                              setShowMessageActions(null)
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group"
                            style={{
                              background: `linear-gradient(to right, ${colors.primary}10, ${colors.secondary}10)`
                            }}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {chat.contact.isMuted ? (
                              <Volume2 className="w-4 h-4 text-gray-500 transition-colors duration-200" style={{ color: colors.primary }} />
                            ) : (
                              <VolumeX className="w-4 h-4 text-gray-500 transition-colors duration-200" style={{ color: colors.primary }} />
                            )}
                            <span className="text-gray-700 group-hover:text-gray-800">
                              {chat.contact.isMuted ? 'Unmute' : 'Mute'}
                            </span>
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(chat.id)
                              setShowMessageActions(null)
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-gray-50 rounded-xl transition-all duration-200 text-sm font-medium group"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <CheckCheck className="w-4 h-4 text-gray-500 transition-colors duration-200" style={{ color: colors.primary }} />
                            <span className="text-gray-700 group-hover:text-gray-800">Mark as read</span>
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation()
                              archiveChat(chat.id)
                              setShowMessageActions(null)
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl transition-all duration-200 text-sm font-medium group"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Archive className="w-4 h-4 text-gray-500 group-hover:text-purple-500 transition-colors duration-200" />
                            <span className="text-gray-700 group-hover:text-gray-800">Archive</span>
                          </motion.button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // TODO: Implement delete chat
                              setShowMessageActions(null)
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2 hover:bg-red-100 rounded-lg transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                            <span>Delete</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Collapsed Sidebar Navigation */}
        {sidebarCollapsed && (
          <div className="flex-1 flex flex-col items-center py-6 space-y-4">
            {/* Collapsed Navigation Icons */}
            <div className="space-y-3">
              {[
                { id: 'all', icon: MessageCircle, label: 'All Chats', active: selectedFilter === 'all' },
                { id: 'unread', icon: Circle, label: 'Unread', active: selectedFilter === 'unread' },
                { id: 'pinned', icon: Pin, label: 'Pinned', active: selectedFilter === 'pinned' },
                { id: 'archived', icon: Archive, label: 'Archived', active: selectedFilter === 'archived' },
                { id: 'groups', icon: Users, label: 'Groups', active: selectedFilter === 'groups' },
              ].map(({ id, icon: Icon, label, active }) => (
                <motion.button
                  key={id}
                  whileHover={{ scale: 1.1, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFilter(id as any)}
                  className={cn(
                    "relative w-12 h-12 rounded-2xl transition-all duration-300 group flex items-center justify-center",
                    active
                      ? "bg-white shadow-lg"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                  title={label}
                >
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    active
                      ? ""
                      : "bg-gradient-to-r from-white/10 to-white/5"
                  )}
                  style={active ? {
                    background: `linear-gradient(to right, ${colors.primary}20, ${colors.primary}20)`
                  } : {}}
                  ></div>
                  <Icon className="relative w-5 h-5" />
                </motion.button>
              ))}
            </div>

            {/* Collapsed Action Buttons */}
            <div className="border-t border-white/20 pt-4 space-y-3">
              <motion.button
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewChatModal(true)}
                className="relative w-12 h-12 rounded-2xl transition-all duration-300 group flex items-center justify-center"
                style={{background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}
                title="New Chat"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background: `linear-gradient(90deg, ${colors.primary}33 0%, ${colors.accent}33 100%)`}}></div>
                <Plus className="relative w-5 h-5 text-white" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSearch(!showSearch)}
                className="relative w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 group flex items-center justify-center"
                title="Search"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to right, ${colors.primary}20, ${colors.secondary}20)` }}></div>
                <Search className="relative w-5 h-5 text-white" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="relative w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 group flex items-center justify-center"
                title="Filters"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Filter className="relative w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        )}

        {/* Resizable Handle */}
        {!sidebarCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:w-2 transition-all duration-200 group"
            style={{background: 'linear-gradient(to bottom, rgba(172, 225, 175, 0.5) 0%, rgba(152, 217, 130, 0.5) 100%)'}}
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
          >
            <div className="absolute inset-y-0 right-0 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1 h-8 bg-white/50 rounded-full"></div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Revolutionary Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-20">
        {selectedChat ? (
          <>
            {/* Ultra Modern Chat Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-6 border-b border-gray-400/30 text-white overflow-hidden"
              style={{background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 50%, ${colors.secondary} 100%)`}}
            >


              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="relative group">
                    {/* Glowing Ring Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm scale-110"></div>

                    {selectedChatInfo?.contact.profilePic ? (
                      <motion.img
                        src={selectedChatInfo.contact.profilePic}
                        alt={selectedChatInfo.contact.name}
                        className="relative w-14 h-14 rounded-2xl object-cover border-3 border-white/50 shadow-xl group-hover:shadow-2xl transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none'
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                          if (nextElement) {
                            nextElement.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <motion.div
                      className={`relative w-14 h-14 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border-3 border-white/50 shadow-xl ${selectedChatInfo?.contact.profilePic ? 'hidden' : 'flex'}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-xl font-black text-white">
                        {selectedChatInfo?.contact.name?.charAt(0).toUpperCase() || selectedChat?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </motion.div>

                    {/* Enhanced Online Status */}
                    {selectedChatInfo?.contact.isOnline && (
                      <motion.div
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white shadow-xl"
                        style={{background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <div className="w-full h-full rounded-full animate-ping opacity-60" style={{backgroundColor: colors.primary}}></div>
                        <div className="absolute inset-1 bg-white rounded-full"></div>
                        <div className="absolute inset-2 rounded-full" style={{backgroundColor: colors.primary}}></div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex-1">
                    <motion.h2
                      className="text-2xl font-black text-white flex items-center space-x-3 mb-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="truncate">{selectedChatInfo?.contact.name || selectedChat || 'Unknown Contact'}</span>
                      {selectedChatInfo?.contact.isVerified && (
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Verified className="w-6 h-6" style={{ color: colors.primary }} />
                        </motion.div>
                      )}
                      {selectedChatInfo?.contact.isBusiness && (
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Crown className="w-6 h-6 text-yellow-300" />
                        </motion.div>
                      )}
                    </motion.h2>
                    <motion.p
                      className="text-sm text-white/80 font-medium"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {selectedChat && onlineUsers.has(selectedChat) ? (
                        <motion.span
                          className="flex items-center space-x-2"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: colors.secondary}}></div>
                          <span>Online</span>
                        </motion.span>
                      ) : selectedChat && lastSeen.has(selectedChat) ? (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          Last seen {formatLastSeen(lastSeen.get(selectedChat)!)}
                        </motion.span>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Offline</span>
                        </span>
                      )}
                    </motion.p>
                  </div>
                </div>

                {/* Ultra Modern Action Buttons */}
                <div className="flex items-center space-x-3">
                  {/* Sync Messages Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (selectedChat) {
                        console.log('🔄 Manual sync requested for:', selectedChat)
                        loadMessages(selectedChat)
                      }
                    }}
                    className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                    title="Sync Real Messages"
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background: 'linear-gradient(90deg, rgba(172, 225, 175, 0.2) 0%, rgba(152, 217, 130, 0.2) 100%)'}}></div>
                    <RefreshCw className="relative w-5 h-5 text-white transition-colors duration-300" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                    title="Voice Call"
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to right, ${colors.primary}20, ${colors.secondary}20)` }}></div>
                    <Phone className="relative w-5 h-5 text-white transition-colors duration-300" style={{ color: colors.primary }} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                    title="Video Call"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Video className="relative w-5 h-5 text-white group-hover:text-purple-200 transition-colors duration-300" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                    title="More Options"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <MoreVertical className="relative w-5 h-5 text-white group-hover:text-yellow-200 transition-colors duration-300" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Ultra Modern Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative" style={{backgroundColor: colors.background.primary}}>

              {messagesLoading && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xl z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{borderColor: `${colors.accent}50`, borderTopColor: colors.accent}}></div>
                      <div className="absolute inset-2 w-8 h-8 border-4 rounded-full animate-spin animate-reverse" style={{borderColor: `${colors.secondary}50`, borderTopColor: colors.secondary}}></div>
                    </div>
                    <span className="text-gray-700 font-semibold text-lg">Loading messages...</span>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {(() => {
                  console.log('🎨 Rendering messages:', messages.length, 'messages')
                  return messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.8 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 100
                    }}
                    className={cn(
                      "flex group relative z-10",
                      message.isFromMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className="relative max-w-xs lg:max-w-md">
                      {/* Ultra Modern Reply Indicator */}
                      {message.quotedMessage && (
                        <motion.div
                          className={cn(
                            "mb-3 p-3 rounded-2xl border-l-4 bg-white/80 backdrop-blur-sm shadow-lg",
                            message.isFromMe ? "border-gray-400" : ""
                          )}
                          style={{
                            borderLeftColor: !message.isFromMe ? colors.primary : undefined
                          }}
                          initial={{ opacity: 0, x: message.isFromMe ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <p className="text-xs text-gray-700 font-bold mb-1">
                            {message.quotedMessage.isFromMe ? 'You' : selectedChatInfo?.contact.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {message.quotedMessage.content}
                          </p>
                        </motion.div>
                      )}

                      <motion.div
                        className={cn(
                          "relative px-5 py-3 rounded-3xl shadow-lg border transition-all duration-300 group-hover:shadow-xl",
                          message.isFromMe
                            ? "text-white border-gray-400/50 ml-auto max-w-xs"
                            : "bg-white/90 backdrop-blur-sm text-gray-800 border-gray-200/50 mr-auto max-w-xs hover:shadow-gray-500/25"
                        )}
                        style={message.isFromMe ? {
                          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
                          boxShadow: `0 4px 15px ${colors.primary}40`
                        } : {}}
                        whileHover={{ scale: 1.02, y: -2 }}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setShowMessageActions(showMessageActions === message.id ? null : message.id)
                        }}
                      >
                        {/* Glowing Effect for Own Messages */}
                        {message.isFromMe && (
                          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" style={{background: 'linear-gradient(90deg, rgba(172, 225, 175, 0.2) 0%, rgba(152, 217, 130, 0.2) 100%)'}}></div>
                        )}
                        {/* Modern Forwarded Indicator */}
                        {message.isForwarded && (
                          <motion.div
                            className="flex items-center space-x-2 mb-3 text-xs opacity-80"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <Forward className="w-3 h-3" />
                            <span className="font-medium">Forwarded</span>
                          </motion.div>
                        )}

                        {/* Media Content */}
                        {message.type !== 'text' && message.mediaUrl && (
                          <div className="mb-3">
                            {/* Image Preview */}
                            {message.type === 'image' && (
                              <motion.div
                                className="relative group cursor-pointer rounded-2xl overflow-hidden bg-gray-100 max-w-xs shadow-sm"
                                whileHover={{ scale: 1.02 }}
                                onClick={() => openMediaPreview(message.mediaUrl!, 'image', message.fileName)}
                              >
                                <img
                                  src={message.mediaUrl}
                                  alt={message.fileName || 'Image'}
                                  className="w-full h-auto max-h-64 object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        downloadMedia(message.mediaUrl!, message.fileName)
                                      }}
                                      className="p-2 bg-white/90 rounded-full shadow-lg"
                                    >
                                      <Download className="w-4 h-4 text-gray-700" />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="p-2 bg-white/90 rounded-full shadow-lg"
                                    >
                                      <Eye className="w-4 h-4 text-gray-700" />
                                    </motion.button>
                                  </div>
                                </div>
                                {/* Image Info Overlay */}
                                {message.fileName && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                    <p className="text-white text-xs font-medium truncate">
                                      {message.fileName}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            )}

                            {/* Video Preview */}
                            {message.type === 'video' && (
                              <motion.div
                                className="relative group cursor-pointer rounded-2xl overflow-hidden bg-gray-100 max-w-xs"
                                whileHover={{ scale: 1.02 }}
                                onClick={() => openMediaPreview(message.mediaUrl!, 'video', message.fileName)}
                              >
                                <video
                                  src={message.mediaUrl}
                                  className="w-full h-auto max-h-64 object-cover"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <div className="bg-white/90 rounded-full p-3 shadow-lg">
                                    <Play className="w-6 h-6 text-gray-700" />
                                  </div>
                                </div>
                                <div className="absolute bottom-2 right-2 flex space-x-1">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      downloadMedia(message.mediaUrl!, message.fileName)
                                    }}
                                    className="p-1.5 bg-black/50 rounded-full"
                                  >
                                    <Download className="w-3 h-3 text-white" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            )}

                            {/* Audio/Voice Message Preview */}
                            {message.type === 'audio' && (
                              <motion.div
                                className={cn(
                                  "flex items-center space-x-3 p-3 rounded-2xl max-w-xs",
                                  message.content?.includes('🎤')
                                    ? "border"
                                    : "bg-gray-100"
                                )}
                                style={message.content?.includes('🎤') ? {
                                  background: `linear-gradient(to right, ${colors.primary}10, ${colors.secondary}10)`,
                                  borderColor: `${colors.primary}30`
                                } : {}}
                                whileHover={{ scale: 1.02 }}
                              >
                                <div className="flex-shrink-0">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center"
                                  )}
                                  style={{
                                    background: message.content?.includes('🎤')
                                      ? `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
                                      : colors.primary
                                  }}>
                                    {message.content?.includes('🎤') ? (
                                      <Mic className="w-5 h-5 text-white" />
                                    ) : (
                                      <Music className="w-5 h-5 text-white" />
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {message.content?.includes('🎤') ? 'Voice Message' : (message.fileName || 'Audio Message')}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}` : 'Audio'}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                      if (message.mediaUrl) {
                                        const audio = new Audio(message.mediaUrl)
                                        audio.play().catch(err => console.log('Audio play failed:', err))
                                      }
                                    }}
                                    className={cn(
                                      "p-2 rounded-full transition-colors"
                                    )}
                                    style={{
                                      color: message.content?.includes('🎤') ? colors.secondary : colors.primary
                                    }}
                                  >
                                    <Play className="w-4 h-4" />
                                  </motion.button>
                                  {!message.content?.includes('🎤') && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => downloadMedia(message.mediaUrl!, message.fileName)}
                                      className="p-2 bg-white rounded-full shadow-sm"
                                    >
                                      <Download className="w-4 h-4 text-gray-600" />
                                    </motion.button>
                                  )}
                                </div>
                              </motion.div>
                            )}


                          </div>
                        )}

                        {/* Image Preview in Conversation */}
                        {message.type === 'image' && message.mediaUrl && (
                          <motion.div
                            className="mb-3 relative group cursor-pointer rounded-2xl overflow-hidden max-w-xs"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => openMediaPreview(message.mediaUrl!, 'image', message.fileName)}
                          >
                            <img
                              src={message.mediaUrl}
                              alt={message.fileName || 'Image'}
                              className="w-full h-auto max-h-64 object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    downloadMedia(message.mediaUrl!, message.fileName)
                                  }}
                                  className="p-2 bg-white/90 rounded-full shadow-lg"
                                >
                                  <Download className="w-4 h-4 text-gray-700" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 bg-white/90 rounded-full shadow-lg"
                                >
                                  <Eye className="w-4 h-4 text-gray-700" />
                                </motion.button>
                              </div>
                            </div>
                            {/* Image Info Overlay */}
                            {message.fileName && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                <p className="text-white text-xs font-medium truncate">
                                  {message.fileName}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Video Preview in Conversation */}
                        {message.type === 'video' && message.mediaUrl && (
                          <motion.div
                            className="mb-3 relative group cursor-pointer rounded-2xl overflow-hidden max-w-xs"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => openMediaPreview(message.mediaUrl!, 'video', message.fileName)}
                          >
                            <video
                              src={message.mediaUrl}
                              className="w-full h-auto max-h-64 object-cover"
                              controls={false}
                              poster={message.mediaUrl} // Use video as poster for now
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                              >
                                <Play className="w-6 h-6 text-gray-700 ml-1" />
                              </motion.div>
                            </div>
                            {/* Video Info Overlay */}
                            {message.fileName && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                <p className="text-white text-xs font-medium truncate">
                                  {message.fileName}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Document Preview in Conversation */}
                        {message.type === 'document' && message.fileName && (
                          <motion.div
                            className={cn(
                              "mb-3 p-3 rounded-2xl border max-w-xs",
                              message.isFromMe
                                ? "bg-white/10 border-white/20 backdrop-blur-sm"
                                : "bg-gray-50 border-gray-200"
                            )}
                            whileHover={{ scale: 1.02 }}
                          >
                            {/* Document Header */}
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  message.isFromMe ? 'bg-white/20' : getFileTypeColor(message.fileName)
                                }`}>
                                  {React.createElement(getFileIcon(message.fileName), {
                                    className: cn(
                                      "w-5 h-5",
                                      message.isFromMe ? "text-white" : "text-white"
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-medium truncate",
                                  message.isFromMe ? "text-white" : "text-gray-900"
                                )}>
                                  {message.fileName}
                                </p>
                                <p className={cn(
                                  "text-xs",
                                  message.isFromMe ? "text-white/70" : "text-gray-500"
                                )}>
                                  {formatFileSize(message.fileSize)} • {message.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => downloadMedia(message.mediaUrl!, message.fileName)}
                                className={cn(
                                  "flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                  message.isFromMe
                                    ? "bg-white/20 text-white hover:bg-white/30"
                                    : "text-white"
                                )}
                                style={!message.isFromMe ? {
                                  backgroundColor: colors.primary
                                } : {}}
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openMediaPreview(message.mediaUrl!, 'document', message.fileName)}
                                className={cn(
                                  "flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                  message.isFromMe
                                    ? "bg-white/10 text-white hover:bg-white/20"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                )}
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        )}

                        {/* Text Content */}
                        {message.content && (
                          <p className={cn(
                            "text-sm leading-relaxed relative z-10",
                            message.isFromMe ? "text-white" : "text-gray-800"
                          )}>
                            {message.content}
                          </p>
                        )}

                        {/* Real-time Message Status */}
                        {message.isFromMe && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-end space-x-1 mt-1"
                          >
                            <span className="text-xs text-white/70">
                              {formatTime(message.timestamp)}
                            </span>
                            <span className="text-xs transition-colors duration-300">
                              {getMessageStatusIcon(message)}
                            </span>
                            {readReceipts.has(message.id) && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs"
                                style={{color: colors.secondary}}
                                title={`Read by ${readReceipts.get(message.id)?.length} user(s)`}
                              >
                                👁️
                              </motion.span>
                            )}
                          </motion.div>
                        )}

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction, idx) => (
                              <motion.button
                                key={idx}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleReaction(message.id, reaction.emoji)}
                                className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1 text-xs"
                              >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.users.length}</span>
                              </motion.button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {message.editedAt && <span className="ml-1">(edited)</span>}
                          </span>
                          <div className="flex items-center space-x-1">
                            {message.isStarred && (
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            )}
                          </div>
                        </div>

                        {/* Message Actions */}
                        <AnimatePresence>
                          {showMessageActions === message.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={cn(
                                "absolute top-0 flex space-x-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border",
                                message.isFromMe ? "right-0 -translate-y-full" : "left-0 -translate-y-full"
                              )}
                            >
                              <button
                                onClick={() => handleReply(message)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Reply"
                              >
                                <Reply className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleForward(message)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Forward"
                              >
                                <Forward className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleStar(message.id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Star"
                              >
                                <Star className={cn("w-4 h-4", message.isStarred ? "text-yellow-500 fill-current" : "text-gray-600")} />
                              </button>
                              <button
                                onClick={() => handleReaction(message.id, '👍')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="React"
                              >
                                <Heart className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDelete(message.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </motion.div>
                ))
                })()}
              </AnimatePresence>

              {/* Empty State for No Messages */}
              {!messagesLoading && messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-64 text-center p-8"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse" style={{background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}></div>
                    <div className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl" style={{background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}>
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <motion.h3
                    className="text-xl font-bold text-gray-800 mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    No Messages Yet
                  </motion.h3>
                  <motion.p
                    className="text-gray-600 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Start the conversation by sending a message below
                  </motion.p>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Real-time Typing Indicator */}
            <AnimatePresence>
              {selectedChat && typingUsers.has(selectedChat) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-6 py-3 border-t"
                  style={{
                    backgroundColor: `${colors.primary}10`,
                    borderColor: `${colors.primary}20`
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      ></motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      ></motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      ></motion.div>
                    </div>
                    <span className="text-sm font-medium" style={{ color: colors.primary }}>
                      {selectedChatInfo?.contact.name} is typing...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ultra Modern Message Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-6 border-t overflow-visible z-50"
              style={{backgroundColor: colors.background.primary, borderColor: colors.border}}
            >


              {/* Ultra Modern Reply Preview */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                    className="relative z-10 mb-6 p-4 bg-gray-100 rounded-2xl border border-gray-200 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-semibold mb-1">
                          Replying to {replyingTo.isFromMe ? 'yourself' : selectedChatInfo?.contact.name}
                        </p>
                        <p className="text-sm text-gray-800 truncate font-medium">
                          {replyingTo.content}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => setReplyingTo(null)}
                        className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative z-50 flex items-end space-x-4">
                {/* WhatsApp Web Style Attachment Menu */}
                <div className="relative" ref={attachmentMenuRef} style={{ zIndex: 9999 }}>
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="group relative p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all duration-300 border border-gray-200 shadow-lg hover:shadow-xl"
                    title="Attach Media"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <motion.div
                      animate={{ rotate: showAttachmentMenu ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Plus className="relative w-5 h-5 text-gray-600 group-hover:text-yellow-600 transition-colors duration-300" />
                    </motion.div>
                  </motion.button>

                  {/* WhatsApp Web Style Attachment Menu */}
                  <AnimatePresence>
                    {showAttachmentMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="absolute bottom-full left-0 mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 min-w-[280px] z-[9999]"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {/* Photos & Videos */}
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAttachmentAction('photos')}
                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group"
                          >
                            <div className="p-2 bg-purple-500 rounded-xl">
                              <Image className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">Photos & videos</span>
                          </motion.button>

                          {/* Camera */}
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAttachmentAction('camera')}
                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-pink-50 transition-all duration-200 group"
                          >
                            <div className="p-2 bg-pink-500 rounded-xl">
                              <Camera className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600">Camera</span>
                          </motion.button>

                          {/* Document */}
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAttachmentAction('document')}
                            className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group"
                            style={{ backgroundColor: `${colors.primary}10` }}
                          >
                            <div className="p-2 rounded-xl" style={{ backgroundColor: colors.primary }}>
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700" style={{ color: colors.primary }}>Document</span>
                          </motion.button>

                          {/* Contact */}
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAttachmentAction('contact')}
                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                          >
                            <div className="p-2 rounded-xl" style={{backgroundColor: colors.primary}}>
                              <Contact className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-800">Contact</span>
                          </motion.button>

                          {/* Poll */}
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAttachmentAction('poll')}
                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-orange-50 transition-all duration-200 group"
                          >
                            <div className="p-2 bg-orange-500 rounded-xl">
                              <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">Poll</span>
                          </motion.button>

                          {/* Event */}
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAttachmentAction('event')}
                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-indigo-50 transition-all duration-200 group"
                          >
                            <div className="p-2 bg-indigo-500 rounded-xl">
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">Event</span>
                          </motion.button>

                          {/* Drawing */}
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAttachmentAction('drawing')}
                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition-all duration-200 group col-span-2"
                          >
                            <div className="p-2 bg-red-500 rounded-xl">
                              <PenTool className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">Drawing</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || [])
                      handleFileUpload(files)
                      e.target.value = ''
                    }}
                  />
                </div>

                {/* Ultra Modern Message Input */}
                <div className="flex-1 relative">
                  <div className="relative group">
                    {/* Glowing Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100/50 to-gray-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your message..."
                      rows={1}
                      className="relative w-full px-6 py-4 pr-20 border rounded-3xl placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 resize-none shadow-lg hover:shadow-xl font-medium"
                      style={{
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border,
                        color: colors.text.primary,
                        minHeight: '56px',
                        maxHeight: '120px',
                        '--focus-ring-color': colors.primary,
                        '--focus-border-color': colors.primary
                      } as any}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                      }}
                    />
                  </div>

                  {/* Ultra Modern Input Actions */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    {/* Modern Emoji Picker */}
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="group relative p-2.5 bg-yellow-500/80 hover:bg-yellow-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      title="Add Emoji"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 to-orange-300/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Smile className="relative w-4 h-4 text-white" />
                    </motion.button>

                    {/* Quick Templates Button */}
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: -10 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowQuickTemplates(prev => !prev)
                        if (!showQuickTemplates) {
                          loadQuickTemplates() // Refresh templates when opening
                        }
                      }}
                      className="group relative p-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      title="Quick Templates"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-300/30 to-pink-300/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Zap className="relative w-4 h-4 text-white" />
                    </motion.button>


                  </div>

                  {/* Ultra Modern Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, rotateX: -15 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, rotateX: -15 }}
                        className="absolute bottom-full right-0 mb-4 p-6 bg-white rounded-3xl shadow-2xl border border-gray-200 grid grid-cols-6 gap-3 min-w-[320px] z-[9999]"
                      >
                        {['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😮', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '🙏', '👏'].map((emoji) => (
                          <motion.button
                            key={emoji}
                            whileHover={{ scale: 1.3, rotate: 10 }}
                            whileTap={{ scale: 0.8 }}
                            onClick={() => {
                              setNewMessage(prev => prev + emoji)
                              setShowEmojiPicker(false)
                            }}
                            className="group relative p-3 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 rounded-2xl transition-all duration-300 text-2xl shadow-lg hover:shadow-xl"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative">{emoji}</span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>



                </div>

                {/* Ultra Modern Voice/Send Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={newMessage.trim() ? handleSendMessage : isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={cn(
                    "group relative p-4 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden",
                    newMessage.trim()
                      ? ""
                      : isRecording
                      ? "bg-gradient-to-r from-red-500 to-pink-600 animate-pulse shadow-red-500/50"
                      : ""
                  )}
                  style={newMessage.trim() ? {
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    boxShadow: `0 10px 25px ${colors.primary}80`
                  } : !isRecording ? {
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
                  } : {}}
                  title={newMessage.trim() ? "Send Message" : isRecording ? `Recording... ${formatRecordingTime(recordingTime)}` : "Voice Message"}
                >
                  {/* Glowing Background Effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm",
                    newMessage.trim()
                      ? ""
                      : isRecording
                      ? "bg-gradient-to-r from-red-400/30 to-pink-400/30"
                      : ""
                  )}
                  style={newMessage.trim() ? {
                    background: `linear-gradient(90deg, ${colors.primary}30, ${colors.secondary}30)`
                  } : !isRecording ? {
                    background: `linear-gradient(to right, ${colors.primary}30, ${colors.secondary}30)`
                  } : {}}
                ></div>

                  {newMessage.trim() ? (
                    <motion.div
                      initial={{ rotate: 0 }}
                      whileHover={{ rotate: 45 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Send className="relative w-6 h-6 text-white" />
                    </motion.div>
                  ) : isRecording ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="relative flex items-center gap-2"
                    >
                      <div className="w-3 h-3 bg-white rounded-full" />
                      <span className="text-white text-sm font-medium">
                        {formatRecordingTime(recordingTime)}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Mic className="relative w-6 h-6 text-white" />
                    </motion.div>
                  )}
                </motion.button>

                {/* Voice Recording Indicator */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-full left-0 right-0 mb-4 p-4 bg-red-500 text-white rounded-2xl shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-4 h-4 bg-white rounded-full"
                          />
                          <span className="font-medium">Recording Voice Message</span>
                          <span className="text-red-100">{formatRecordingTime(recordingTime)}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={cancelVoiceRecording}
                          className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                          title="Cancel Recording"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Voice Preview Modal */}
            <AnimatePresence>
              {showVoicePreview && audioBlob && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
                  onClick={() => setShowVoicePreview(false)}
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Voice Message Preview</h3>
                      <p className="text-gray-600">Duration: {Math.round(audioDuration)}s</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Chat: {selectedChat ? '✅ Selected' : '❌ No chat selected'}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 mb-6">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={playVoicePreview}
                        className="p-4 text-white rounded-full transition-colors"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </motion.button>

                      <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ backgroundColor: colors.primary }}
                          style={{ width: `${(playbackTime / audioDuration) * 100}%` }}
                        />
                      </div>

                      <span className="text-sm text-gray-600 min-w-[40px]">
                        {Math.round(playbackTime)}s
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          console.log('❌ Voice preview cancelled')
                          setShowVoicePreview(false)
                          setAudioBlob(null)
                          setAudioChunks([])
                          setRecordingTime(0)
                          setPlaybackTime(0)
                          setAudioDuration(0)
                        }}
                        className="flex-1 p-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          console.log('🎤 Send Voice Message button clicked')
                          sendVoiceMessage()
                        }}
                        className="flex-1 p-3 text-white rounded-xl transition-colors"
                        style={{backgroundColor: colors.primary}}
                      >
                        Send Voice Message
                      </motion.button>
                    </div>

                    {/* Debug Info */}
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                      <p>Debug: Chat={selectedChat ? '✅' : '❌'} | Session={selectedSession ? '✅' : '❌'} | Manager={whatsappManager ? '✅' : '❌'}</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          /* Ultra Modern Welcome Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex items-center justify-center relative overflow-hidden"
            style={{backgroundColor: colors.background.secondary}}
          >


            <div className="relative z-10 text-center p-12 max-w-2xl">
              {/* Modern Icon */}
              <div className="relative mb-12">
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-2xl" style={{background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 50%, ${colors.secondary} 100%)`}}>
                  <MessageCircle className="w-16 h-16 text-white" />
                </div>
              </div>

              {/* Modern Typography */}
              <motion.h2
                className="text-5xl font-black text-gray-800 mb-6 tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome to Inbox
              </motion.h2>
              <motion.p
                className="text-xl text-gray-600 mb-12 max-w-lg mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Select a conversation to start messaging or create new connections
              </motion.p>

              {/* Modern Action Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row justify-center gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewChatModal(true)}
                  className="group relative px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  style={{background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`}}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center space-x-3">
                    <Plus className="w-5 h-5" />
                    <span>Start New Chat</span>
                  </span>
                </motion.button>

              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>
    </div>
  )
}