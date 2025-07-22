'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageData } from '@/lib/whatsapp-manager'
import { Button } from '@/components/ui/Button'
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Phone,
  Video,
  MoreVertical,
  ArrowDown,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Image,
  File,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search,
  Star,
  Archive,
  Trash2,
  Copy,
  Reply,
  Forward,
  Info
} from 'lucide-react'

interface NewChatWindowProps {
  whatsappManager: any
  conversation: any
  onBack: () => void
}

interface MessageWithStatus extends MessageData {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}

export default function NewChatWindow({
  whatsappManager,
  conversation,
  onBack
}: NewChatWindowProps) {
  // Safety check
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ No conversation selected</div>
          <button onClick={onBack} className="text-blue-500 hover:text-blue-600">
            Go back
          </button>
        </div>
      </div>
    )
  }

  // Extract data from conversation
  const messages: MessageData[] = []
  const chatName = conversation.contact.name
  const isGroup = conversation.contact.isGroup
  const isOnline = conversation.contact.isOnline
  const lastSeen = conversation.contact.lastSeen

  // State Management
  const [messageText, setMessageText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [messageText])

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Check if message is from current user (outgoing)
  const isOwnMessage = (message: MessageData): boolean => {
    return message.from === 'me' || message.from === 'self'
  }

  // Send message function
  const onSendMessage = async (message: string, mediaFile?: File) => {
    try {
      console.log('📤 Sending message:', message)
      // TODO: Implement actual message sending via whatsappManager
      // For now, just log the message
    } catch (error) {
      console.error('❌ Failed to send message:', error)
      throw error
    }
  }

  // Handle message sending
  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || isSending) return

    try {
      setIsSending(true)
      await onSendMessage(messageText.trim(), selectedFile || undefined)
      setMessageText('')
      setSelectedFile(null)

      // Focus back to textarea
      textareaRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
      // Show error toast or notification
    } finally {
      setIsSending(false)
    }
  }

  // Handle key press in textarea
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // Format timestamp
  const formatMessageTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Format last seen
  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return 'last seen recently'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'last seen just now'
    if (diffMinutes < 60) return `last seen ${diffMinutes} minutes ago`
    if (diffHours < 24) return `last seen ${diffHours} hours ago`
    if (diffDays < 7) return `last seen ${diffDays} days ago`
    return `last seen ${date.toLocaleDateString()}`
  }

  // Get message status icon
  const getMessageStatusIcon = (message: MessageWithStatus) => {
    if (!isOwnMessage(message)) return null

    switch (message.status) {
      case 'sending':
        return <Clock size={12} className="text-gray-400" />
      case 'sent':
        return <Check size={12} className="text-gray-400" />
      case 'delivered':
        return <CheckCheck size={12} className="text-gray-400" />
      case 'read':
        return <CheckCheck size={12} className="text-blue-500" />
      case 'failed':
        return <AlertCircle size={12} className="text-red-500" />
      default:
        return <Check size={12} className="text-gray-400" />
    }
  }

  // Group messages by date
  const groupMessagesByDate = (messages: MessageData[]) => {
    const groups: { [key: string]: MessageData[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {chatName.charAt(0).toUpperCase()}
            </span>
          </div>
          
          {/* Chat Info */}
          <div>
            <h3 className="font-semibold text-gray-900">{chatName}</h3>
            <p className="text-sm text-gray-500">
              {isOnline ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  online
                </span>
              ) : (
                formatLastSeen(lastSeen)
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Search size={16} />
          </Button>
          <Button size="sm" variant="outline">
            <Phone size={16} />
          </Button>
          <Button size="sm" variant="outline">
            <Video size={16} />
          </Button>
          <Button size="sm" variant="outline">
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50"
      >
        {Object.entries(messageGroups).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-6">
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(date).toLocaleDateString([], { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => {
              const isOwn = isOwnMessage(message)
              const showAvatar = isGroup && !isOwn && (
                index === 0 || 
                dayMessages[index - 1]?.from !== message.from
              )

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  {/* Avatar for group messages */}
                  {showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 mt-auto">
                      <span className="text-xs text-gray-600">
                        {message.author?.charAt(0).toUpperCase() || message.from.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                      isOwn
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    {/* Author name for group messages */}
                    {isGroup && !isOwn && showAvatar && (
                      <div className="text-xs font-medium text-blue-600 mb-1">
                        {message.author || message.from}
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="break-words">
                      {message.type === 'text' || !message.type ? (
                        <p className="text-sm leading-relaxed">{message.body}</p>
                      ) : message.type === 'image' ? (
                        <div className="space-y-2">
                          <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-2">
                            <Image size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-600">Image</span>
                          </div>
                          {message.body && (
                            <p className="text-sm leading-relaxed">{message.body}</p>
                          )}
                        </div>
                      ) : message.type === 'document' ? (
                        <div className="space-y-2">
                          <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-2">
                            <File size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-600">Document</span>
                          </div>
                          {message.body && (
                            <p className="text-sm leading-relaxed">{message.body}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.body}</p>
                      )}
                    </div>

                    {/* Message Footer */}
                    <div className={`flex items-center justify-end space-x-1 mt-2 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span className="text-xs">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {getMessageStatusIcon(message as MessageWithStatus)}
                    </div>
                  </div>

                  {/* Spacer for group messages */}
                  {!showAvatar && isGroup && !isOwn && (
                    <div className="w-8 mr-2"></div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute bottom-24 right-8">
          <Button
            size="sm"
            onClick={scrollToBottom}
            className="rounded-full shadow-lg"
          >
            <ArrowDown size={16} />
          </Button>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <File size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">{selectedFile.name}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedFile(null)}
            >
              Remove
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end space-x-3">
          {/* Attachment Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Paperclip size={16} />
          </Button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isSending}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={(!messageText.trim() && !selectedFile) || isSending}
            className="rounded-full"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  )
}
