'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Play, FileText, Music, Eye, X } from 'lucide-react'

interface TestMessage {
  id: string
  content: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document'
  mediaUrl?: string
  fileName?: string
  fileSize?: number
  duration?: number
  isFromMe: boolean
}

const MediaTestComponent = () => {
  const [showPreview, setShowPreview] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<{url: string, type: string, name?: string} | null>(null)

  const testMessages: TestMessage[] = [
    {
      id: '1',
      content: 'Check out this image!',
      type: 'image',
      mediaUrl: '/test-media/sample-image.svg',
      fileName: 'sample-image.svg',
      isFromMe: true
    },
    {
      id: '2',
      content: 'Here is a document',
      type: 'document',
      mediaUrl: '/test-media/sample-doc.pdf',
      fileName: 'sample-document.pdf',
      fileSize: 1024000,
      isFromMe: false
    },
    {
      id: '3',
      content: 'Audio message',
      type: 'audio',
      mediaUrl: '/test-media/sample-audio.mp3',
      fileName: 'voice-note.mp3',
      duration: 45,
      isFromMe: true
    }
  ]

  const downloadMedia = async (mediaUrl: string, fileName?: string) => {
    try {
      console.log('📥 Downloading media:', mediaUrl, 'as:', fileName)

      let response: Response

      // Try to use our media download API first
      try {
        console.log('🔄 Trying media download API...')
        response = await fetch('/api/media/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: 'test-session',
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

      const blob = await response.blob()

      // Check if we got a valid response
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || `media_${Date.now()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ Media downloaded successfully as:', link.download)
    } catch (error) {
      console.error('❌ Error downloading media:', error)
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const openMediaPreview = (mediaUrl: string, mediaType: string, fileName?: string) => {
    setPreviewMedia({ url: mediaUrl, type: mediaType, name: fileName })
    setShowPreview(true)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Media Test Component</h2>
      
      <div className="space-y-4">
        {testMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md p-4 rounded-2xl ${
              message.isFromMe 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                : 'bg-white shadow-lg text-gray-800'
            }`}>
              
              {/* Media Content */}
              {message.type !== 'text' && message.mediaUrl && (
                <div className="mb-3">
                  {/* Image Preview */}
                  {message.type === 'image' && (
                    <motion.div
                      className="relative group cursor-pointer rounded-2xl overflow-hidden bg-gray-100 max-w-xs"
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
                    </motion.div>
                  )}

                  {/* Audio Preview */}
                  {message.type === 'audio' && (
                    <motion.div
                      className="flex items-center space-x-3 p-3 bg-gray-100 rounded-2xl max-w-xs"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.fileName || 'Audio Message'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}` : 'Audio'}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => downloadMedia(message.mediaUrl!, message.fileName)}
                        className="p-2 bg-white rounded-full shadow-sm"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Document Preview */}
                  {message.type === 'document' && (
                    <motion.div
                      className="flex items-center space-x-3 p-3 bg-gray-100 rounded-2xl max-w-xs cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => downloadMedia(message.mediaUrl!, message.fileName)}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.fileName || 'Document'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(message.fileSize)}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white rounded-full shadow-sm"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Text Content */}
              {message.content && (
                <p className="text-sm leading-relaxed">
                  {message.content}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Media Preview Modal */}
      {showPreview && previewMedia && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-4xl max-h-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {previewMedia.name || 'Media Preview'}
              </h3>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => downloadMedia(previewMedia.url, previewMedia.name)}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPreview(false)}
                  className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 max-h-[80vh] overflow-auto">
              {previewMedia.type === 'image' && (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.name || 'Image'}
                  className="w-full h-auto max-h-full object-contain rounded-lg"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default MediaTestComponent
