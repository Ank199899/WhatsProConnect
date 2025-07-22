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

  // Bulk selection state
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)

  // Local state for templates management
  const [localTemplates, setLocalTemplates] = useState<Template[]>([])

  // Use local templates as the main source
  const displayTemplates = localTemplates

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: 'image' as Template['type'], // Changed from 'text' to 'image' to show media upload by default
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
      console.log('📝 Loading templates from API...')

      const response = await fetch('/api/templates')
      const result = await response.json()

      if (result.success) {
        console.log('📝 Loaded templates from API:', result.templates)
        setLocalTemplates(result.templates || [])
      } else {
        console.error('Failed to load templates:', result.error)
        setLocalTemplates([])
      }

    } catch (error) {
      console.error('Error loading templates:', error)
      setLocalTemplates([])
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

      // Create template object with media support
      const templateData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        type: formData.type,
        content: formData.content.trim(),
        variables: extractVariables(formData.content),
        language: formData.language,
        status: 'active',
        tags: formData.tags,
        mediaUrl: formData.mediaUrl || null,
        mediaType: formData.mediaType || null,
        mediaCaption: formData.mediaCaption || null
      }

      console.log('Creating template via API:', templateData)

      // Save via API
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create template')
      }

      console.log('✅ Template created successfully:', result.template)

      // Refresh templates list
      await loadTemplates()

      setShowCreateModal(false)
      resetForm()

      alert('Template created successfully!')

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
      console.log('📤 Exporting templates...')

      const response = await fetch('/api/templates')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch templates')
      }

      const templates = result.templates || []
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
      alert(`Successfully exported ${templates.length} templates!`)
    } catch (error) {
      console.error('Error exporting templates:', error)
      alert('Error exporting templates. Please try again.')
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
        setLoading(true)
        console.log('📥 Importing templates...')

        const text = await file.text()
        const importedTemplates = JSON.parse(text)

        if (!Array.isArray(importedTemplates)) {
          alert('Invalid file format. Please select a valid templates JSON file.')
          return
        }

        let successCount = 0
        let errorCount = 0

        // Import each template via API
        for (const template of importedTemplates) {
          try {
            const templateData = {
              name: template.name || 'Imported Template',
              category: template.category || 'Imported',
              type: template.type || 'text',
              content: template.content || '',
              variables: template.variables || [],
              language: template.language || 'en',
              status: 'draft',
              tags: template.tags || [],
              mediaUrl: template.mediaUrl || null,
              mediaType: template.mediaType || null,
              mediaCaption: template.mediaCaption || null
            }

            const response = await fetch('/api/templates', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(templateData)
            })

            const result = await response.json()

            if (result.success) {
              successCount++
            } else {
              errorCount++
              console.warn('Failed to import template:', template.name, result.error)
            }
          } catch (error) {
            errorCount++
            console.error('Error importing template:', template.name, error)
          }
        }

        // Refresh templates list
        await loadTemplates()

        console.log(`✅ Import completed: ${successCount} success, ${errorCount} errors`)

        if (successCount > 0) {
          alert(`Successfully imported ${successCount} templates!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)
        } else {
          alert('No templates were imported. Please check the file format.')
        }

      } catch (error) {
        console.error('Error importing templates:', error)
        alert('Error importing templates. Please check the file format.')
      } finally {
        setLoading(false)
      }
    }
    input.click()
  }

  // Bulk Actions
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelectedTemplates([])
  }

  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  const selectAllTemplates = () => {
    if (selectedTemplates.length === filteredTemplates.length) {
      setSelectedTemplates([])
    } else {
      setSelectedTemplates(filteredTemplates.map(t => t.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTemplates.length === 0) return

    const confirmed = confirm(`Are you sure you want to delete ${selectedTemplates.length} templates?`)
    if (!confirmed) return

    try {
      setLoading(true)
      let successCount = 0
      let errorCount = 0

      for (const templateId of selectedTemplates) {
        try {
          const response = await fetch(`/api/templates?id=${templateId}`, {
            method: 'DELETE'
          })

          const result = await response.json()

          if (result.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
          console.error('Error deleting template:', templateId, error)
        }
      }

      // Refresh templates list
      await loadTemplates()

      setSelectedTemplates([])
      setBulkMode(false)

      alert(`Deleted ${successCount} templates successfully!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)

    } catch (error) {
      console.error('Error in bulk delete:', error)
      alert('Error deleting templates. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkExport = async () => {
    if (selectedTemplates.length === 0) return

    try {
      const selectedTemplateData = displayTemplates.filter(t => selectedTemplates.includes(t.id))

      const dataStr = JSON.stringify(selectedTemplateData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `selected-templates-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert(`Exported ${selectedTemplates.length} templates successfully!`)
    } catch (error) {
      console.error('Error exporting selected templates:', error)
      alert('Error exporting templates. Please try again.')
    }
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setLoading(true)

      // Create updated template data
      const updateData = {
        id: selectedTemplate.id,
        name: formData.name.trim(),
        category: formData.category.trim(),
        type: formData.type,
        content: formData.content.trim(),
        variables: extractVariables(formData.content),
        language: formData.language,
        status: selectedTemplate.status,
        tags: formData.tags,
        mediaUrl: formData.mediaUrl || null,
        mediaType: formData.mediaType || null,
        mediaCaption: formData.mediaCaption || null
      }

      console.log('Updating template via API:', updateData)

      // Update via API
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update template')
      }

      console.log('✅ Template updated successfully:', result.template)

      // Refresh templates list
      await loadTemplates()

      setShowEditModal(false)
      setSelectedTemplate(null)
      resetForm()

      alert('Template updated successfully!')

    } catch (error) {
      console.error('Error updating template:', error)
      alert('Error updating template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Quick status update
  const handleStatusUpdate = async (templateId: string, newStatus: Template['status']) => {
    try {
      const template = displayTemplates.find(t => t.id === templateId)
      if (!template) return

      const updateData = {
        id: templateId,
        name: template.name,
        category: template.category,
        type: template.type,
        content: template.content,
        variables: template.variables,
        language: template.language,
        status: newStatus,
        tags: template.tags,
        mediaUrl: template.mediaUrl,
        mediaType: template.mediaType,
        mediaCaption: template.mediaCaption
      }

      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        await loadTemplates()
        console.log(`✅ Template status updated to ${newStatus}`)
      } else {
        throw new Error(result.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating template status:', error)
      alert('Error updating template status. Please try again.')
    }
  }

  // Alias for edit modal
  const handleUpdateTemplate = handleEditTemplate

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      setLoading(true)

      console.log('🗑️ Deleting template:', templateId)

      // Delete via API
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete template')
      }

      console.log('✅ Template deleted successfully')

      // Refresh templates list
      await loadTemplates()

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

      const duplicateData = {
        name: `${template.name} (Copy)`,
        category: template.category,
        type: template.type,
        content: template.content,
        variables: template.variables,
        language: template.language,
        status: 'draft',
        tags: template.tags,
        mediaUrl: template.mediaUrl || null,
        mediaType: template.mediaType || null,
        mediaCaption: template.mediaCaption || null
      }

      console.log('Duplicating template via API:', duplicateData)

      // Create via API
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to duplicate template')
      }

      console.log('✅ Template duplicated successfully:', result.template)

      // Refresh templates list
      await loadTemplates()

      alert('Template duplicated successfully!')

    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Error duplicating template. Please try again.')
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
    console.log('🔄 File upload triggered', event)
    const file = event.target.files?.[0]
    console.log('📁 Selected file:', file)

    if (!file) {
      console.log('❌ No file selected')
      return
    }

    console.log('📊 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    })

    // Validate file size (max 16MB for WhatsApp)
    const maxSize = 16 * 1024 * 1024 // 16MB
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size, 'bytes')
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

    console.log('🎯 Determined media type:', mediaType)

    // Create object URL for preview
    const mediaUrl = URL.createObjectURL(file)
    console.log('🔗 Created media URL:', mediaUrl)

    setSelectedFile(file)
    setFormData(prev => {
      const newFormData = {
        ...prev,
        mediaUrl,
        mediaType,
        mediaFilename: file.name,
        mediaSize: file.size,
        type: mediaType === 'audio' ? 'document' : mediaType
      }
      console.log('✅ Updated form data:', newFormData)
      return newFormData
    })
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
          {!bulkMode ? (
            <>
              <Button
                variant="outline"
                icon={<Upload size={16} />}
                onClick={handleImportTemplates}
                disabled={loading}
              >
                Import
              </Button>
              <Button
                variant="outline"
                icon={<Download size={16} />}
                onClick={handleExportTemplates}
                disabled={loading}
              >
                Export
              </Button>
              <Button
                variant="outline"
                onClick={toggleBulkMode}
                disabled={displayTemplates.length === 0}
              >
                Select Multiple
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={16} />}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                Create Template
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600 flex items-center">
                {selectedTemplates.length} selected
              </span>
              <Button
                variant="outline"
                onClick={handleBulkExport}
                disabled={selectedTemplates.length === 0 || loading}
                icon={<Download size={16} />}
              >
                Export Selected
              </Button>
              <Button
                variant="outline"
                onClick={handleBulkDelete}
                disabled={selectedTemplates.length === 0 || loading}
                className="text-red-600 border-red-300 hover:bg-red-50"
                icon={<Trash2 size={16} />}
              >
                Delete Selected
              </Button>
              <Button
                variant="outline"
                onClick={toggleBulkMode}
              >
                Cancel
              </Button>
            </>
          )}
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
        {bulkMode && filteredTemplates.length > 0 && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedTemplates.length === filteredTemplates.length && filteredTemplates.length > 0}
                onChange={selectAllTemplates}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Select All ({filteredTemplates.length})
              </label>
            </div>
            <div className="text-sm text-gray-600">
              {selectedTemplates.length} of {filteredTemplates.length} selected
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, content, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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

        {/* Filter Actions */}
        {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {filteredTemplates.length} of {displayTemplates.length} templates
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setSelectedType('all')
                setSelectedStatus('all')
              }}
              className="text-gray-600"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading templates...</span>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && (
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
                      {bulkMode && (
                        <input
                          type="checkbox"
                          checked={selectedTemplates.includes(template.id)}
                          onChange={() => toggleTemplateSelection(template.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      )}
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500">{template.category}</p>
                      </div>
                    </div>

                    {!bulkMode ? (
                      <select
                        value={template.status}
                        onChange={(e) => handleStatusUpdate(template.id, e.target.value as Template['status'])}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(template.status)}`}
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="draft">Draft</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                        {template.status}
                      </span>
                    )}
                  </div>
                  
                  {/* Media Preview */}
                  {template.mediaUrl && (
                    <div className="mb-3">
                      {template.mediaType === 'image' && (
                        <img
                          src={template.mediaUrl}
                          alt="Template media"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      {template.mediaType === 'video' && (
                        <video
                          src={template.mediaUrl}
                          className="w-full h-32 object-cover rounded-lg"
                          controls={false}
                        />
                      )}
                      {(template.mediaType === 'document' || template.mediaType === 'audio') && (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <File className="w-6 h-6 text-gray-600" />
                          <span className="text-sm text-gray-700 truncate">
                            {template.mediaCaption || 'Document attached'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

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
                    {!bulkMode && (
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
                    )}

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
      )}

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
                        onChange={(e) => {
                          const newType = e.target.value as Template['type']
                          // Clear media data when switching to text type
                          if (newType === 'text') {
                            if (formData.mediaUrl && formData.mediaUrl.startsWith('blob:')) {
                              URL.revokeObjectURL(formData.mediaUrl)
                            }
                            setSelectedFile(null)
                            setFormData({
                              ...formData,
                              type: newType,
                              mediaUrl: '',
                              mediaType: undefined,
                              mediaCaption: '',
                              mediaFilename: '',
                              mediaSize: 0
                            })
                          } else {
                            setFormData({ ...formData, type: newType })
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="text">📝 Text Only</option>
                        <option value="image">🖼️ Image + Text</option>
                        <option value="video">🎥 Video + Text</option>
                        <option value="document">📄 Document + Text</option>
                        <option value="interactive">⚡ Interactive</option>
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
                    <div className="relative">
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={6}
                        placeholder="Enter your template content here..."
                        required
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {formData.content.length}/1024
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 mt-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">
                          Use {'{'}{'{'} variable {'}'}{'}'}  for dynamic content (e.g., {'{'}{'{'} name {'}'}{'}'},  {'{'}{'{'} company {'}'}{'}'})
                        </p>
                        {extractVariables(formData.content).length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Detected Variables:</p>
                            <div className="flex flex-wrap gap-1">
                              {extractVariables(formData.content).map((variable, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                >
                                  {variable}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Media Upload Section */}
                  {(formData.type === 'image' || formData.type === 'video' || formData.type === 'document') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-blue-800 mb-3">
                        📎 Media Attachment ({formData.type})
                      </label>
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 hover:border-blue-400 transition-colors bg-white">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                          <div className="text-sm text-gray-600 mb-4">
                            <label htmlFor="media-upload" className="cursor-pointer">
                              <span className="font-medium text-blue-600 hover:text-blue-500 text-lg">
                                Click to upload {formData.type}
                              </span>
                              <p className="text-gray-500 mt-2">or drag and drop your file here</p>
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
                          <p className="text-xs text-blue-600 font-medium">
                            {formData.type === 'image' && '🖼️ Supported: PNG, JPG, GIF • Max size: 16MB'}
                            {formData.type === 'video' && '🎥 Supported: MP4, AVI, MOV • Max size: 16MB'}
                            {formData.type === 'document' && '📄 Supported: PDF, DOC, XLS, PPT • Max size: 16MB'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Media Preview Section */}
                  {formData.mediaUrl && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-green-800 mb-3">
                        ✅ Media Preview
                      </label>
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              {formData.mediaFilename}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(formData.mediaSize / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={removeMediaFile}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Media Preview */}
                        <div className="flex justify-center">
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
                                  {formData.mediaType} • {(formData.mediaSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
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

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPreviewModal(false)}
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
                  <h2 className="text-2xl font-bold text-gray-900">Template Preview</h2>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Template Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Name</p>
                        <p className="text-gray-900">{selectedTemplate.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Category</p>
                        <p className="text-gray-900">{selectedTemplate.category}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Type</p>
                        <p className="text-gray-900 capitalize">{selectedTemplate.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTemplate.status)}`}>
                          {selectedTemplate.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Media Preview */}
                  {selectedTemplate.mediaUrl && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Media</h3>
                      <div className="border rounded-lg p-4">
                        {selectedTemplate.mediaType === 'image' && (
                          <img
                            src={selectedTemplate.mediaUrl}
                            alt="Template media"
                            className="w-full max-h-64 object-contain rounded-lg"
                          />
                        )}
                        {selectedTemplate.mediaType === 'video' && (
                          <video
                            src={selectedTemplate.mediaUrl}
                            controls
                            className="w-full max-h-64 rounded-lg"
                          />
                        )}
                        {(selectedTemplate.mediaType === 'document' || selectedTemplate.mediaType === 'audio') && (
                          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                            <File className="w-8 h-8 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {selectedTemplate.mediaCaption || 'Document'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {selectedTemplate.mediaType} file
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedTemplate.mediaCaption && (
                          <p className="text-sm text-gray-600 mt-2">{selectedTemplate.mediaCaption}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Content</h3>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedTemplate.content}</p>
                    </div>
                  </div>

                  {/* Variables */}
                  {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Variables</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map((variable, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <Button
                      onClick={() => {
                        setShowPreviewModal(false)
                        openEditModal(selectedTemplate)
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                      icon={<Edit3 size={16} />}
                    >
                      Edit Template
                    </Button>
                    <Button
                      onClick={() => {
                        handleDuplicateTemplate(selectedTemplate)
                        setShowPreviewModal(false)
                      }}
                      variant="outline"
                      icon={<Copy size={16} />}
                    >
                      Duplicate
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Template</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleUpdateTemplate(); }} className="space-y-6">
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
                        onChange={(e) => {
                          const newType = e.target.value as Template['type']
                          // Clear media data when switching to text type
                          if (newType === 'text') {
                            if (formData.mediaUrl && formData.mediaUrl.startsWith('blob:')) {
                              URL.revokeObjectURL(formData.mediaUrl)
                            }
                            setSelectedFile(null)
                            setFormData({
                              ...formData,
                              type: newType,
                              mediaUrl: '',
                              mediaType: undefined,
                              mediaCaption: '',
                              mediaFilename: '',
                              mediaSize: 0
                            })
                          } else {
                            setFormData({ ...formData, type: newType })
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="text">📝 Text Only</option>
                        <option value="image">🖼️ Image + Text</option>
                        <option value="video">🎥 Video + Text</option>
                        <option value="document">📄 Document + Text</option>
                        <option value="interactive">⚡ Interactive</option>
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
                    <div className="relative">
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={6}
                        placeholder="Enter your template content here..."
                        required
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {formData.content.length}/1024
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 mt-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">
                          Use {'{'}{'{'} variable {'}'}{'}'}  for dynamic content (e.g., {'{'}{'{'} name {'}'}{'}'},  {'{'}{'{'} company {'}'}{'}'})
                        </p>
                        {extractVariables(formData.content).length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Detected Variables:</p>
                            <div className="flex flex-wrap gap-1">
                              {extractVariables(formData.content).map((variable, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                >
                                  {variable}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Media Upload Section for Edit */}
                  {(formData.type === 'image' || formData.type === 'video' || formData.type === 'document') && (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors"
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.add('border-blue-400', 'bg-blue-50')
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                        const files = e.dataTransfer.files
                        if (files.length > 0) {
                          const file = files[0]
                          const fakeEvent = {
                            target: { files: [file] }
                          } as any
                          handleFileUpload(fakeEvent)
                        }
                      }}
                    >
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
                          <div className="py-8">
                            <div className="flex justify-center mb-4">
                              {formData.type === 'image' && <Image className="h-16 w-16 text-gray-400" />}
                              {formData.type === 'video' && <Video className="h-16 w-16 text-gray-400" />}
                              {formData.type === 'document' && <File className="h-16 w-16 text-gray-400" />}
                            </div>
                            <div className="text-center">
                              <label htmlFor="media-upload-edit" className="cursor-pointer">
                                <span className="text-lg font-medium text-blue-600 hover:text-blue-500">
                                  Click to upload {formData.type}
                                </span>
                                <p className="text-gray-500 mt-2">or drag and drop your file here</p>
                              </label>
                              <input
                                id="media-upload-edit"
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
                            <div className="mt-4 text-center">
                              <p className="text-xs text-gray-500">
                                {formData.type === 'image' && 'Supported: PNG, JPG, GIF • Max size: 16MB'}
                                {formData.type === 'video' && 'Supported: MP4, AVI, MOV • Max size: 16MB'}
                                {formData.type === 'document' && 'Supported: PDF, DOC, XLS, PPT • Max size: 16MB'}
                              </p>
                            </div>
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

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? 'Updating...' : 'Update Template'}
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
