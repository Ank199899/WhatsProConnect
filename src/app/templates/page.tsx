'use client'

import React, { useState, useEffect } from 'react'
import AdvancedTemplateManagement from '@/components/AdvancedTemplateManagementSection'
import TemplateManagementComponent from '@/components/TemplateManagement'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import AnimatedHeader from '@/components/AnimatedHeader'
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Copy,
  Send,
  FileText,
  Image,
  Video,
  Mic,
  Paperclip,
  Settings,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Template {
  id: string
  name: string
  content: string
  category: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document'
  variables: string[]
  createdAt: string
  updatedAt: string
  usageCount: number
}

const TemplatesPage = () => {
  const [useAdvancedUI, setUseAdvancedUI] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  // Demo templates data
  const demoTemplates: Template[] = [
    {
      id: '1',
      name: 'Welcome Message',
      content: 'Hello {{name}}! Welcome to {{company}}. How can we help you today?',
      category: 'greeting',
      type: 'text',
      variables: ['name', 'company'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      usageCount: 45
    },
    {
      id: '2',
      name: 'Order Confirmation',
      content: 'Your order #{{orderNumber}} has been confirmed. Total: {{amount}}. Expected delivery: {{date}}',
      category: 'order',
      type: 'text',
      variables: ['orderNumber', 'amount', 'date'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      usageCount: 32
    },
    {
      id: '3',
      name: 'Support Follow-up',
      content: 'Hi {{name}}, we wanted to follow up on your recent support request. Is everything resolved?',
      category: 'support',
      type: 'text',
      variables: ['name'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      usageCount: 28
    }
  ]

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'greeting', label: 'Greetings' },
    { value: 'order', label: 'Orders' },
    { value: 'support', label: 'Support' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'notification', label: 'Notifications' }
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      // Try to load from API, fallback to demo data
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || demoTemplates)
      } else {
        console.log('API not available, using demo templates')
        setTemplates(demoTemplates)
      }
    } catch (error) {
      console.log('Using demo templates:', error)
      setTemplates(demoTemplates)
      setError(null) // Don't show error for demo fallback
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'audio': return <Mic className="w-4 h-4" />
      case 'document': return <Paperclip className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setShowCreateModal(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setShowCreateModal(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== templateId))
    }
  }

  const handleCopyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  // If using advanced UI, render the new component
  if (useAdvancedUI) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* UI Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUseAdvancedUI(false)}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all border border-white/20"
          >
            <ToggleLeft className="w-4 h-4" />
            Switch to Classic UI
          </motion.button>
        </div>

        <AdvancedTemplateManagement />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* UI Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUseAdvancedUI(true)}
            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <ToggleRight className="w-4 h-4" />
            Switch to Advanced UI
          </motion.button>
        </div>

        <AnimatedHeader
          title="Message Templates"
          subtitle="Create and manage reusable message templates"
          icon={MessageSquare}
        />

        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {template.category}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {template.content}
                    </p>
                  </div>
                  
                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <span key={variable} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Used {template.usageCount} times</span>
                    <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyTemplate(template)}
                      className="flex-1"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first template to get started'
              }
            </p>
            <Button onClick={handleCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title={editingTemplate ? 'Edit Template' : 'Create Template'}
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                {editingTemplate ? 'Update your template' : 'Create a new message template'}
              </p>
              <div className="text-center py-8">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Template editor coming soon...</p>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}

// Error boundary wrapper
const TemplatesPageWithErrorBoundary = () => {
  try {
    return <TemplatesPage />
  } catch (error) {
    console.error('Templates page error:', error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Templates Unavailable</h2>
          <p className="text-gray-600">There was an issue loading the templates page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}

export default TemplatesPageWithErrorBoundary
