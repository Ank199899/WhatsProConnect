'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Megaphone, 
  Plus, 
  Play, 
  Pause, 
  Stop, 
  Edit, 
  Trash2, 
  Copy,
  Calendar,
  Clock,
  Users,
  MessageCircle,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Send,
  Eye,
  Download,
  Filter,
  Search
} from 'lucide-react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal, { ModalHeader, ModalBody, ModalFooter } from './ui/Modal'
import { cn, formatDate, getTimeAgo, formatNumber } from '@/lib/utils'

interface AdvancedCampaignsProps {
  whatsappManager: WhatsAppManagerClient
  selectedSession: string | null
}

interface Campaign {
  id: string
  name: string
  description: string
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed'
  type: 'broadcast' | 'drip' | 'triggered'
  template: {
    subject: string
    message: string
    variables: string[]
  }
  targeting: {
    totalContacts: number
    segments: string[]
    filters: any[]
  }
  schedule: {
    startDate: string
    endDate?: string
    timezone: string
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly'
  }
  stats: {
    sent: number
    delivered: number
    read: number
    replied: number
    failed: number
    clickRate: number
    conversionRate: number
  }
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface Template {
  id: string
  name: string
  category: string
  subject: string
  message: string
  variables: string[]
  isApproved: boolean
  createdAt: string
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  running: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const statusIcons = {
  draft: FileText,
  scheduled: Calendar,
  running: Play,
  paused: Pause,
  completed: CheckCircle,
  failed: AlertTriangle
}

export default function AdvancedCampaigns({ whatsappManager, selectedSession }: AdvancedCampaignsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'analytics'>('campaigns')

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    type: 'broadcast' as 'broadcast' | 'drip' | 'triggered',
    templateId: '',
    message: '',
    targetSegments: [] as string[],
    scheduleDate: '',
    scheduleTime: ''
  })

