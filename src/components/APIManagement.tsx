'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit,
  Globe,
  Webhook,
  Code,
  Shield,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal, { ModalHeader, ModalBody, ModalFooter } from './ui/Modal'
import { cn, formatDate, getTimeAgo, copyToClipboard } from '@/lib/utils'

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  isActive: boolean
  lastUsed?: string
  usageCount: number
  rateLimit: number
  createdAt: string
  expiresAt?: string
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret: string
  lastTriggered?: string
  successCount: number
  failureCount: number
  createdAt: string
}

const apiPermissions = [
  { id: 'messages.send', name: 'Send Messages', description: 'Send WhatsApp messages' },
  { id: 'messages.read', name: 'Read Messages', description: 'Read message history' },
  { id: 'contacts.read', name: 'Read Contacts', description: 'Access contact information' },
  { id: 'sessions.read', name: 'Read Sessions', description: 'View session status' },
  { id: 'analytics.read', name: 'Read Analytics', description: 'Access analytics data' }
]

const webhookEvents = [
  { id: 'message.received', name: 'Message Received', description: 'When a new message is received' },
  { id: 'message.sent', name: 'Message Sent', description: 'When a message is sent successfully' },
  { id: 'session.connected', name: 'Session Connected', description: 'When a WhatsApp session connects' },
  { id: 'session.disconnected', name: 'Session Disconnected', description: 'When a WhatsApp session disconnects' },
  { id: 'contact.added', name: 'Contact Added', description: 'When a new contact is added' }
]

