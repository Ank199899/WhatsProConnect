'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  FileText, 
  Download, 
  Share2, 
  Trash2, 
  Eye, 
  Copy,
  Folder,
  FolderOpen,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Star,
  Clock,
  User,
  Tag,
  Link,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import { cn, formatFileSize, formatTime } from '@/lib/utils'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  mimeType?: string
  size?: number
  url?: string
  thumbnail?: string
  uploadedBy: string
  uploadedAt: number
  lastModified: number
  isStarred: boolean
  tags: string[]
  sharedWith: string[]
  downloads: number
  parentId?: string
}

interface FileManagerProps {
  className?: string
  onFileSelect?: (file: FileItem) => void
  allowMultiple?: boolean
  acceptedTypes?: string[]
}

const fileTypeIcons = {
  'image': Image,
  'video': Video,
  'audio': Music,
  'document': FileText,
  'pdf': FileText,
  'text': FileText,
  'folder': Folder,
  'default': File
}

const getFileTypeFromMime = (mimeType: string): keyof typeof fileTypeIcons => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.startsWith('text/')) return 'text'
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint')) return 'document'
  return 'default'
}

export default function FileManager({ 
  className, 
  onFileSelect, 
  allowMultiple = false,
  acceptedTypes = []
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'Marketing Materials',
      type: 'folder',
      uploadedBy: 'John Doe',
      uploadedAt: Date.now() - 86400000,
      lastModified: Date.now() - 3600000,
      isStarred: true,
      tags: ['marketing'],
      sharedWith: ['team@company.com'],
      downloads: 0
    },
    {
      id: '2',
      name: 'Product Catalog.pdf',
      type: 'file',
      mimeType: 'application/pdf',
      size: 2048576,
      url: '/files/product-catalog.pdf',
      thumbnail: '/thumbnails/catalog-thumb.jpg',
      uploadedBy: 'Jane Smith',
      uploadedAt: Date.now() - 172800000,
      lastModified: Date.now() - 172800000,
      isStarred: false,
      tags: ['product', 'catalog'],
      sharedWith: [],
      downloads: 23
    },
    {
      id: '3',
      name: 'Company Logo.png',
      type: 'file',
      mimeType: 'image/png',
      size: 512000,
      url: '/files/logo.png',
      thumbnail: '/thumbnails/logo-thumb.png',
      uploadedBy: 'Design Team',
      uploadedAt: Date.now() - 259200000,
      lastModified: Date.now() - 259200000,
      isStarred: true,
      tags: ['logo', 'branding'],
      sharedWith: ['marketing@company.com'],
      downloads: 45
    }
  ])

  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name')
  const [filterBy, setFilterBy] = useState<'all' | 'images' | 'documents' | 'videos' | 'starred'>('all')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showPreview, setShowPreview] = useState<FileItem | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const newFile: FileItem = {
        id: Date.now().toString() + i,
        name: file.name,
        type: 'file',
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedBy: 'Current User',
        uploadedAt: Date.now(),
        lastModified: Date.now(),
        isStarred: false,
        tags: [],
        sharedWith: [],
        downloads: 0,
        parentId: currentFolder || undefined
      }

      setFiles(prev => [...prev, newFile])
    }

    setIsUploading(false)
    setUploadProgress(0)
  }, [currentFolder])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const toggleFileSelection = (fileId: string) => {
    if (allowMultiple) {
      setSelectedFiles(prev => 
        prev.includes(fileId) 
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      )
    } else {
      setSelectedFiles([fileId])
      const file = files.find(f => f.id === fileId)
      if (file && onFileSelect) {
        onFileSelect(file)
      }
    }
  }

  const toggleStar = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, isStarred: !file.isStarred } : file
    ))
  }

  const deleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      setFiles(prev => prev.filter(file => file.id !== fileId))
      setSelectedFiles(prev => prev.filter(id => id !== fileId))
    }
  }

  const filteredFiles = files
    .filter(file => {
      if (currentFolder) {
        return file.parentId === currentFolder
      }
      return !file.parentId
    })
    .filter(file => {
      if (searchQuery) {
        return file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      }
      return true
    })
    .filter(file => {
      switch (filterBy) {
        case 'images':
          return file.mimeType?.startsWith('image/')
        case 'documents':
          return file.mimeType?.includes('pdf') || file.mimeType?.includes('document') || file.mimeType?.includes('text')
        case 'videos':
          return file.mimeType?.startsWith('video/')
        case 'starred':
          return file.isStarred
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.lastModified - a.lastModified
        case 'size':
          return (b.size || 0) - (a.size || 0)
        case 'type':
          return (a.mimeType || '').localeCompare(b.mimeType || '')
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const FileCard = ({ file }: { file: FileItem }) => {
    const FileIcon = fileTypeIcons[file.type === 'folder' ? 'folder' : getFileTypeFromMime(file.mimeType || '')]
    const isSelected = selectedFiles.includes(file.id)

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          'relative p-4 border rounded-lg cursor-pointer transition-all',
          isSelected 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          'bg-white dark:bg-gray-800'
        )}
        onClick={() => {
          if (file.type === 'folder') {
            setCurrentFolder(file.id)
          } else {
            toggleFileSelection(file.id)
          }
        }}
      >
        {/* Selection Checkbox */}
        {file.type === 'file' && (
          <div className="absolute top-2 left-2">
            <div className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center',
              isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-gray-300 dark:border-gray-600'
            )}>
              {isSelected && <Check size={12} className="text-white" />}
            </div>
          </div>
        )}

        {/* Star Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleStar(file.id)
          }}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <Star 
            size={14} 
            className={cn(
              file.isStarred 
                ? 'text-yellow-500 fill-current' 
                : 'text-gray-400'
            )} 
          />
        </button>

        {/* File Icon/Thumbnail */}
        <div className="flex justify-center mb-3">
          {file.thumbnail ? (
            <img 
              src={file.thumbnail} 
              alt={file.name}
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <FileIcon size={48} className="text-gray-400" />
          )}
        </div>

        {/* File Info */}
        <div className="text-center">
          <h3 className="font-medium text-gray-900 dark:text-white truncate mb-1">
            {file.name}
          </h3>
          
          {file.type === 'file' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size || 0)}
            </p>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTime(file.lastModified)}
          </p>
        </div>

        {/* Tags */}
        {file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {file.tags.slice(0, 2).map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
            {file.tags.length > 2 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                +{file.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            File Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload, organize, and share your files
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload size={16} />}
          >
            Upload Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFileUpload(e.target.files)
              }
            }}
            accept={acceptedTypes.join(',')}
          />
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Uploading files...
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Files</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
            <option value="videos">Videos</option>
            <option value="starred">Starred</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            icon={<Grid size={16} />}
          />
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            icon={<List size={16} />}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      {currentFolder && (
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setCurrentFolder(null)}
            className="text-blue-600 hover:text-blue-700"
          >
            Files
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 dark:text-gray-400">
            {files.find(f => f.id === currentFolder)?.name}
          </span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Drag and drop files here, or click to browse
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose Files
        </Button>
      </div>

      {/* Files Grid */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
          : 'space-y-2'
      )}>
        <AnimatePresence>
          {filteredFiles.map(file => (
            <FileCard key={file.id} file={file} />
          ))}
        </AnimatePresence>
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <File size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No files found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Upload your first file to get started'
            }
          </p>
        </div>
      )}

      {/* Selected Files Actions */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
          >
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </span>
              
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" icon={<Download size={14} />}>
                  Download
                </Button>
                <Button size="sm" variant="outline" icon={<Share2 size={14} />}>
                  Share
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700"
                  icon={<Trash2 size={14} />}
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFiles([])}
                  icon={<X size={14} />}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
