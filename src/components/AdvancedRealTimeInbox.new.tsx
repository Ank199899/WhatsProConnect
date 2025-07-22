'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Send, Search, Filter, MoreVertical, Phone, Video, Paperclip,
  Smile, Star, Archive, Trash2, Pin, Users, Check, Image, FileText, 
  Download, Reply, Forward, X, MapPin, ChevronDown, ChevronUp, 
  Shield, Bell, Crown, Verified, RefreshCw, AlertCircle, Loader2, 
  CheckCheck, Circle, Zap
} from 'lucide-react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import Button from './ui/Button'

// Declare size type for Button component
declare module './ui/Button' {
  interface ButtonProps {
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  }
}
import { cn, formatTime, getTimeAgo } from '@/lib/utils'

interface Chat {
  id: string
  name: string
  phoneNumber: string
  profilePic?: string
  lastMessage?: {
    content: string
    timestamp: number
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  }
  lastMessageTime?: number
  unreadCount: number
  isOnline: boolean
  lastSeen?: number
  isPinned: boolean
  isMuted: boolean
  isArchived: boolean
  isBusiness: boolean
  isVerified: boolean
}

interface Message {
  id: string
  content: string
  timestamp: number
  isOutgoing: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}

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

export default function AdvancedRealTimeInbox({ 
  whatsappManager, 
  sessions, 
  selectedSession, 
  onSessionSelected 
}: AdvancedRealTimeInboxProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentChat = chats.find(chat => chat.id === selectedChat);
  
  const handleRefresh = async () => {
    if (!selectedSession) return;
    setRefreshing(true);
    try {
      await loadChats();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAttachment = () => {
    // TODO: Implement attachment handling
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || !selectedChat) return;
    
    const tempId = Date.now().toString();
    const tempMessage: Message = {
      id: tempId,
      content: newMessage.trim(),
      timestamp: Date.now(),
      isOutgoing: true,
      status: 'sending'
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const result = await whatsappManager.sendMessage(
        selectedSession,
        selectedChat,
        tempMessage.content
      );

      if (result.success) {
        // Update message status
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'sent' }
            : msg
        ));
      } else {
        // Mark as failed
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'failed' }
            : msg
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? { ...msg, status: 'failed' }
          : msg
      ));
    }
  };

  useEffect(() => {
    const initializeInbox = async () => {
      // Log available sessions
      console.log('Available sessions:', sessions);
      
      if (sessions.length > 0 && !selectedSession) {
        // Auto-select first active session if none selected
        const activeSession = sessions.find(s => s.status === 'connected');
        if (activeSession) {
          console.log('Auto-selecting active session:', activeSession.id);
          onSessionSelected(activeSession.id);
        }
      } else if (selectedSession) {
        console.log('Loading chats for session:', selectedSession);
        await loadChats();
      }
    };

    initializeInbox();
  }, [sessions, selectedSession]);

  // Setup WebSocket or polling for real-time updates
  useEffect(() => {
    if (!selectedSession) return;

    const updateInterval = setInterval(async () => {
      if (selectedSession) {
        await loadChats();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(updateInterval);
  }, [selectedSession]);

  const loadChats = async () => {
    try {
      console.log('Loading chats for session:', selectedSession);
      const response = await whatsappManager.getChats(selectedSession);
      console.log('Loaded chats:', response);
      if (response.success) {
        setChats(response.chats || []);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header with Session Selector */}
      <div className="p-4 bg-primary/5 border-b dark:border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold">Real-Time Inbox</h1>
          </div>
          <span className="text-sm text-muted-foreground">Advanced WhatsApp Management</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedSession || ''}
            onChange={(e) => onSessionSelected(e.target.value)}
            className="flex-1 p-2 rounded-md border border-input bg-background hover:bg-accent/50 transition-colors"
          >
            <option value="">Select WhatsApp Session</option>
            {sessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.name} ({session.phoneNumber || 'No number'})
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="w-10 h-10 p-0 hover:bg-accent/50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-80 flex flex-col border-r dark:border-gray-800">
          {/* Chat List Header */}
          <div className="p-3 border-b dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium flex items-center gap-2">
                <span>Chats</span>
                <span className="text-xs text-muted-foreground">({chats.length})</span>
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="hover:bg-accent/50">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background/95 hover:bg-accent/5 transition-colors"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={cn(
                  "w-full p-3 flex items-start gap-3 hover:bg-accent/5 transition-colors",
                  chat.id === selectedChat && "bg-accent/10",
                  chat.unreadCount > 0 && "font-medium"
                )}
              >
                <div className="relative">
                  {chat.profilePic ? (
                    <img src={chat.profilePic} alt={chat.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{chat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {chat.lastMessageTime ? getTimeAgo(chat.lastMessageTime) : ''}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage?.content || 'No messages yet'}
                  </div>
                  {(chat.unreadCount > 0 || chat.isPinned || chat.isMuted) && (
                    <div className="flex items-center gap-2 mt-1">
                      {chat.unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                      {chat.isPinned && <Pin className="w-3 h-3 text-muted-foreground" />}
                      {chat.isMuted && <Bell className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {currentChat?.profilePic ? (
                      <img 
                        src={currentChat.profilePic} 
                        alt={currentChat.name} 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    {currentChat?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {currentChat?.name}
                      {currentChat?.isBusiness && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                      {currentChat?.isVerified && (
                        <Verified className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentChat?.isOnline ? 'Online' : currentChat?.lastSeen ? `Last seen ${getTimeAgo(currentChat.lastSeen)}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4" ref={messagesEndRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.isOutgoing ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          message.isOutgoing ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.isOutgoing && (
                            <div className="flex">
                              {message.status === 'sent' && <Check className="w-3 h-3" />}
                              {message.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                              {message.status === 'read' && (
                                <CheckCheck className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <motion.div
                        className="flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Circle className="w-2 h-2 animate-bounce" />
                        <Circle className="w-2 h-2 animate-bounce delay-100" />
                        <Circle className="w-2 h-2 animate-bounce delay-200" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-3 border-t dark:border-gray-800">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="icon" className="mb-1">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="mb-1" onClick={handleAttachment}>
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <textarea
                      rows={1}
                      placeholder="Type a message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full p-3 rounded-md border border-input bg-background resize-none"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>
                  <Button 
                    disabled={!newMessage.trim()} 
                    onClick={handleSendMessage}
                    size="icon"
                    className="mb-1"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Welcome to WhatsApp Inbox</h3>
                  <p className="text-muted-foreground">
                    Select a chat from the sidebar to start messaging
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