export default function APIManagement() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'api-keys' | 'webhooks' | 'docs'>('api-keys')
  const [showCreateAPIModal, setShowCreateAPIModal] = useState(false)
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const [apiFormData, setApiFormData] = useState({
    name: '',
    permissions: [] as string[],
    rateLimit: 1000,
    expiresAt: ''
  })

  const [webhookFormData, setWebhookFormData] = useState({
    name: '',
    url: '',
    events: [] as string[]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Mock API Keys
      const mockAPIKeys: APIKey[] = [
        {
          id: '1',
          name: 'Production API',
          key: 'wa_live_sk_1234567890abcdef',
          permissions: ['messages.send', 'messages.read', 'contacts.read'],
          isActive: true,
          lastUsed: new Date(Date.now() - 300000).toISOString(),
          usageCount: 15420,
          rateLimit: 5000,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Development API',
          key: 'wa_test_sk_abcdef1234567890',
          permissions: ['messages.send', 'messages.read'],
          isActive: true,
          lastUsed: new Date(Date.now() - 3600000).toISOString(),
          usageCount: 892,
          rateLimit: 1000,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Analytics API',
          key: 'wa_live_sk_fedcba0987654321',
          permissions: ['analytics.read', 'sessions.read'],
          isActive: false,
          usageCount: 234,
          rateLimit: 500,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Mock Webhooks
      const mockWebhooks: Webhook[] = [
        {
          id: '1',
          name: 'Message Handler',
          url: 'https://api.example.com/webhooks/messages',
          events: ['message.received', 'message.sent'],
          isActive: true,
          secret: 'whsec_1234567890abcdef',
          lastTriggered: new Date(Date.now() - 120000).toISOString(),
          successCount: 2847,
          failureCount: 12,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Session Monitor',
          url: 'https://monitor.example.com/sessions',
          events: ['session.connected', 'session.disconnected'],
          isActive: true,
          secret: 'whsec_abcdef1234567890',
          lastTriggered: new Date(Date.now() - 1800000).toISOString(),
          successCount: 156,
          failureCount: 3,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setApiKeys(mockAPIKeys)
      setWebhooks(mockWebhooks)
    } catch (error) {
      console.error('Error loading API data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAPIKey = () => {
    const prefix = 'wa_live_sk_'
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    return prefix + randomPart
  }

  const generateWebhookSecret = () => {
    const prefix = 'whsec_'
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    return prefix + randomPart
  }

  const handleCreateAPIKey = async () => {
    try {
      const newAPIKey: APIKey = {
        id: Date.now().toString(),
        name: apiFormData.name,
        key: generateAPIKey(),
        permissions: apiFormData.permissions,
        isActive: true,
        usageCount: 0,
        rateLimit: apiFormData.rateLimit,
        createdAt: new Date().toISOString(),
        expiresAt: apiFormData.expiresAt || undefined
      }

      setApiKeys(prev => [...prev, newAPIKey])
      setShowCreateAPIModal(false)
      setApiFormData({ name: '', permissions: [], rateLimit: 1000, expiresAt: '' })
    } catch (error) {
      console.error('Error creating API key:', error)
    }
  }

  const handleCreateWebhook = async () => {
    try {
      const newWebhook: Webhook = {
        id: Date.now().toString(),
        name: webhookFormData.name,
        url: webhookFormData.url,
        events: webhookFormData.events,
        isActive: true,
        secret: generateWebhookSecret(),
        successCount: 0,
        failureCount: 0,
        createdAt: new Date().toISOString()
      }

      setWebhooks(prev => [...prev, newWebhook])
      setShowCreateWebhookModal(false)
      setWebhookFormData({ name: '', url: '', events: [] })
    } catch (error) {
      console.error('Error creating webhook:', error)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return key
    return key.substring(0, 8) + '•'.repeat(key.length - 12) + key.substring(key.length - 4)
  }

  const handleCopyKey = (key: string) => {
    copyToClipboard(key)
    // You could add a toast notification here
  }

  const handleDeleteAPIKey = (keyId: string) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      setApiKeys(prev => prev.filter(key => key.id !== keyId))
    }
  }

  const handleDeleteWebhook = (webhookId: string) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId))
    }
  }

  const toggleAPIKeyStatus = (keyId: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, isActive: !key.isActive } : key
    ))
  }

  const toggleWebhookStatus = (webhookId: string) => {
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === webhookId ? { ...webhook, isActive: !webhook.isActive } : webhook
    ))
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-48 rounded-xl"></div>
            ))}
          </div>
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
            <Key className="w-8 h-8 mr-3 text-purple-600" />
            API Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage API keys, webhooks, and integrations for your WhatsApp platform
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">API Keys</p>
              <p className="text-xl font-bold text-gray-900">{apiKeys.length}</p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Webhook className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Webhooks</p>
              <p className="text-xl font-bold text-gray-900">{webhooks.length}</p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">API Calls (24h)</p>
              <p className="text-xl font-bold text-gray-900">
                {apiKeys.reduce((sum, key) => sum + (key.usageCount || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-xl font-bold text-gray-900">99.2%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'api-keys', label: 'API Keys', icon: Key },
          { id: 'webhooks', label: 'Webhooks', icon: Webhook },
          { id: 'docs', label: 'Documentation', icon: Code }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1"
              icon={<Icon size={16} />}
            >
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              API Keys
            </h2>
            <Button
              onClick={() => setShowCreateAPIModal(true)}
              icon={<Plus size={16} />}
            >
              Create API Key
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {apiKeys.map((apiKey, index) => (
                <motion.div
                  key={apiKey.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card variant="elevated" hover>
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                              <Key className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {apiKey.name}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className={cn(
                                  'px-2 py-1 rounded-full text-xs font-medium',
                                  apiKey.isActive 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                )}>
                                  {apiKey.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Created {formatDate(apiKey.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                                {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleKeyVisibility(apiKey.id)}
                                className="p-2"
                              >
                                {visibleKeys.has(apiKey.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyKey(apiKey.key)}
                                className="p-2"
                              >
                                <Copy size={16} />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Usage:</span>
                                <p className="font-medium text-gray-900">
                                  {apiKey.usageCount.toLocaleString()} calls
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Rate Limit:</span>
                                <p className="font-medium text-gray-900">
                                  {apiKey.rateLimit}/hour
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Last Used:</span>
                                <p className="font-medium text-gray-900">
                                  {apiKey.lastUsed ? getTimeAgo(apiKey.lastUsed) : 'Never'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Permissions:</span>
                                <p className="font-medium text-gray-900">
                                  {apiKey.permissions.length}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {apiKey.permissions.map(permission => (
                                <span
                                  key={permission}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                >
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAPIKeyStatus(apiKey.id)}
                            className="p-2"
                          >
                            {apiKey.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAPIKey(apiKey.id)}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Webhooks
            </h2>
            <Button
              onClick={() => setShowCreateWebhookModal(true)}
              icon={<Plus size={16} />}
            >
              Create Webhook
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {webhooks.map((webhook, index) => (
                <motion.div
                  key={webhook.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card variant="elevated" hover>
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-green-500 rounded-lg flex items-center justify-center">
                              <Webhook className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {webhook.name}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className={cn(
                                  'px-2 py-1 rounded-full text-xs font-medium',
                                  webhook.isActive 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                )}>
                                  {webhook.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Created {formatDate(webhook.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Globe size={16} className="text-gray-400" />
                              <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                                {webhook.url}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2"
                              >
                                <ExternalLink size={16} />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Success:</span>
                                <p className="font-medium text-green-600">
                                  {webhook.successCount.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Failures:</span>
                                <p className="font-medium text-red-600">
                                  {webhook.failureCount.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Last Triggered:</span>
                                <p className="font-medium text-gray-900">
                                  {webhook.lastTriggered ? getTimeAgo(webhook.lastTriggered) : 'Never'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Events:</span>
                                <p className="font-medium text-gray-900">
                                  {webhook.events.length}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {webhook.events.map(event => (
                                <span
                                  key={event}
                                  className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                                >
                                  {event}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                          >
                            <RefreshCw size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWebhookStatus(webhook.id)}
                            className="p-2"
                          >
                            {webhook.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader title="API Documentation" />
            <CardContent>
              <div className="prose max-w-none">
                <h3>Getting Started</h3>
                <p>
                  Welcome to the WhatsApp Pro API! This documentation will help you integrate 
                  our powerful messaging platform into your applications.
                </p>
                
                <h4>Authentication</h4>
                <p>All API requests require authentication using an API key in the header:</p>
                <pre className="bg-gray-100 p-4 rounded-lg">
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </pre>
                
                <h4>Base URL</h4>
                <pre className="bg-gray-100 p-4 rounded-lg">
                  <code>https://api.whatsapp-pro.com/v1</code>
                </pre>
                
                <h4>Send Message</h4>
                <pre className="bg-gray-100 p-4 rounded-lg">
                  <code>{`POST /messages
{
  "to": "+1234567890",
  "message": "Hello from WhatsApp Pro!",
  "session_id": "session_123"
}`}</code>
                </pre>
                
                <h4>Webhooks</h4>
                <p>
                  Configure webhooks to receive real-time notifications about message events, 
                  session status changes, and more.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create API Key Modal */}
      <Modal
        isOpen={showCreateAPIModal}
        onClose={() => setShowCreateAPIModal(false)}
        title="Create API Key"
        size="lg"
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="API Key Name"
              value={apiFormData.name}
              onChange={(e) => setApiFormData({ ...apiFormData, name: e.target.value })}
              placeholder="Enter a descriptive name"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                {apiPermissions.map(permission => (
                  <label key={permission.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={apiFormData.permissions.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setApiFormData({
                            ...apiFormData,
                            permissions: [...apiFormData.permissions, permission.id]
                          })
                        } else {
                          setApiFormData({
                            ...apiFormData,
                            permissions: apiFormData.permissions.filter(p => p !== permission.id)
                          })
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{permission.name}</p>
                      <p className="text-sm text-gray-600">{permission.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <Input
              label="Rate Limit (requests per hour)"
              type="number"
              value={apiFormData.rateLimit}
              onChange={(e) => setApiFormData({ ...apiFormData, rateLimit: parseInt(e.target.value) })}
              placeholder="1000"
            />
            
            <Input
              label="Expiration Date (optional)"
              type="date"
              value={apiFormData.expiresAt}
              onChange={(e) => setApiFormData({ ...apiFormData, expiresAt: e.target.value })}
            />
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowCreateAPIModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateAPIKey}
            disabled={!apiFormData.name || apiFormData.permissions.length === 0}
          >
            Create API Key
          </Button>
        </ModalFooter>
      </Modal>

      {/* Create Webhook Modal */}
      <Modal
        isOpen={showCreateWebhookModal}
        onClose={() => setShowCreateWebhookModal(false)}
        title="Create Webhook"
        size="lg"
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Webhook Name"
              value={webhookFormData.name}
              onChange={(e) => setWebhookFormData({ ...webhookFormData, name: e.target.value })}
              placeholder="Enter a descriptive name"
            />
            
            <Input
              label="Webhook URL"
              value={webhookFormData.url}
              onChange={(e) => setWebhookFormData({ ...webhookFormData, url: e.target.value })}
              placeholder="https://your-app.com/webhooks/whatsapp"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Events to Subscribe
              </label>
              <div className="space-y-2">
                {webhookEvents.map(event => (
                  <label key={event.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={webhookFormData.events.includes(event.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWebhookFormData({
                            ...webhookFormData,
                            events: [...webhookFormData.events, event.id]
                          })
                        } else {
                          setWebhookFormData({
                            ...webhookFormData,
                            events: webhookFormData.events.filter(e => e !== event.id)
                          })
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowCreateWebhookModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateWebhook}
            disabled={!webhookFormData.name || !webhookFormData.url || webhookFormData.events.length === 0}
          >
            Create Webhook
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
