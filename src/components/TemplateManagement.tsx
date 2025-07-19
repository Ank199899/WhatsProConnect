'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Image,
  Video,
  File,
  Download,
  Upload,
  Star,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'
import Button from './ui/Button'

interface Template {
  id: string
  name: string
  category: string
  type: 'text' | 'image' | 'video' | 'document' | 'interactive'
  content: string
  variables: string[]
  language: string
  status: 'active' | 'pending' | 'rejected' | 'draft'
  createdAt: string
  updatedAt: string
  createdBy: string
  usageCount: number
  rating: number
  tags: string[]
  preview?: string
  // Media fields
  mediaUrl?: string
  mediaType?: 'image' | 'video' | 'document' | 'audio'
  mediaCaption?: string
  mediaFilename?: string
  mediaSize?: number
}

const templateCategories = [
  'Marketing',
  'Transactional',
  'Authentication',
  'Utility',
  'Customer Support',
  'Promotional',
  'Notification',
  'Welcome',
  'Reminder',
  'Survey'
]

const templateTypes = [
  { id: 'text', label: 'Text', icon: MessageSquare },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'document', label: 'Document', icon: File },
  { id: 'interactive', label: 'Interactive', icon: BarChart3 }
]

function TemplateManagementComponent() {
  // Simple state management without real-time context dependency
  const [isConnected] = useState(false) // Fallback connection status
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(false)

  // Local state for templates management
  const [localTemplates, setLocalTemplates] = useState<Template[]>([])

  // Use local templates as the main source
  const displayTemplates = localTemplates

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: 'text' as Template['type'],
    content: '',
    variables: [] as string[],
    language: 'en',
    tags: [] as string[],
    // Media fields
    mediaUrl: '',
    mediaType: undefined as Template['mediaType'],
    mediaCaption: '',
    mediaFilename: '',
    mediaSize: 0
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await loadTemplates()
        // Add sample templates if none exist
        await initializeSampleTemplates()
      } catch (error) {
        console.error('Error initializing TemplateManagement:', error)
        setHasError(true)
        setErrorMessage('Failed to load templates. Please refresh the page.')
      }
    }

    initializeComponent()
  }, [])

  // Initialize sample templates if none exist
  const initializeSampleTemplates = async () => {
    try {
      const { LocalStorage } = await import('@/lib/local-storage')
      const existingTemplates = LocalStorage.getTemplates()

      if (existingTemplates.length === 0) {
        const sampleTemplates: Template[] = [
          {
            id: 'template_welcome',
            name: 'Welcome Message',
            category: 'Onboarding',
            type: 'text',
            content: 'Hi {{name}}! 👋 Welcome to {{company}}. We\'re excited to have you on board!',
            variables: ['name', 'company'],
            language: 'en',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            usageCount: 0,
            rating: 5,
            tags: ['welcome', 'onboarding']
          },
          {
            id: 'template_promotion',
            name: 'Special Offer',
            category: 'Marketing',
            type: 'text',
            content: '🎉 Special offer for {{name}}! Get {{discount}}% off on your next purchase. Use code: {{code}}. Valid till {{expiry}}.',
            variables: ['name', 'discount', 'code', 'expiry'],
            language: 'en',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            usageCount: 0,
            rating: 4,
            tags: ['promotion', 'discount', 'marketing']
          },
          {
            id: 'template_reminder',
            name: 'Appointment Reminder',
            category: 'Notifications',
            type: 'text',
            content: '📅 Reminder: You have an appointment scheduled for {{date}} at {{time}}. Location: {{location}}. Please confirm your attendance.',
            variables: ['date', 'time', 'location'],
            language: 'en',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            usageCount: 0,
            rating: 4,
            tags: ['reminder', 'appointment']
          }
        ]

        LocalStorage.saveTemplates(sampleTemplates)
        setLocalTemplates(sampleTemplates)
        console.log('✅ Sample templates initialized')
      }
    } catch (error) {
      console.error('Error initializing sample templates:', error)
    }
  }

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // Load from localStorage
      const { LocalStorage } = await import('@/lib/local-storage')
      const loadedTemplates = LocalStorage.getTemplates()

      console.log('📝 Loaded templates from localStorage:', loadedTemplates)

      // Update local state
      setLocalTemplates(loadedTemplates)

    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = displayTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesType = selectedType === 'all' || template.type === selectedType
    const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus
  })

  const handleCreateTemplate = async () => {
    try {
      setLoading(true)

      // Validate required fields
      if (!formData.name.trim()) {
        alert('Please enter a template name')
        return
      }

      if (!formData.category.trim()) {
        alert('Please enter a category')
        return
      }

      if (!formData.content.trim()) {
        alert('Please enter template content')
        return
      }

      console.log('Creating template with data:', formData)

      // Create template object
      const newTemplate: Template = {
        id: `template_${Date.now()}`,
        name: formData.name.trim(),
        category: formData.category.trim(),
        type: formData.type,
        content: formData.content.trim(),
        variables: extractVariables(formData.content),
        language: formData.language,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current_user',
        usageCount: 0,
        rating: 0,
        tags: formData.tags
      }

      console.log('New template object:', newTemplate)

      // Save to localStorage
      const { LocalStorage } = await import('@/lib/local-storage')
      LocalStorage.createTemplate(newTemplate)

      // Update local state
      const updatedTemplates = [...displayTemplates, newTemplate]
      setLocalTemplates(updatedTemplates)

      setShowCreateModal(false)
      resetForm()

      // Show success message
      console.log('✅ Template created successfully:', newTemplate.name)
      alert(`Template "${newTemplate.name}" created successfully!`)

    } catch (error) {
      console.error('Error creating template:', error)
      alert('Error creating template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Extract variables from template content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g)
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : []
  }

  // Export templates to JSON file
  const handleExportTemplates = async () => {
    try {
      const { LocalStorage } = await import('@/lib/local-storage')
      const templates = LocalStorage.getTemplates()

      const dataStr = JSON.stringify(templates, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `whatsapp-templates-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('✅ Templates exported successfully')
    } catch (error) {
      console.error('Error exporting templates:', error)
    }
  }

  // Import templates from JSON file
  const handleImportTemplates = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const importedTemplates = JSON.parse(text)

        if (!Array.isArray(importedTemplates)) {
          alert('Invalid file format. Please select a valid templates JSON file.')
          return
        }

        const { LocalStorage } = await import('@/lib/local-storage')
        const existingTemplates = LocalStorage.getTemplates()

        // Add imported templates with new IDs to avoid conflicts
        const newTemplates = importedTemplates.map(template => ({
          ...template,
          id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))

        const allTemplates = [...existingTemplates, ...newTemplates]
        LocalStorage.saveTemplates(allTemplates)
        setLocalTemplates(allTemplates)

        console.log(`✅ Imported ${newTemplates.length} templates successfully`)
        alert(`Successfully imported ${newTemplates.length} templates!`)

      } catch (error) {
        console.error('Error importing templates:', error)
        alert('Error importing templates. Please check the file format.')
      }
    }
    input.click()
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setLoading(true)

      // Create updated template object
      const updatedTemplate = {
        ...selectedTemplate,
        ...formData,
        variables: extractVariables(formData.content),
        updatedAt: new Date().toISOString()
      }

      // Try API first
      try {
        const response = await fetch(`/api/templates/${selectedTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTemplate)
        })

        const data = await response.json()
        if (data.success) {
          console.log('✅ Template updated via API successfully')
        }
      } catch (apiError) {
        console.warn('⚠️ API update failed, using localStorage:', apiError)
      }

      // Always update localStorage as backup
      const { LocalStorage } = await import('@/lib/local-storage')
      LocalStorage.updateTemplate(selectedTemplate.id, updatedTemplate)

      // Update local state immediately
      setLocalTemplates(prev =>
        prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t)
      )

      setShowEditModal(false)
      setSelectedTemplate(null)
      resetForm()

      console.log('✅ Template updated successfully')
      alert('Template updated successfully!')

    } catch (error) {
      console.error('Error updating template:', error)
      alert('Error updating template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      setLoading(true)

      // Try API first
      try {
        const response = await fetch(`/api/templates/${templateId}`, {
          method: 'DELETE'
        })

        const data = await response.json()
        if (data.success) {
          console.log('✅ Template deleted from API successfully')
        }
      } catch (apiError) {
        console.warn('⚠️ API delete failed, using localStorage:', apiError)
      }

      // Always update localStorage as backup
      const { LocalStorage } = await import('@/lib/local-storage')
      LocalStorage.deleteTemplate(templateId)

      // Update local state immediately
      setLocalTemplates(prev => prev.filter(t => t.id !== templateId))

      console.log('✅ Template deleted successfully')
      alert('Template deleted successfully!')

    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      setLoading(true)

      const duplicatedTemplate: Template = {
        ...template,
        id: `template_${Date.now()}`,
        name: `${template.name} (Copy)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      }

      // Save to localStorage
      const { LocalStorage } = await import('@/lib/local-storage')
      LocalStorage.createTemplate(duplicatedTemplate)

      // Get updated templates
      const updatedTemplates = LocalStorage.getTemplates()

      // Update local state
      setLocalTemplates(updatedTemplates)

      console.log('✅ Template duplicated successfully:', duplicatedTemplate.name)

    } catch (error) {
      console.error('Error duplicating template:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      type: 'text',
      content: '',
      variables: [],
      language: 'en',
      tags: [],
      mediaUrl: '',
      mediaType: undefined,
      mediaCaption: '',
      mediaFilename: '',
      mediaSize: 0
    })
    setSelectedFile(null)
  }

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      category: template.category,
      type: template.type,
      content: template.content,
      variables: template.variables,
      language: template.language,
      tags: template.tags,
      mediaUrl: template.mediaUrl || '',
      mediaType: template.mediaType,
      mediaCaption: template.mediaCaption || '',
      mediaFilename: template.mediaFilename || '',
      mediaSize: template.mediaSize || 0
    })
    setShowEditModal(true)
  }

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 16MB for WhatsApp)
    const maxSize = 16 * 1024 * 1024 // 16MB
    if (file.size > maxSize) {
      alert('File size must be less than 16MB')
      return
    }

    // Determine media type based on file type
    let mediaType: Template['mediaType']
    if (file.type.startsWith('image/')) {
      mediaType = 'image'
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video'
    } else if (file.type.startsWith('audio/')) {
      mediaType = 'audio'
    } else {
      mediaType = 'document'
    }

    // Create object URL for preview
    const mediaUrl = URL.createObjectURL(file)

    setSelectedFile(file)
    setFormData(prev => ({
      ...prev,
      mediaUrl,
      mediaType,
      mediaFilename: file.name,
      mediaSize: file.size,
      type: mediaType === 'audio' ? 'document' : mediaType
    }))
  }

  // Remove media file
  const removeMediaFile = () => {
    if (formData.mediaUrl && formData.mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formData.mediaUrl)
    }
    setSelectedFile(null)
    setFormData(prev => ({
      ...prev,
      mediaUrl: '',
      mediaType: undefined,
      mediaCaption: '',
      mediaFilename: '',
      mediaSize: 0,
      type: 'text'
    }))
  }

  const getStatusColor = (status: Template['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: Template['type']) => {
    const typeConfig = templateTypes.find(t => t.id === type)
    return typeConfig ? typeConfig.icon : MessageSquare
  }

  // Error boundary
  if (hasError) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Template Management Error</h2>
            <p className="text-sm mt-2">{errorMessage}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-600" />
            Template Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage message templates for your campaigns
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            icon={<Upload size={16} />}
            onClick={handleImportTemplates}
          >
            Import
          </Button>
          <Button
            variant="outline"
            icon={<Download size={16} />}
            onClick={handleExportTemplates}
          >
            Export
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{displayTemplates.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Templates</p>
              <p className="text-2xl font-bold text-green-600">
                {displayTemplates.filter(t => t.status === 'active').length}
              </p>
            </div>
            <Star className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">
                {displayTemplates.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold text-purple-600">
                {displayTemplates.reduce((sum, t) => sum + t.usageCount, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {templateCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {templateTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTemplates.map((template) => {
            const TypeIcon = getTypeIcon(template.type)
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500">{template.category}</p>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                      {template.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {template.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Used {template.usageCount} times</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{template.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setShowPreviewModal(true)
                        }}
                        icon={<Eye size={14} />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(template)}
                        icon={<Edit3 size={14} />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template)}
                        icon={<Copy size={14} />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        icon={<Trash2 size={14} />}
                        className="text-red-600 hover:text-red-700"
                      />
                    </div>
                    
                    <span className="text-xs text-gray-400">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Create your first template to get started'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && selectedType === 'all' && selectedStatus === 'all' && (
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={16} />}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Template
            </Button>
          )}
        </div>
      )}

      {/* Create Template Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Template</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleCreateTemplate(); }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter template name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Marketing, Support"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Template['type'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        <option value="interactive">Interactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      placeholder="Enter your template content here..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {'{'}{'{'} variable {'}'}{'}'}  for dynamic content (e.g., {'{'}{'{'} name {'}'}{'}'},  {'{'}{'{'} company {'}'}{'}'})
                    </p>
                  </div>

                  {/* Media Upload Section */}
                  {(formData.type === 'image' || formData.type === 'video' || formData.type === 'document') && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        {formData.mediaUrl ? (
                          <div className="space-y-4">
                            {/* Media Preview */}
                            <div className="flex items-center justify-center">
                              {formData.mediaType === 'image' && (
                                <img
                                  src={formData.mediaUrl}
                                  alt="Preview"
                                  className="max-w-xs max-h-48 rounded-lg shadow-md"
                                />
                              )}
                              {formData.mediaType === 'video' && (
                                <video
                                  src={formData.mediaUrl}
                                  controls
                                  className="max-w-xs max-h-48 rounded-lg shadow-md"
                                />
                              )}
                              {(formData.mediaType === 'document' || formData.mediaType === 'audio') && (
                                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                                  <File className="w-8 h-8 text-gray-600" />
                                  <div>
                                    <p className="font-medium text-gray-900">{formData.mediaFilename}</p>
                                    <p className="text-sm text-gray-500">
                                      {(formData.mediaSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Media Caption */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Media Caption
                              </label>
                              <input
                                type="text"
                                value={formData.mediaCaption}
                                onChange={(e) => setFormData({ ...formData, mediaCaption: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Optional caption for the media..."
                              />
                            </div>

                            {/* Remove Media Button */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={removeMediaFile}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Remove Media
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <div className="text-sm text-gray-600 mb-4">
                              <label htmlFor="media-upload" className="cursor-pointer">
                                <span className="font-medium text-blue-600 hover:text-blue-500">
                                  Click to upload
                                </span>
                                {' '}or drag and drop
                              </label>
                              <input
                                id="media-upload"
                                type="file"
                                className="hidden"
                                accept={
                                  formData.type === 'image' ? 'image/*' :
                                  formData.type === 'video' ? 'video/*' :
                                  formData.type === 'document' ? '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx' :
                                  '*/*'
                                }
                                onChange={handleFileUpload}
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              {formData.type === 'image' && 'PNG, JPG, GIF up to 16MB'}
                              {formData.type === 'video' && 'MP4, AVI, MOV up to 16MB'}
                              {formData.type === 'document' && 'PDF, DOC, XLS, PPT up to 16MB'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="marketing, promotion, welcome"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? 'Creating...' : 'Create Template'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status */}
      <div className="fixed bottom-4 right-4">
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
          isConnected
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Real-time Connected' : '🔴 Connection Lost'}
        </div>
      </div>
    </div>
  )
}

// Error boundary wrapper
export default function TemplateManagement() {
  try {
    return <TemplateManagementComponent />
  } catch (error) {
    console.error('TemplateManagement Error:', error)
    return (
      <div className="p-6 space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Template Management Error</h2>
            <p className="text-sm mt-2">Something went wrong. Please refresh the page.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}
