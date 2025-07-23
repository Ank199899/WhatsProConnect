'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Send, Search, Filter, MoreVertical, Phone, Video,
  Smile, Star, Volume2, VolumeX, Archive, Trash2, Pin, Users,
  Check, CheckCheck, Circle, AlertCircle, Zap, Sparkles,
  X, Plus, Mic, Camera, Paperclip, Crown, Verified,
  Heart, Reply, Forward, Maximize2, Minimize2, Settings
} from 'lucide-react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import { cn, formatTime } from '@/lib/utils'

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
}

export default function UltraModernInbox({ 
  whatsappManager, 
  sessions, 
  selectedSession, 
  onSessionSelected 
}: UltraModernInboxProps) {
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
  const [sidebarWidth, setSidebarWidth] = useState(500)
  const [viewMode, setViewMode] = useState<'all' | 'session'>('all')
  const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark')

  // Feature States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'pinned' | 'archived' | 'groups'>('all')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null)
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)

  // Real-time States
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [lastSeen, setLastSeen] = useState<Map<string, number>>(new Map())

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Real-time connection setup
  useEffect(() => {
    if (whatsappManager) {
      // Setup real-time message listener
      whatsappManager.onNewMessage((message: any) => {
        console.log('📨 Real-time message received:', message)

        const chatId = message.from || message.chatId || message.chat

        if (selectedChat === chatId) {
          setMessages(prev => [...prev, transformMessage(message)])
          scrollToBottom()
        }

        // Update chat list
        loadChats()
      })

      // Setup typing indicators
      whatsappManager.onTyping?.((data: any) => {
        setTypingUsers(prev => new Set([...prev, data.chatId]))
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.chatId)
            return newSet
          })
        }, 3000)
      })

      // Setup online status
      whatsappManager.onPresenceUpdate?.((data: any) => {
        if (data.isOnline) {
          setOnlineUsers(prev => new Set([...prev, data.chatId]))
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.chatId)
            return newSet
          })
          setLastSeen(prev => new Map(prev.set(data.chatId, Date.now())))
        }
      })

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
    }

    return () => {
      // Cleanup listeners
      whatsappManager?.socket?.off('new_message')
      whatsappManager?.socket?.off('typing')
      whatsappManager?.socket?.off('presence_update')
      whatsappManager?.socket?.off('contacts_updated')
    }
  }, [selectedChat, whatsappManager])

  // Transform message from API format
  const transformMessage = (rawMessage: any): Message => {
    return {
      id: rawMessage.id || `msg_${Date.now()}`,
      content: rawMessage.body || rawMessage.content || '',
      timestamp: rawMessage.timestamp || Date.now(),
      isFromMe: rawMessage.fromMe || rawMessage.isFromMe || false,
      status: rawMessage.status || 'sent',
      type: rawMessage.type || 'text',
      mediaUrl: rawMessage.mediaUrl,
      fileName: rawMessage.fileName,
      fileSize: rawMessage.fileSize,
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
  const loadChats = useCallback(async () => {
    if (!whatsappManager) return

    try {
      setLoading(true)
      setError(null)

      console.log('📱 Loading real WhatsApp chats...')

      // Get chats from WhatsApp Manager
      let rawChats: any[] = []

      if (viewMode === 'all') {
        console.log('🌐 Loading all chats from all sessions...')
        // Get chats from all sessions
        const allChats: any[] = []
        for (const session of sessions) {
          try {
            const sessionChats = await whatsappManager.getChats(session.id)
            if (sessionChats && sessionChats.length > 0) {
              // Add session ID to each chat for easy lookup
              const chatsWithSession = sessionChats.map((chat: any) => ({
                ...chat,
                sessionId: session.id
              }))
              allChats.push(...chatsWithSession)
            }
          } catch (error) {
            console.log(`⚠️ Error loading chats for session ${session.id}:`, error)
          }
        }
        rawChats = allChats
      } else if (selectedSession) {
        console.log('📱 Loading chats for selected session:', selectedSession)
        rawChats = await whatsappManager.getChats(selectedSession)
      } else {
        console.log('⚠️ No session selected and not in all mode')
        setChats([])
        setConnected(false)
        return
      }
      console.log('📋 Raw chats received:', rawChats?.length || 0)

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
          // Remove duplicates based on chat ID
          if (!unique.find(c => c.id === chat.id)) {
            unique.push(chat)
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

  // Transform chat from API format
  const transformChat = (rawChat: any): Chat => {
    return {
      id: rawChat.id || rawChat.chatId || `chat_${Date.now()}`,
      contact: {
        id: rawChat.id || rawChat.chatId,
        name: rawChat.name || rawChat.pushname || rawChat.contact?.name || 'Unknown',
        phoneNumber: rawChat.phoneNumber || rawChat.id || '',
        profilePic: rawChat.profilePicUrl || rawChat.contact?.profilePicUrl || rawChat.profilePic || rawChat.contact?.profilePic,
        isOnline: onlineUsers.has(rawChat.id),
        lastSeen: lastSeen.get(rawChat.id),
        isTyping: typingUsers.has(rawChat.id),
        isBusiness: rawChat.isBusiness || false,
        isVerified: rawChat.isVerified || false,
        isPinned: rawChat.isPinned || false,
        isMuted: rawChat.isMuted || false,
        isArchived: rawChat.isArchived || false,
        unreadCount: rawChat.unreadCount || 0
      },
      lastMessage: rawChat.lastMessage ? transformMessage(rawChat.lastMessage) : undefined,
      isGroup: rawChat.isGroup || false,
      groupInfo: rawChat.groupInfo
    }
  }

  const selectedChatInfo = chats.find(chat => chat.id === selectedChat)

  // Load messages for selected chat
  const loadMessages = useCallback(async (chatId: string) => {
    if (!whatsappManager) return

    try {
      setMessagesLoading(true)
      console.log('🔄 Loading real messages for chat:', chatId)

      // Find which session this chat belongs to
      let sessionId = selectedSession

      if (viewMode === 'all') {
        // In All Chats mode, find the session from chat data
        const chatInfo = chats.find(chat => chat.id === chatId)
        if (chatInfo && (chatInfo as any).sessionId) {
          sessionId = (chatInfo as any).sessionId
          console.log('📱 Found chat session from cache:', sessionId)
        } else {
          // Fallback: search through sessions
          for (const session of sessions) {
            try {
              const sessionChats = await whatsappManager.getChats(session.id)
              if (sessionChats && sessionChats.find((chat: any) => chat.id === chatId)) {
                sessionId = session.id
                console.log('📱 Found chat in session:', sessionId)
                break
              }
            } catch (error) {
              console.log(`⚠️ Error checking session ${session.id}:`, error)
            }
          }
        }
      }

      if (!sessionId) {
        console.log('⚠️ No session found for chat:', chatId)
        setMessages([])
        return
      }

      // Get real messages from WhatsApp Manager
      const rawMessages = await whatsappManager.getMessages(sessionId, chatId)
      console.log('📨 Raw messages received:', rawMessages?.length || 0)

      if (!rawMessages || rawMessages.length === 0) {
        console.log('⚠️ No messages found for chat:', chatId)
        setMessages([])
        scrollToBottom()
        return
      }

      // Transform messages to frontend format
      const transformedMessages = rawMessages
        .map(transformMessage)
        .filter((msg: any) => msg && msg.id) // Filter out invalid messages
        .sort((a: any, b: any) => a.timestamp - b.timestamp) // Sort by timestamp (oldest first)

      setMessages(transformedMessages)
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
    setSelectedChat(chatId)
    loadMessages(chatId)
    setSelectedMessages(new Set())
    setReplyingTo(null)
  }

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    // Find session for this chat
    let sessionId = selectedSession
    if (viewMode === 'all') {
      const chatInfo = chats.find(chat => chat.id === selectedChat)
      if (chatInfo && (chatInfo as any).sessionId) {
        sessionId = (chatInfo as any).sessionId
      } else {
        // Use first available session as fallback
        for (const session of sessions) {
          sessionId = session.id
          break
        }
      }
    }

    if (!sessionId || !whatsappManager) return

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

    // Send real WhatsApp message
    try {
      console.log('📤 Sending real WhatsApp message:', {
        sessionId: sessionId,
        to: selectedChat,
        message: messageText
      })

      const result = await whatsappManager?.sendMessage(sessionId, selectedChat, messageText)

      if (result?.success) {
        console.log('✅ Message sent successfully:', result)
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'sent' as const, id: (result as any).messageId || tempId }
            : msg
        ))

        // Simulate delivery after 1 second
        setTimeout(() => {
          setMessages(prev => prev.map(msg =>
            msg.id === ((result as any).messageId || tempId)
              ? { ...msg, status: 'delivered' as const }
              : msg
          ))
        }, 1000)
      } else {
        console.error('❌ Failed to send message:', result?.message)
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'failed' as const }
            : msg
        ))
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? { ...msg, status: 'failed' as const }
          : msg
      ))
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

  // Load chats on session change or view mode change
  useEffect(() => {
    console.log('🔄 Session/ViewMode changed:', { selectedSession, viewMode })
    if ((viewMode === 'all' || selectedSession) && whatsappManager) {
      console.log('📱 Loading chats...')
      loadChats()
    }
  }, [selectedSession, viewMode, whatsappManager, sessions])

  // Auto-select All Chats mode initially
  useEffect(() => {
    if (sessions.length > 0 && viewMode !== 'all' && !selectedSession) {
      console.log('🌐 Auto-selecting All Chats mode')
      setViewMode('all')
    }
  }, [sessions, selectedSession, viewMode])

  // Auto-select first chat when chats are loaded
  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      const firstChat = chats[0]
      console.log('🎯 Auto-selecting first chat:', firstChat.contact.name)
      setSelectedChat(firstChat.id)
      loadMessages(firstChat.id)
    }
  }, [chats, selectedChat, loadMessages])

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
    <div className={cn(
      "flex h-screen overflow-hidden relative transition-all duration-500",
      theme === 'dark'
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-green-900"
        : theme === 'light'
        ? "bg-gradient-to-br from-green-50 via-white to-emerald-50"
        : "bg-gradient-to-br from-green-50 via-white to-emerald-50" // auto mode - could be enhanced with system preference
    )}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className={cn(
            "absolute top-0 -left-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob",
            theme === 'dark' ? "bg-green-800" : "bg-green-200"
          )}></div>
          <div className={cn(
            "absolute top-0 -right-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000",
            theme === 'dark' ? "bg-emerald-800" : "bg-emerald-200"
          )}></div>
          <div className={cn(
            "absolute -bottom-8 left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000",
            theme === 'dark' ? "bg-green-700" : "bg-green-100"
          )}></div>
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
          "relative z-10 bg-white border-r border-green-200 flex flex-col transition-all duration-300 shadow-sm",
          sidebarCollapsed ? "w-20" : `w-[${sidebarWidth}px]`
        )}
        style={{ width: sidebarCollapsed ? 80 : sidebarWidth }}
      >
        {/* Ultra Modern Header */}
        <div className="relative p-6 border-b border-green-200/30 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white rounded-full -translate-x-8 -translate-y-8 animate-pulse delay-500"></div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                className="flex items-center space-x-4"
              >
                <div className="relative">
                  {/* Glowing Icon */}
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl animate-pulse"></div>
                  <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <motion.h1
                    className="text-3xl font-black text-white tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Inbox
                  </motion.h1>
                  <motion.p
                    className="text-green-100/80 text-sm font-medium"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    Advanced WhatsApp Business Hub
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
                </div>
              </motion.div>
            )}

            {/* Bulk Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Selection Mode Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSelectAll}
                className={cn(
                  "group relative p-3 rounded-2xl transition-all duration-300 backdrop-blur-sm border shadow-lg hover:shadow-xl",
                  isSelectionMode
                    ? "bg-orange-500/90 border-orange-400/50"
                    : "bg-white/10 hover:bg-white/20 border-white/20"
                )}
                title={isSelectionMode ? "Exit Selection Mode" : "Enable Selection Mode"}
              >
                <div className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  isSelectionMode
                    ? "bg-gradient-to-r from-orange-400/20 to-red-400/20"
                    : "bg-gradient-to-r from-blue-400/20 to-cyan-400/20"
                )}></div>
                <CheckCheck className={cn(
                  "relative w-5 h-5 transition-colors duration-300",
                  isSelectionMode
                    ? "text-white"
                    : "text-white group-hover:text-blue-200"
                )} />
              </motion.button>

              {/* Delete Button */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBulkDelete}
                className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                title="Delete Selected Chats"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Trash2 className="relative w-5 h-5 text-white group-hover:text-red-200 transition-colors duration-300" />
              </motion.button>

              {/* Mark Unread Button */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBulkMarkUnread}
                className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                title="Mark as Unread"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Circle className="relative w-5 h-5 text-white group-hover:text-orange-200 transition-colors duration-300" />
              </motion.button>

              {/* Archive Button */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBulkArchive}
                className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                title="Archive Selected"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Archive className="relative w-5 h-5 text-white group-hover:text-purple-200 transition-colors duration-300" />
              </motion.button>

              {/* Pin Button */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBulkPin}
                className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                title="Pin Selected"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Pin className="relative w-5 h-5 text-white group-hover:text-green-200 transition-colors duration-300" />
              </motion.button>

              {/* More Actions Button */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMoreActions}
                className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                title="More Actions"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-400/20 to-slate-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <MoreVertical className="relative w-5 h-5 text-white group-hover:text-gray-200 transition-colors duration-300" />
              </motion.button>
            </div>

          </div>
        </div>

        {/* Ultra Modern Search & Controls */}
        {!sidebarCollapsed && (
          <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
            {/* Advanced Search Bar */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search conversations, contacts, messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none font-medium text-sm"
                />
                <motion.button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-2xl hover:bg-gray-100/50 transition-colors duration-200"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    showFilters ? "text-green-500" : "text-gray-400 hover:text-green-500"
                  )} />
                </motion.button>
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

            {/* Ultra Modern Session Dropdown */}
            <div className="mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group"
              >
                {/* Glowing Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

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
                  className="relative w-full px-6 py-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 1rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em'
                  }}
                >
                  <option value="all">🌐 All Connected Sessions</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.status === 'connected' ? '✅' : session.status === 'connecting' ? '🔄' : '❌'} {session.name} {session.phoneNumber ? `(+${session.phoneNumber})` : '(Disconnected)'}
                    </option>
                  ))}
                </select>
              </motion.div>
            </div>


          </div>
        )}

        {/* Ultra Modern Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/30 to-white">
          <AnimatePresence>
            {filteredChats.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="flex flex-col items-center justify-center h-64 text-center p-8"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
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
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => {
                    // Force refresh chats
                    console.log('🚀 Start Chatting clicked - refreshing chats')
                    loadChats()
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  🚀 Start Chatting
                </motion.button>
              </motion.div>
            ) : (
              filteredChats.map((chat, index) => (
                <motion.div
                  key={chat.id}
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
                    "border hover:shadow-xl hover:shadow-green-500/10",
                    selectedChats.has(chat.id)
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300/50 shadow-lg shadow-blue-500/20"
                      : selectedChat === chat.id
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300/50 shadow-lg shadow-green-500/20"
                      : "bg-white/80 backdrop-blur-sm border-gray-200/50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white"
                  )}
                >


                  {/* Glowing Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

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
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300 hover:border-blue-400"
                            )}
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
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm scale-110"></div>

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
                          className={`relative w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${chat.contact.profilePic ? 'hidden' : 'flex'}`}
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
                          className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-white shadow-xl"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <div className="w-full h-full bg-green-300 rounded-full animate-ping opacity-60"></div>
                          <div className="absolute inset-1 bg-white rounded-full"></div>
                          <div className="absolute inset-2 bg-green-500 rounded-full"></div>
                        </motion.div>
                      )}

                      {chat.contact.isTyping && (
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full border-3 border-white shadow-xl flex items-center justify-center"
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
                            className="font-black text-gray-800 text-lg truncate group-hover:text-green-600 transition-colors duration-300"
                            whileHover={{ scale: 1.02 }}
                          >
                            {chat.contact.name}
                          </motion.h3>
                          {chat.contact.isVerified && (
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 360 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Verified className="w-5 h-5 text-blue-500" />
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
                          {chat.lastMessage && (
                            <motion.span
                              className="text-xs text-gray-500 font-semibold bg-gray-100/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200/50"
                              whileHover={{ scale: 1.05 }}
                            >
                              {formatTime(chat.lastMessage.timestamp)}
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
                              className="text-blue-500 italic flex items-center font-medium"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
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
                                    <CheckCheck className="w-4 h-4 text-blue-500 inline" />
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
                            className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 text-sm font-medium group"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {chat.contact.isMuted ? (
                              <Volume2 className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors duration-200" />
                            ) : (
                              <VolumeX className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors duration-200" />
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
                            className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-200 text-sm font-medium group"
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <CheckCheck className="w-4 h-4 text-gray-500 group-hover:text-green-500 transition-colors duration-200" />
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

        {/* Resizable Handle */}
        {!sidebarCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-green-400/50 to-emerald-500/50 cursor-col-resize hover:w-2 transition-all duration-200 group"
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
      <div className="flex-1 flex flex-col relative z-10">
        {selectedChatInfo ? (
          <>
            {/* Ultra Modern Chat Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 border-b border-green-400/30 text-white overflow-hidden"
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full translate-x-16 -translate-y-16 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-12 translate-y-12 animate-pulse delay-1000"></div>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="relative group">
                    {/* Glowing Ring Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm scale-110"></div>

                    {selectedChatInfo.contact.profilePic ? (
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
                      className={`relative w-14 h-14 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border-3 border-white/50 shadow-xl ${selectedChatInfo.contact.profilePic ? 'hidden' : 'flex'}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-xl font-black text-white">
                        {selectedChatInfo.contact.name.charAt(0).toUpperCase()}
                      </span>
                    </motion.div>

                    {/* Enhanced Online Status */}
                    {selectedChatInfo.contact.isOnline && (
                      <motion.div
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-white shadow-xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <div className="w-full h-full bg-green-300 rounded-full animate-ping opacity-60"></div>
                        <div className="absolute inset-1 bg-white rounded-full"></div>
                        <div className="absolute inset-2 bg-green-500 rounded-full"></div>
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
                      <span className="truncate">{selectedChatInfo.contact.name}</span>
                      {selectedChatInfo.contact.isVerified && (
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Verified className="w-6 h-6 text-blue-300" />
                        </motion.div>
                      )}
                      {selectedChatInfo.contact.isBusiness && (
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
                      {selectedChatInfo.contact.isOnline ? (
                        <span className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                          <span>Online</span>
                        </span>
                      ) : selectedChatInfo.contact.lastSeen ? (
                        `Last seen ${formatTime(selectedChatInfo.contact.lastSeen)}`
                      ) : (
                        'Offline'
                      )}
                    </motion.p>
                  </div>
                </div>

                {/* Ultra Modern Action Buttons */}
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
                    title="Voice Call"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Phone className="relative w-5 h-5 text-white group-hover:text-blue-200 transition-colors duration-300" />
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white relative">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
              </div>

              {messagesLoading && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xl z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-2 w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin animate-reverse"></div>
                    </div>
                    <span className="text-gray-700 font-semibold text-lg">Loading messages...</span>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((message, index) => (
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
                            message.isFromMe ? "border-green-400" : "border-blue-400"
                          )}
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
                            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400/50 ml-auto max-w-xs hover:shadow-green-500/25"
                            : "bg-white/90 backdrop-blur-sm text-gray-800 border-gray-200/50 mr-auto max-w-xs hover:shadow-gray-500/25"
                        )}
                        whileHover={{ scale: 1.02, y: -2 }}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setShowMessageActions(showMessageActions === message.id ? null : message.id)
                        }}
                      >
                        {/* Glowing Effect for Own Messages */}
                        {message.isFromMe && (
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
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

                        <p className={cn(
                          "text-sm leading-relaxed relative z-10",
                          message.isFromMe ? "text-white" : "text-gray-800"
                        )}>
                          {message.content}
                        </p>

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
                            {formatTime(message.timestamp)}
                            {message.editedAt && <span className="ml-1">(edited)</span>}
                          </span>
                          <div className="flex items-center space-x-1">
                            {message.isStarred && (
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            )}
                            {message.isFromMe && (
                              <div className="flex items-center space-x-1">
                                {message.status === 'read' ? (
                                  <CheckCheck className="w-4 h-4 text-blue-300" />
                                ) : message.status === 'delivered' ? (
                                  <CheckCheck className="w-4 h-4 text-white/70" />
                                ) : message.status === 'sent' ? (
                                  <Check className="w-4 h-4 text-white/70" />
                                ) : message.status === 'sending' ? (
                                  <Circle className="w-4 h-4 text-white/50 animate-pulse" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                )}
                              </div>
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
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Ultra Modern Message Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-6 bg-white border-t border-gray-200 overflow-hidden"
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

              <div className="relative z-10 flex items-end space-x-4">
                {/* Ultra Modern Media Attachment */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all duration-300 border border-gray-200 shadow-lg hover:shadow-xl"
                    title="Attach Media"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Paperclip className="relative w-5 h-5 text-gray-600 group-hover:text-yellow-600 transition-colors duration-300" />
                  </motion.button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      console.log('Files selected:', files)
                      // TODO: Handle file upload
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
                      className="relative w-full px-6 py-4 pr-20 bg-white border border-gray-200 rounded-3xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 resize-none shadow-lg hover:shadow-xl font-medium"
                      style={{
                        minHeight: '56px',
                        maxHeight: '120px'
                      }}
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

                    {/* Modern Camera */}
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: -15 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative p-2.5 bg-blue-500/80 hover:bg-blue-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      title="Take Photo"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-300/30 to-cyan-300/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Camera className="relative w-4 h-4 text-white" />
                    </motion.button>
                  </div>

                  {/* Ultra Modern Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, rotateX: -15 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, rotateX: -15 }}
                        className="absolute bottom-full right-0 mb-4 p-6 bg-white rounded-3xl shadow-2xl border border-gray-200 grid grid-cols-6 gap-3 min-w-[320px]"
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
                  onClick={newMessage.trim() ? handleSendMessage : () => setIsRecording(!isRecording)}
                  className={cn(
                    "group relative p-4 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden",
                    newMessage.trim()
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/50"
                      : isRecording
                      ? "bg-gradient-to-r from-red-500 to-pink-600 animate-pulse shadow-red-500/50"
                      : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 hover:shadow-blue-500/50"
                  )}
                  title={newMessage.trim() ? "Send Message" : isRecording ? "Recording..." : "Voice Message"}
                >
                  {/* Glowing Background Effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm",
                    newMessage.trim()
                      ? "bg-gradient-to-r from-green-400/30 to-emerald-400/30"
                      : isRecording
                      ? "bg-gradient-to-r from-red-400/30 to-pink-400/30"
                      : "bg-gradient-to-r from-blue-400/30 to-cyan-400/30"
                  )}></div>

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
                      className="relative w-6 h-6 bg-white rounded-full"
                    />
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Mic className="relative w-6 h-6 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        ) : (
          /* Ultra Modern Welcome Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="relative z-10 text-center p-12 max-w-2xl">
              {/* Modern Icon */}
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-30 animate-pulse scale-150"></div>
                <motion.div
                  className="relative w-32 h-32 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <MessageCircle className="w-16 h-16 text-white" />
                </motion.div>
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
                  onClick={() => {
                    // Force refresh chats to show available conversations
                    console.log('🚀 Refreshing chats for new chat...')
                    loadChats()
                  }}
                  className="group relative px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center space-x-3">
                    <span className="text-2xl">🚀</span>
                    <span>Start New Chat</span>
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Navigate to sessions page or refresh sessions
                    console.log('📱 Connecting session...')
                    window.location.reload()
                  }}
                  className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center space-x-3">
                    <span className="text-2xl">📱</span>
                    <span>Connect Session</span>
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
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Modern More Actions Modal */}
      <AnimatePresence>
        {showMoreActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMoreActions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">More Actions</h3>
                    <p className="text-gray-300 text-sm mt-1">
                      {selectedChats.size} chat{selectedChats.size !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMoreActions(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-3">
                {[
                  { id: 'markRead', label: 'Mark as Read', icon: Check, color: 'text-green-600', desc: 'Remove unread indicators' },
                  { id: 'mute', label: 'Mute Notifications', icon: VolumeX, color: 'text-orange-600', desc: 'Stop receiving notifications' },
                  { id: 'unmute', label: 'Unmute Notifications', icon: Volume2, color: 'text-blue-600', desc: 'Enable notifications' },
                  { id: 'unarchive', label: 'Unarchive Chats', icon: Archive, color: 'text-purple-600', desc: 'Move back to main inbox' },
                  { id: 'export', label: 'Export to Excel', icon: Settings, color: 'text-indigo-600', desc: 'Download as Excel spreadsheet' },
                  { id: 'block', label: 'Block Contacts', icon: AlertCircle, color: 'text-red-600', desc: 'Block selected contacts' },
                  { id: 'report', label: 'Report as Spam', icon: Sparkles, color: 'text-pink-600', desc: 'Report spam to WhatsApp' },
                ].map(({ id, label, icon: Icon, color, desc }) => (
                  <motion.button
                    key={id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => executeMoreAction(id)}
                    className="w-full flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className={cn("p-3 rounded-xl bg-gray-100 group-hover:bg-white transition-colors", color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">{label}</div>
                      <div className="text-sm text-gray-500">{desc}</div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMoreActions(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
