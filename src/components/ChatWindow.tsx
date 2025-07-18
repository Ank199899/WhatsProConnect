'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageData } from '@/lib/whatsapp-manager'
import { Paperclip, Image, Video, FileText, Download, Play, Pause, X } from 'lucide-react'

interface ChatWindowProps {
  messages: MessageData[]
  onSendMessage: (message: string, mediaFile?: File) => Promise<void>
  chatName: string
  isGroup: boolean
}

export default function ChatWindow({
  messages,
  onSendMessage,
  chatName,
  isGroup
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showMediaPreview, setShowMediaPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || isSending) return

    const messageText = newMessage.trim()
    const currentFile = selectedFile

    setIsSending(true)

    try {
      if (currentFile) {
        await onSendMessage(messageText || `📎 ${currentFile.name}`, currentFile)
        setSelectedFile(null)
        setShowMediaPreview(false)
        setPreviewUrl('')
      } else {
        await onSendMessage(messageText)
      }

      // Clear input only on successful send
      setNewMessage('')

    } catch (error) {
      console.error('❌ ChatWindow: Error sending message:', error)
      // Don't show alert here, let parent component handle it
      // The message was likely sent successfully despite the error
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setShowMediaPreview(true)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setShowMediaPreview(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image size={16} />
    if (file.type.startsWith('video/')) return <Video size={16} />
    return <FileText size={16} />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOwnMessage = (message: MessageData) => {
    return message.from === 'self' || message.from.includes('self')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {chatName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{chatName}</h3>
            {isGroup && (
              <p className="text-sm text-gray-600">Group Chat</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message)
            const showAuthor = isGroup && !isOwn && (
              index === 0 || 
              messages[index - 1].author !== message.author
            )

            return (
              <div
                key={`${message.id}-${index}`}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {showAuthor && (
                    <div className="text-xs font-semibold mb-1 text-blue-600">
                      {message.author?.split('@')[0] || 'Unknown'}
                    </div>
                  )}
                  
                  {/* Media Content */}
                  {message.type === 'image' && message.mediaUrl && (
                    <div className="mb-2">
                      <img
                        src={message.mediaUrl}
                        alt="Shared image"
                        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(message.mediaUrl, '_blank')}
                      />
                    </div>
                  )}

                  {message.type === 'video' && message.mediaUrl && (
                    <div className="mb-2">
                      <video
                        src={message.mediaUrl}
                        controls
                        className="max-w-full h-auto rounded-lg"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}

                  {message.type === 'audio' && message.mediaUrl && (
                    <div className="mb-2">
                      <audio
                        src={message.mediaUrl}
                        controls
                        className="w-full"
                      />
                    </div>
                  )}

                  {message.type === 'document' && message.mediaUrl && (
                    <div className="mb-2 p-3 bg-gray-100 rounded-lg flex items-center space-x-2">
                      <FileText size={20} className="text-gray-600" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{message.filename || 'Document'}</div>
                        <div className="text-xs text-gray-500">{message.fileSize || 'Unknown size'}</div>
                      </div>
                      <button
                        onClick={() => window.open(message.mediaUrl, '_blank')}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  )}

                  <div className="break-words">
                    {message.body}
                  </div>
                  
                  <div
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {showMediaPreview && selectedFile && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Media Preview</h4>
            <button
              onClick={handleRemoveFile}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            {selectedFile.type.startsWith('image/') && (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto rounded max-h-48"
              />
            )}

            {selectedFile.type.startsWith('video/') && (
              <video
                src={previewUrl}
                controls
                className="max-w-full h-auto rounded max-h-48"
              />
            )}

            {!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/') && (
              <div className="flex items-center space-x-3 p-3">
                {getFileIcon(selectedFile)}
                <div>
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-3">
          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
            }}
          />

          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || isSending}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {selectedFile && (
            <span className="text-green-600">📎 {selectedFile.name}</span>
          )}
        </div>
      </div>
    </div>
  )
}
