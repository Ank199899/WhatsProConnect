'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Copy,
  Send,
  Eye,
  Download,
  Upload,
  Grid3X3,
  List,
  Folder,
  FolderPlus,
  Tag,
  Star,
  Clock,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Image,
  Video,
  FileImage,
  Mic,
  Paperclip,
  Palette,
  Hash,
  MessageSquare,
  TrendingUp,
  Zap,
  Globe,
  Layers,
  Target,
  Calendar,
  Activity,
  X,
  Check,
  AlertTriangle,
  FolderOpen,
  Move,
  Archive,
  Share2,
  ExternalLink
} from 'lucide-react'

interface Template {
  id: string
  name: string
  content: string
  type: 'text' | 'image' | 'video' | 'document' | 'interactive'
  category: string
  status: 'active' | 'draft' | 'pending' | 'rejected'
  language: string
  variables: TemplateVariable[]
  usageCount: number
  group_id?: string
  group_name?: string
  created_at: string
  updated_at: string
  created_by: string
  mediaUrl?: string
  mediaType?: 'image' | 'video' | 'document' | 'audio'
  mediaCaption?: string
  mediaFilename?: string
  mediaSize?: number
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  isArchived?: boolean
}

interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'url' | 'phone'
  required: boolean
  defaultValue?: string
  description?: string
}

interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video' | 'document' | 'audio'
}