  useEffect(() => {
    loadCampaigns()
    loadTemplates()
  }, [selectedSession])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      
      // Mock campaigns data
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Welcome Series',
          description: 'Automated welcome messages for new customers',
          status: 'running',
          type: 'drip',
          template: {
            subject: 'Welcome to our service!',
            message: 'Hi {{name}}, welcome to our platform! We\'re excited to have you.',
            variables: ['name']
          },
          targeting: {
            totalContacts: 1250,
            segments: ['new_customers'],
            filters: []
          },
          schedule: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            timezone: 'UTC',
            frequency: 'once'
          },
          stats: {
            sent: 1180,
            delivered: 1156,
            read: 892,
            replied: 234,
            failed: 24,
            clickRate: 15.2,
            conversionRate: 8.7
          },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'admin'
        },
        {
          id: '2',
          name: 'Product Launch Announcement',
          description: 'Announcing our new product to all customers',
          status: 'completed',
          type: 'broadcast',
          template: {
            subject: 'Exciting News: New Product Launch!',
            message: 'We\'re thrilled to announce our latest product. Check it out now!',
            variables: []
          },
          targeting: {
            totalContacts: 5420,
            segments: ['all_customers'],
            filters: []
          },
          schedule: {
            startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            timezone: 'UTC',
            frequency: 'once'
          },
          stats: {
            sent: 5420,
            delivered: 5398,
            read: 4234,
            replied: 567,
            failed: 22,
            clickRate: 22.8,
            conversionRate: 12.4
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'admin'
        },
        {
          id: '3',
          name: 'Weekly Newsletter',
          description: 'Weekly updates and news for subscribers',
          status: 'scheduled',
          type: 'broadcast',
          template: {
            subject: 'Weekly Newsletter - {{week}}',
            message: 'Here are this week\'s highlights and updates...',
            variables: ['week']
          },
          targeting: {
            totalContacts: 2890,
            segments: ['newsletter_subscribers'],
            filters: []
          },
          schedule: {
            startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            timezone: 'UTC',
            frequency: 'weekly'
          },
          stats: {
            sent: 0,
            delivered: 0,
            read: 0,
            replied: 0,
            failed: 0,
            clickRate: 0,
            conversionRate: 0
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'admin'
        }
      ]
      
      setCampaigns(mockCampaigns)
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      // Mock templates data
      const mockTemplates: Template[] = [
        {
          id: '1',
          name: 'Welcome Message',
          category: 'onboarding',
          subject: 'Welcome!',
          message: 'Hi {{name}}, welcome to our platform!',
          variables: ['name'],
          isApproved: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Product Announcement',
          category: 'marketing',
          subject: 'New Product Launch',
          message: 'Check out our latest product: {{product_name}}',
          variables: ['product_name'],
          isApproved: true,
          createdAt: new Date().toISOString()
        }
      ]
      
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignForm.name,
        description: campaignForm.description,
        status: 'draft',
        type: campaignForm.type,
        template: {
          subject: campaignForm.name,
          message: campaignForm.message,
          variables: []
        },
        targeting: {
          totalContacts: 0,
          segments: campaignForm.targetSegments,
          filters: []
        },
        schedule: {
          startDate: campaignForm.scheduleDate ? new Date(campaignForm.scheduleDate + 'T' + campaignForm.scheduleTime).toISOString() : new Date().toISOString(),
          timezone: 'UTC',
          frequency: 'once'
        },
        stats: {
          sent: 0,
          delivered: 0,
          read: 0,
          replied: 0,
          failed: 0,
          clickRate: 0,
          conversionRate: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin'
      }
      
      setCampaigns(prev => [newCampaign, ...prev])
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const resetForm = () => {
    setCampaignForm({
      name: '',
      description: '',
      type: 'broadcast',
      templateId: '',
      message: '',
      targetSegments: [],
      scheduleDate: '',
      scheduleTime: ''
    })
  }

  const handleCampaignAction = async (campaignId: string, action: 'start' | 'pause' | 'stop' | 'delete') => {
    try {
      switch (action) {
        case 'start':
          setCampaigns(prev => prev.map(c => 
            c.id === campaignId ? { ...c, status: 'running' as const } : c
          ))
          break
        case 'pause':
          setCampaigns(prev => prev.map(c => 
            c.id === campaignId ? { ...c, status: 'paused' as const } : c
          ))
          break
        case 'stop':
          setCampaigns(prev => prev.map(c => 
            c.id === campaignId ? { ...c, status: 'completed' as const } : c
          ))
          break
        case 'delete':
          if (window.confirm('Are you sure you want to delete this campaign?')) {
            setCampaigns(prev => prev.filter(c => c.id !== campaignId))
          }
          break
      }
    } catch (error) {
      console.error('Error performing campaign action:', error)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!campaign.name.toLowerCase().includes(query) &&
          !campaign.description.toLowerCase().includes(query)) {
        return false
      }
    }
    
    if (statusFilter !== 'all' && campaign.status !== statusFilter) {
      return false
    }
    
    return true
  })

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (!selectedSession) {
    return (
      <div className="p-6 text-center">
        <Megaphone size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Session Selected
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please select a WhatsApp session to manage campaigns
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-48 rounded-xl"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Megaphone className="w-8 h-8 mr-3 text-orange-600" />
            Campaign Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create, manage, and track your WhatsApp marketing campaigns
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" icon={<BarChart3 size={16} />}>
            Analytics
          </Button>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            className="bg-orange-600 hover:bg-orange-700"
          >
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Megaphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{campaigns.length}</p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {campaigns.filter(c => c.status === 'running').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages Sent</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatNumber(campaigns.reduce((sum, c) => sum + c.stats.sent, 0))}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Open Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {campaigns.length > 0 
                  ? (campaigns.reduce((sum, c) => sum + (c.stats.read / Math.max(c.stats.sent, 1) * 100), 0) / campaigns.length).toFixed(1)
                  : 0
                }%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card variant="elevated">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search size={16} />}
                />
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="running">Running</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                
                <Button variant="outline" icon={<Filter size={16} />}>
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Grid */}
          {filteredCampaigns.length === 0 ? (
            <Card variant="elevated" className="text-center py-12">
              <div className="flex flex-col items-center">
                <Megaphone size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Campaigns Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first campaign to start reaching your audience
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus size={16} />}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Create Campaign
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredCampaigns.map((campaign, index) => {
                  const StatusIcon = statusIcons[campaign.status]
                  
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card variant="elevated" hover className="relative overflow-hidden">
                        <div className={cn(
                          'absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 transform translate-x-8 -translate-y-8',
                          campaign.status === 'running' && 'bg-green-500',
                          campaign.status === 'scheduled' && 'bg-blue-500',
                          campaign.status === 'completed' && 'bg-purple-500',
                          campaign.status === 'paused' && 'bg-yellow-500',
                          campaign.status === 'failed' && 'bg-red-500',
                          campaign.status === 'draft' && 'bg-gray-500'
                        )} />
                        
                        <CardContent className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {campaign.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {campaign.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {campaign.type}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                              >
                                <Eye size={16} />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                              >
                                <Edit size={16} />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                              <span className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
                                statusColors[campaign.status]
                              )}>
                                <StatusIcon size={12} />
                                <span>{getStatusText(campaign.status)}</span>
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Target:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatNumber(campaign.targeting.totalContacts)} contacts
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Sent:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatNumber(campaign.stats.sent)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Open Rate:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {campaign.stats.sent > 0 
                                  ? ((campaign.stats.read / campaign.stats.sent) * 100).toFixed(1)
                                  : 0
                                }%
                              </span>
                            </div>
                            
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                {campaign.status === 'draft' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCampaignAction(campaign.id, 'start')}
                                    className="flex-1"
                                    icon={<Play size={14} />}
                                  >
                                    Start
                                  </Button>
                                )}
                                
                                {campaign.status === 'running' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCampaignAction(campaign.id, 'pause')}
                                    className="flex-1"
                                    icon={<Pause size={14} />}
                                  >
                                    Pause
                                  </Button>
                                )}
                                
                                {campaign.status === 'paused' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCampaignAction(campaign.id, 'start')}
                                    className="flex-1"
                                    icon={<Play size={14} />}
                                  >
                                    Resume
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCampaignAction(campaign.id, 'delete')}
                                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                                  icon={<Trash2 size={14} />}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader title="Message Templates" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{template.category}</p>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        template.isApproved 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      )}>
                        {template.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-900 dark:text-white">{template.message}</p>
                    </div>
                    
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader title="Campaign Performance" />
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Advanced analytics coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Campaign"
        size="lg"
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Campaign Name"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              placeholder="Enter campaign name"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                placeholder="Describe your campaign"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campaign Type
              </label>
              <select
                value={campaignForm.type}
                onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="broadcast">Broadcast</option>
                <option value="drip">Drip Campaign</option>
                <option value="triggered">Triggered</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={campaignForm.message}
                onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                placeholder="Enter your message content"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Schedule Date"
                type="date"
                value={campaignForm.scheduleDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, scheduleDate: e.target.value })}
              />
              
              <Input
                label="Schedule Time"
                type="time"
                value={campaignForm.scheduleTime}
                onChange={(e) => setCampaignForm({ ...campaignForm, scheduleTime: e.target.value })}
              />
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCampaign}
            disabled={!campaignForm.name || !campaignForm.message}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Create Campaign
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