interface TemplateGroup {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  is_active: boolean
  template_count: number
  created_at: string
  updated_at: string
  created_by: string
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

const AdvancedTemplateManagementSection: React.FC = () => {
  // State management
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'groups'>('grid')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Selected items
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk' | 'group'>('single')
  const [targetGroupId, setTargetGroupId] = useState<string>('')

  // API Functions
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchTemplateGroups = async () => {
    try {
      const response = await fetch('/api/template-groups')
      const data = await response.json()
      if (data.success) {
        setTemplateGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching template groups:', error)
    }
  }

  const createTemplate = async (templateData: Partial<Template>) => {
    setSaving(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })
      const data = await response.json()
      if (data.success) {
        await fetchTemplates() // Refresh data
        return data.template
      }
      throw new Error(data.error)
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const updateTemplate = async (templateId: string, templateData: Partial<Template>) => {
    setSaving(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId, ...templateData })
      })
      const data = await response.json()
      if (data.success) {
        await fetchTemplates() // Refresh data
        return data.template
      }
      throw new Error(data.error)
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        await fetchTemplates() // Refresh data
        return true
      }
      throw new Error(data.error)
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const bulkDeleteTemplates = async (templateIds: string[]) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/templates?ids=${templateIds.join(',')}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        await fetchTemplates() // Refresh data
        return data.deletedCount
      }
      throw new Error(data.error)
    } catch (error) {
      console.error('Error bulk deleting templates:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const moveTemplates = async (templateIds: string[], groupId: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/templates/bulk-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateIds, groupId })
      })
      const data = await response.json()
      if (data.success) {
        await fetchTemplates() // Refresh data
        return data.movedCount
      }
      throw new Error(data.error)
    } catch (error) {
      console.error('Error moving templates:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const clearAllTemplates = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/templates/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) {
        await fetchTemplates() // Refresh data
        await fetchTemplateGroups() // Refresh groups
        setSelectedTemplates([])
        setShowClearConfirm(false)
        console.log('✅ All templates cleared successfully')
      }
    } catch (error) {
      console.error('Error clearing templates:', error)
    } finally {
      setSaving(false)
    }
  }

  const createTemplateGroup = async (groupData: Partial<TemplateGroup>) => {
    setSaving(true)
    try {
      const response = await fetch('/api/template-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
      })
      const data = await response.json()
      if (data.success) {
        await fetchTemplateGroups() // Refresh data
        return data.group
      }
      throw new Error(data.error)
    } catch (error) {
      console.error('Error creating template group:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplateGroup = async (groupId: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/template-groups?id=${groupId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        await fetchTemplateGroups() // Refresh data
        await fetchTemplates() // Refresh templates too
        return true
      }
      throw new Error(data.error)
    } catch (error) {
      console.error('Error deleting template group:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchTemplates(), fetchTemplateGroups()])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Mock data for demo (fallback if no data)
  useEffect(() => {
    const mockTemplates: Template[] = [
      {
        id: '1',
        name: 'Welcome Message',
        content: 'Welcome to our service, {{name}}! We are excited to have you on board.',
        type: 'text',
        category: 'Welcome',
        status: 'active',
        language: 'en',
        variables: [
          { name: 'name', type: 'text', required: true, description: 'Customer name' }
        ],
        usageCount: 245,
        group_id: '1',
        group_name: 'Onboarding',
        created_at: '2024-01-15',
        updated_at: '2024-01-15',
        created_by: 'admin'
      },
      {
        id: '2',
        name: 'Order Confirmation',
        content: 'Your order #{{order_id}} has been confirmed. Total: ${{amount}}',
        type: 'text',
        category: 'Transactional',
        status: 'active',
        language: 'en',
        variables: [
          { name: 'order_id', type: 'text', required: true, description: 'Order ID' },
          { name: 'amount', type: 'number', required: true, description: 'Order amount' }
        ],
        usageCount: 1250,
        group_id: '2',
        group_name: 'E-commerce',
        created_at: '2024-01-10',
        updated_at: '2024-01-20',
        created_by: 'admin'
      },
      {
        id: '3',
        name: 'Promotional Offer',
        content: 'Special offer just for you! Get {{discount}}% off on your next purchase.',
        type: 'image',
        category: 'Promotional',
        status: 'active',
        language: 'en',
        variables: [
          { name: 'discount', type: 'number', required: true, defaultValue: '20', description: 'Discount percentage' }
        ],
        usageCount: 890,
        group_id: '3',
        group_name: 'Marketing',
        created_at: '2024-01-05',
        updated_at: '2024-01-25',
        created_by: 'admin',
        mediaUrl: '/images/promo.jpg'
      }
    ]

    const mockGroups: TemplateGroup[] = [
      {
        id: '1',
        name: 'Onboarding',
        description: 'Welcome and onboarding templates',
        color: '#3B82F6',
        icon: 'users',
        is_active: true,
        template_count: 5,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        created_by: 'admin'
      },
      {
        id: '2',
        name: 'E-commerce',
        description: 'Order and transaction templates',
        color: '#10B981',
        icon: 'shopping-cart',
        is_active: true,
        template_count: 8,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        created_by: 'admin'
      },
      {
        id: '3',
        name: 'Marketing',
        description: 'Promotional and marketing templates',
        color: '#F59E0B',
        icon: 'megaphone',
        is_active: true,
        template_count: 12,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        created_by: 'admin'
      }
    ]

    setTemplates(mockTemplates)
    setTemplateGroups(mockGroups)
    setLoading(false)
  }, [])

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesType = selectedType === 'all' || template.type === selectedType
    const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus
    const matchesGroup = selectedGroup === 'all' || template.group_id === selectedGroup

    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesGroup
  })

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Header Section - Fixed */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm border-b border-green-200/30 shadow-sm px-6 py-6 flex-shrink-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Template Management
              </h1>
              <p className="text-gray-600 mt-1">Create and manage message templates for your campaigns</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              New Group
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6 py-4 flex-shrink-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-green-200/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold text-green-600">{templates.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-green-200/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Templates</p>
                <p className="text-2xl font-bold text-emerald-600">{templates.filter(t => t.status === 'active').length}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-green-200/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Template Groups</p>
                <p className="text-2xl font-bold text-green-700">{templateGroups.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-green-200/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-emerald-700">{templates.reduce((sum, t) => sum + (t.usageCount || 0), 0)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-6 py-4 flex-shrink-0"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-green-200/30 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {templateCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="interactive">Interactive</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('groups')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'groups' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedTemplates.length > 0 && (
                <div className="flex items-center gap-2 ml-4 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm text-green-700 font-medium">
                    {selectedTemplates.length} selected
                  </span>
                  <button
                    onClick={() => setShowMoveModal(true)}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="Move to group"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTarget('bulk')
                      setShowBulkDeleteModal(true)
                    }}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete selected"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedTemplates([])}
                    className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full bg-white/90 backdrop-blur-sm rounded-xl border border-green-200/30 shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading templates...</p>
              </div>
            </div>
          ) : saving ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Saving changes...</p>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500 mb-4">Create your first template to get started</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Create Template
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              {viewMode === 'groups' ? (
                <GroupView
                  templates={filteredTemplates}
                  groups={templateGroups}
                  selectedTemplates={selectedTemplates}
                  onSelectTemplate={(id, selected) => {
                    if (selected) {
                      setSelectedTemplates(prev => [...prev, id])
                    } else {
                      setSelectedTemplates(prev => prev.filter(t => t !== id))
                    }
                  }}
                  onViewTemplate={(template) => {
                    setSelectedTemplate(template)
                    setShowPreviewModal(true)
                  }}
                  onEditTemplate={(template) => {
                    setSelectedTemplate(template)
                    setShowCreateModal(true)
                  }}
                  onDeleteTemplate={(template) => {
                    setSelectedTemplate(template)
                    setDeleteTarget('single')
                    setShowDeleteModal(true)
                  }}
                  onDeleteGroup={(groupId) => {
                    setTargetGroupId(groupId)
                    setDeleteTarget('group')
                    setShowBulkDeleteModal(true)
                  }}
                />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplates.includes(template.id)}
                      onSelect={(selected) => {
                        if (selected) {
                          setSelectedTemplates(prev => [...prev, template.id])
                        } else {
                          setSelectedTemplates(prev => prev.filter(t => t !== template.id))
                        }
                      }}
                      onView={() => {
                        setSelectedTemplate(template)
                        setShowPreviewModal(true)
                      }}
                      onEdit={() => {
                        setSelectedTemplate(template)
                        setShowCreateModal(true)
                      }}
                      onDelete={() => {
                        setSelectedTemplate(template)
                        setDeleteTarget('single')
                        setShowDeleteModal(true)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTemplates.map((template) => (
                    <TemplateListItem
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplates.includes(template.id)}
                      onSelect={(selected) => {
                        if (selected) {
                          setSelectedTemplates(prev => [...prev, template.id])
                        } else {
                          setSelectedTemplates(prev => prev.filter(t => t !== template.id))
                        }
                      }}
                      onView={() => {
                        setSelectedTemplate(template)
                        setShowPreviewModal(true)
                      }}
                      onEdit={() => {
                        setSelectedTemplate(template)
                        setShowCreateModal(true)
                      }}
                      onDelete={() => {
                        setSelectedTemplate(template)
                        setDeleteTarget('single')
                        setShowDeleteModal(true)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Template Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTemplateModal
            template={selectedTemplate}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedTemplate(null)
            }}
            onSave={async (templateData) => {
              try {
                if (selectedTemplate) {
                  // Edit existing template
                  await updateTemplate(selectedTemplate.id, templateData)
                } else {
                  // Create new template
                  await createTemplate(templateData)
                }
                setShowCreateModal(false)
                setSelectedTemplate(null)
              } catch (error) {
                console.error('Error saving template:', error)
                alert('Error saving template. Please try again.')
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Group Management Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <GroupManagementModal
            groups={templateGroups}
            onClose={() => setShowGroupModal(false)}
            onSave={async (groupData) => {
              try {
                await createTemplateGroup(groupData)
                setShowGroupModal(false)
              } catch (error) {
                console.error('Error creating group:', error)
                alert('Error creating group. Please try again.')
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && selectedTemplate && (
          <PreviewTemplateModal
            template={selectedTemplate}
            onClose={() => {
              setShowPreviewModal(false)
              setSelectedTemplate(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedTemplate && (
          <DeleteConfirmationModal
            template={selectedTemplate}
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedTemplate(null)
            }}
            onConfirm={async () => {
              try {
                await deleteTemplate(selectedTemplate.id)
                setShowDeleteModal(false)
                setSelectedTemplate(null)
              } catch (error) {
                console.error('Error deleting template:', error)
                alert('Error deleting template. Please try again.')
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Bulk Delete Modal */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <BulkDeleteModal
            selectedCount={selectedTemplates.length}
            deleteTarget={deleteTarget}
            targetGroup={templateGroups.find(g => g.id === targetGroupId)}
            onClose={() => {
              setShowBulkDeleteModal(false)
              setTargetGroupId('')
            }}
            onConfirm={async () => {
              try {
                if (deleteTarget === 'bulk') {
                  await bulkDeleteTemplates(selectedTemplates)
                  setSelectedTemplates([])
                } else if (deleteTarget === 'group') {
                  await deleteTemplateGroup(targetGroupId)
                }
                setShowBulkDeleteModal(false)
                setTargetGroupId('')
              } catch (error) {
                console.error('Error in bulk delete:', error)
                alert('Error deleting items. Please try again.')
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Move Templates Modal */}
      <AnimatePresence>
        {showMoveModal && (
          <MoveTemplatesModal
            selectedCount={selectedTemplates.length}
            groups={templateGroups}
            onClose={() => setShowMoveModal(false)}
            onMove={async (groupId) => {
              try {
                await moveTemplates(selectedTemplates, groupId)
                setSelectedTemplates([])
                setShowMoveModal(false)
              } catch (error) {
                console.error('Error moving templates:', error)
                alert('Error moving templates. Please try again.')
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <ClearConfirmModal
            onClose={() => setShowClearConfirm(false)}
            onConfirm={clearAllTemplates}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Template Card Component
const TemplateCard: React.FC<{
  template: Template
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}> = ({ template, isSelected = false, onSelect, onView, onEdit, onDelete }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return FileText
      case 'image': return Image
      case 'video': return Video
      case 'document': return Paperclip
      case 'interactive': return Settings
      default: return FileText
    }
  }

  const TypeIcon = getTypeIcon(template.type)

  return (
    <motion.div
      whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className={`bg-white/95 backdrop-blur-sm rounded-xl border shadow-lg p-6 cursor-pointer group relative ${
        isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-green-200/30'
      }`}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TypeIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
              {template.name}
            </h3>
            <p className="text-sm text-gray-500">{template.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{template.content}</p>

      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          template.status === 'active' ? 'bg-green-100 text-green-800' :
          template.status === 'draft' ? 'bg-gray-100 text-gray-800' :
          template.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {template.status}
        </span>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          {template.usageCount}
        </div>
      </div>
    </motion.div>
  )
}

// Template List Item Component
const TemplateListItem: React.FC<{
  template: Template
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}> = ({ template, isSelected = false, onSelect, onView, onEdit, onDelete }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return FileText
      case 'image': return Image
      case 'video': return Video
      case 'document': return Paperclip
      case 'interactive': return Settings
      default: return FileText
    }
  }

  const TypeIcon = getTypeIcon(template.type)

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`bg-white/95 backdrop-blur-sm rounded-xl border shadow-lg p-4 cursor-pointer group ${
        isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-green-200/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Selection Checkbox */}
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TypeIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
              {template.name}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-1">{template.content}</p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="capitalize">{template.type}</span>
          </div>
          <div className="text-sm text-gray-500">
            {template.category}
          </div>
          <div className="text-sm text-gray-500">
            {template.group_name || 'Ungrouped'}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            template.status === 'active' ? 'bg-green-100 text-green-800' :
            template.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            template.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {template.status}
          </span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity className="w-4 h-4" />
            {template.usageCount}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Group View Component
const GroupView: React.FC<{
  templates: Template[]
  groups: TemplateGroup[]
  selectedTemplates: string[]
  onSelectTemplate: (id: string, selected: boolean) => void
  onViewTemplate: (template: Template) => void
  onEditTemplate: (template: Template) => void
  onDeleteTemplate: (template: Template) => void
  onDeleteGroup: (groupId: string) => void
}> = ({
  templates,
  groups,
  selectedTemplates,
  onSelectTemplate,
  onViewTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDeleteGroup
}) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(groups.map(g => g.id))

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const ungroupedTemplates = templates.filter(t => !t.group_id)

  return (
    <div className="space-y-6">
      {/* Groups */}
      {groups.map(group => {
        const groupTemplates = templates.filter(t => t.group_id === group.id)
        const isExpanded = expandedGroups.includes(group.id)

        return (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl border border-green-200/30 shadow-lg overflow-hidden"
          >
            {/* Group Header */}
            <div className="p-4 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="p-1 hover:bg-green-100 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-green-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-green-600" />
                    )}
                  </button>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-500">
                      {groupTemplates.length} templates
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteGroup(group.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Group Templates */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4"
                >
                  {groupTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No templates in this group</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupTemplates.map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          isSelected={selectedTemplates.includes(template.id)}
                          onSelect={(selected) => onSelectTemplate(template.id, selected)}
                          onView={() => onViewTemplate(template)}
                          onEdit={() => onEditTemplate(template)}
                          onDelete={() => onDeleteTemplate(template)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      {/* Ungrouped Templates */}
      {ungroupedTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/30 shadow-lg p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-600" />
            Ungrouped Templates ({ungroupedTemplates.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ungroupedTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplates.includes(template.id)}
                onSelect={(selected) => onSelectTemplate(template.id, selected)}
                onView={() => onViewTemplate(template)}
                onEdit={() => onEditTemplate(template)}
                onDelete={() => onDeleteTemplate(template)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Create Template Modal Component
const CreateTemplateModal: React.FC<{
  template?: Template | null
  onClose: () => void
  onSave: (data: Partial<Template>) => void
}> = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    content: template?.content || '',
    type: template?.type || 'text' as const,
    category: template?.category || 'Marketing',
    status: template?.status || 'draft' as const,
    language: template?.language || 'en',
    variables: template?.variables || [],
    group_id: template?.group_id || '',
    group_name: template?.group_name || '',
    tags: template?.tags || [],
    priority: template?.priority || 'medium' as const
  })

  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null)
  const [newVariable, setNewVariable] = useState<TemplateVariable>({
    name: '',
    type: 'text',
    required: true,
    description: ''
  })
  const [showVariableForm, setShowVariableForm] = useState(false)

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      const type = file.type.startsWith('image/') ? 'image' :
                   file.type.startsWith('video/') ? 'video' :
                   file.type.startsWith('audio/') ? 'audio' : 'document'

      setMediaFile({ file, preview, type })
      setFormData(prev => ({
        ...prev,
        type: type as any,
        mediaUrl: preview,
        mediaType: type as any,
        mediaFilename: file.name,
        mediaSize: file.size
      }))
    }
  }

  const addVariable = () => {
    if (newVariable.name.trim()) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, { ...newVariable }]
      }))
      setNewVariable({ name: '', type: 'text', required: true, description: '' })
      setShowVariableForm(false)
    }
  }

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Use {{variable_name}} for dynamic content"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use double curly braces for variables: {`{{variable_name}}`}
            </p>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Upload
            </label>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
              {mediaFile ? (
                <div className="space-y-4">
                  {mediaFile.type === 'image' && (
                    <img
                      src={mediaFile.preview}
                      alt="Preview"
                      className="max-w-full h-32 object-cover mx-auto rounded-lg"
                    />
                  )}
                  {mediaFile.type === 'video' && (
                    <video
                      src={mediaFile.preview}
                      className="max-w-full h-32 mx-auto rounded-lg"
                      controls
                    />
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-600">{mediaFile.file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaFile(null)
                        setFormData(prev => ({
                          ...prev,
                          type: 'text',
                          mediaUrl: undefined,
                          mediaType: undefined,
                          mediaFilename: undefined,
                          mediaSize: undefined
                        }))
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Upload media file</p>
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    onChange={handleMediaUpload}
                    className="hidden"
                    id="media-upload"
                  />
                  <label
                    htmlFor="media-upload"
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {templateCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Variables Management */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Variables
              </label>
              <button
                type="button"
                onClick={() => setShowVariableForm(true)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Variable
              </button>
            </div>

            {/* Existing Variables */}
            <div className="space-y-2 mb-4">
              {formData.variables.map((variable, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-800">{`{{${variable.name}}}`}</span>
                      <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full">
                        {variable.type}
                      </span>
                      {variable.required && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    {variable.description && (
                      <p className="text-sm text-gray-600 mt-1">{variable.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariable(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Variable Form */}
            {showVariableForm && (
              <div className="p-4 border border-green-200 rounded-lg bg-green-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Variable name"
                    value={newVariable.name}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <select
                    value={newVariable.type}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, type: e.target.value as any }))}
                    className="px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="url">URL</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newVariable.description}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={newVariable.required}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, required: e.target.checked }))}
                    className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="required" className="text-sm text-gray-700">Required</label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addVariable}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVariableForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              {template ? 'Update' : 'Create'} Template
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Group Management Modal Component
const GroupManagementModal: React.FC<{
  groups: TemplateGroup[]
  onClose: () => void
  onSave: (data: Partial<TemplateGroup>) => void
}> = ({ groups, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#10B981',
    icon: 'folder',
    is_active: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Group</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-full h-10 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Create Group
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Preview Template Modal Component
const PreviewTemplateModal: React.FC<{
  template: Template
  onClose: () => void
}> = ({ template, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Template Preview</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Template Name</h3>
              <p className="text-gray-900">{template.name}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Category</h3>
              <p className="text-gray-900">{template.category}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Type</h3>
              <p className="text-gray-900 capitalize">{template.type}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                template.status === 'active' ? 'bg-green-100 text-green-800' :
                template.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                template.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {template.status}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Content</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{template.content}</p>
            </div>
          </div>

          {template.variables && template.variables.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Variables</h3>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((variable, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Usage Count:</span> {template.usageCount}
            </div>
            <div>
              <span className="font-medium">Created:</span> {template.created_at}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {template.updated_at}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Delete Confirmation Modal
const DeleteConfirmationModal: React.FC<{
  template: Template
  onClose: () => void
  onConfirm: () => void
}> = ({ template, onClose, onConfirm }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Template</h3>
              <p className="text-gray-600">This action cannot be undone</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete <strong>"{template.name}"</strong>?
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Bulk Delete Modal
const BulkDeleteModal: React.FC<{
  selectedCount: number
  deleteTarget: 'bulk' | 'group'
  targetGroup?: TemplateGroup
  onClose: () => void
  onConfirm: () => void
}> = ({ selectedCount, deleteTarget, targetGroup, onClose, onConfirm }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {deleteTarget === 'bulk' ? 'Delete Templates' : 'Delete Group'}
              </h3>
              <p className="text-gray-600">This action cannot be undone</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              {deleteTarget === 'bulk' ? (
                <>Are you sure you want to delete <strong>{selectedCount} selected templates</strong>?</>
              ) : (
                <>Are you sure you want to delete the group <strong>"{targetGroup?.name}"</strong> and all its templates?</>
              )}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete {deleteTarget === 'bulk' ? 'Templates' : 'Group'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Move Templates Modal
const MoveTemplatesModal: React.FC<{
  selectedCount: number
  groups: TemplateGroup[]
  onClose: () => void
  onMove: (groupId: string) => void
}> = ({ selectedCount, groups, onClose, onMove }) => {
  const [selectedGroupId, setSelectedGroupId] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Move className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Move Templates</h3>
              <p className="text-gray-600">Move {selectedCount} templates to a group</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Target Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select a group...</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedGroupId && onMove(selectedGroupId)}
              disabled={!selectedGroupId}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Move Templates
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Clear Confirmation Modal Component
const ClearConfirmModal: React.FC<{
  onClose: () => void
  onConfirm: () => void
  saving: boolean
}> = ({ onClose, onConfirm, saving }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Clear All Templates</h3>
            <p className="text-gray-600">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">
            Are you sure you want to clear all templates and groups? This will permanently delete:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>• All message templates</li>
            <li>• All template groups</li>
            <li>• All template configurations</li>
          </ul>
          <p className="mt-3 text-sm text-red-600 font-medium">
            This action cannot be undone!
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Clear All
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AdvancedTemplateManagementSection
