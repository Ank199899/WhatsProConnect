'use client'

import React, { useState, useEffect } from 'react'
import { useSharedSessions } from '@/hooks/useSharedSessions'
import SessionsDebug from './SessionsDebug'
import {
  MessageSquare,
  Plus,
  FileText,
  Send,
  Users,
  Phone,
  Upload,
  Play,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
  Shuffle,
  Timer,
  Target,
  Zap,
  Shield,
  Calendar,
  Smile,
  User,
  RotateCcw,
  Activity,
  Rocket,
  Pause,
  Smartphone,
  BarChart3
} from 'lucide-react'

// Types
interface WhatsAppSession {
  id: string
  name: string
  phone: string
  status: 'connected' | 'disconnected' | 'connecting'
  qrCode?: string
  lastSeen?: string
}

interface Template {
  id: string
  name: string
  content: string
  variables: string[]
  category: string
  type?: string
  status?: string
  group_id?: string
  tags?: string[]
  mediaUrl?: string
  mediaType?: string
  usageCount?: number
}

interface TemplateGroup {
  id: string
  name: string
  description: string
  color: string
  icon: string
  is_active: boolean
  template_count: number
  templates?: Template[]
  created_at: string
  updated_at: string
}

interface Campaign {
  id: string
  name: string
  message: string
  targets: string[]
  selectedSessions: string[]
  templates: Template[]
  status: 'draft' | 'running' | 'paused' | 'completed' | 'scheduled'
  progress: number
  sent: number
  failed: number
  pending: number
  createdAt: string
  updatedAt: string
  scheduleTime?: string
  // Distribution settings
  sessionDistribution?: 'manual' | 'round-robin' | 'random' | 'load-balanced'
  templateDistribution?: 'manual' | 'round-robin' | 'random' | 'weighted'
  // Advanced settings
  delayBetweenMessages?: number
  batchSize?: number
  delayBetweenBatches?: number
  useRandomDelay?: boolean
  minDelay?: number
  maxDelay?: number
  messagePersonalization?: boolean
  autoRetry?: boolean
  retryAttempts?: number
  trackDelivery?: boolean
  enableAnalytics?: boolean
}

const BulkMessaging = () => {
  // Shared sessions hook for real-time sync
  const { sessions: sharedSessions, loading: sessionsLoading } = useSharedSessions()

  console.log('🔄 BulkMessaging: Shared sessions:', sharedSessions.length, sharedSessions)
  console.log('⏳ BulkMessaging: Sessions loading:', sessionsLoading)

  const [activeTab, setActiveTab] = useState<'create' | 'campaigns' | 'analytics'>('create')

  // Campaign Creation States
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [targets, setTargets] = useState('')
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [scheduleTime, setScheduleTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Dropdown states
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false)
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false)
  const [sessionSearchTerm, setSessionSearchTerm] = useState('')
  const [templateSearchTerm, setTemplateSearchTerm] = useState('')

  // Advanced features states
  const [messagePersonalization, setMessagePersonalization] = useState(true)
  const [autoRetry, setAutoRetry] = useState(true)
  const [retryAttempts, setRetryAttempts] = useState(3)
  const [trackDelivery, setTrackDelivery] = useState(true)
  const [enableAnalytics, setEnableAnalytics] = useState(true)
  const [messagePreview, setMessagePreview] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [costEstimate, setCostEstimate] = useState('')

  // Distribution strategies
  const [sessionDistribution, setSessionDistribution] = useState<'manual' | 'round-robin' | 'random' | 'load-balanced'>('manual')
  const [templateDistribution, setTemplateDistribution] = useState<'manual' | 'round-robin' | 'random' | 'weighted'>('manual')
  const [distributionPreview, setDistributionPreview] = useState<any[]>([])
  const [showDistributionPreview, setShowDistributionPreview] = useState(false)

  // Advanced Settings
  const [delayBetweenMessages, setDelayBetweenMessages] = useState(3)
  const [batchSize, setBatchSize] = useState(50)
  const [delayBetweenBatches, setDelayBetweenBatches] = useState(30)
  const [useRandomDelay, setUseRandomDelay] = useState(false)
  const [minDelay, setMinDelay] = useState(1)
  const [maxDelay, setMaxDelay] = useState(5)

  // Data States - Use shared sessions hook
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  // Use shared sessions directly (no need for local state)
  const [localSessions, setLocalSessions] = useState<any[]>([])
  const sessions = sharedSessions.length > 0 ? sharedSessions : localSessions

  // Fallback: Direct API call if shared sessions are empty
  useEffect(() => {
    if (sharedSessions.length === 0) {
      console.log('🔄 BulkMessaging: Shared sessions empty, making direct API call...')
      fetch('/api/whatsapp/sessions')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.sessions) {
            console.log('📡 BulkMessaging: Direct API response:', data.sessions)
            const formatted = data.sessions.map((session: any) => ({
              id: session.id || session.sessionId,
              name: session.name || `Session ${session.id}`,
              phone: session.phoneNumber || session.phone_number || 'Not connected',
              status: session.status === 'ready' ? 'connected' :
                     session.status === 'connected' ? 'connected' :
                     session.status === 'qr_code' ? 'connecting' :
                     session.status === 'scanning' ? 'connecting' : 'disconnected',
              lastSeen: session.lastActivity || session.created_at ?
                       new Date(session.lastActivity || session.created_at).toLocaleString() : 'Never',
              qrCode: session.qrCode || session.qr_code,
              isReady: session.isReady || session.is_active || false
            }))
            console.log('✅ BulkMessaging: Formatted local sessions:', formatted)
            setLocalSessions(formatted)
          }
        })
        .catch(err => console.error('❌ BulkMessaging: Direct API error:', err))
    }
  }, [sharedSessions.length])

  // Template Group States
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<string>('all')
  const [showGroupedView, setShowGroupedView] = useState(true)

  // Fetch Real-time Data
  useEffect(() => {
    fetchTemplates()
    fetchTemplateGroups()

    // Load saved campaigns
    const savedCampaigns = JSON.parse(localStorage.getItem('bulkCampaigns') || '[]')
    setCampaigns(savedCampaigns)
  }, [])

  // Auto-refresh templates every 30 seconds for real-time sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTemplates()
      fetchTemplateGroups()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Sessions are now handled by useSharedSessions hook

  // Fetch Templates from API
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (data.success && data.templates) {
        const formattedTemplates = data.templates.map((template: any) => ({
          id: template.id,
          name: template.name,
          content: template.content,
          variables: template.variables || [],
          category: template.category || 'General'
        }))
        setTemplates(formattedTemplates)
      } else {
        // Fallback to demo templates if API fails
        setTemplates([
          {
            id: 'demo_template1',
            name: 'Welcome Message',
            content: 'Hello {{name}}, welcome to our service! We are excited to have you on board.',
            variables: ['name'],
            category: 'Welcome'
          },
          {
            id: 'demo_template2',
            name: 'Promotional Offer',
            content: 'Hi {{name}}! Get {{discount}}% off on your next purchase. Use code: {{code}}',
            variables: ['name', 'discount', 'code'],
            category: 'Marketing'
          },
          {
            id: 'demo_template3',
            name: 'Order Update',
            content: 'Your order #{{orderNumber}} has been {{status}}. Track: {{trackingLink}}',
            variables: ['orderNumber', 'status', 'trackingLink'],
            category: 'Notifications'
          },
          {
            id: 'demo_template4',
            name: 'Support Follow-up',
            content: 'Hi {{name}}, how was your experience with our support team? Rate us: {{ratingLink}}',
            variables: ['name', 'ratingLink'],
            category: 'Support'
          },
          {
            id: 'demo_template5',
            name: 'Event Invitation',
            content: 'You are invited to {{eventName}} on {{date}} at {{venue}}. RSVP: {{rsvpLink}}',
            variables: ['eventName', 'date', 'venue', 'rsvpLink'],
            category: 'Events'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      // Fallback to demo templates
      setTemplates([
        {
          id: 'demo_template1',
          name: 'Welcome Message',
          content: 'Hello {{name}}, welcome to our service! We are excited to have you on board.',
          variables: ['name'],
          category: 'Welcome'
        },
        {
          id: 'demo_template2',
          name: 'Promotional Offer',
          content: 'Hi {{name}}! Get {{discount}}% off on your next purchase. Use code: {{code}}',
          variables: ['name', 'discount', 'code'],
          category: 'Marketing'
        },
        {
          id: 'demo_template3',
          name: 'Order Update',
          content: 'Your order #{{orderNumber}} has been {{status}}. Track: {{trackingLink}}',
          variables: ['orderNumber', 'status', 'trackingLink'],
          category: 'Notifications'
        },
        {
          id: 'demo_template4',
          name: 'Support Follow-up',
          content: 'Hi {{name}}, how was your experience with our support team? Rate us: {{ratingLink}}',
          variables: ['name', 'ratingLink'],
          category: 'Support'
        },
        {
          id: 'demo_template5',
          name: 'Event Invitation',
          content: 'You are invited to {{eventName}} on {{date}} at {{venue}}. RSVP: {{rsvpLink}}',
          variables: ['eventName', 'date', 'venue', 'rsvpLink'],
          category: 'Events'
        }
      ])
    }
  }

  // Fetch Template Groups from API
  const fetchTemplateGroups = async () => {
    try {
      const response = await fetch('/api/template-groups')
      const data = await response.json()

      if (data.success && data.groups) {
        setTemplateGroups(data.groups)
      } else {
        // Fallback to demo groups if API fails
        setTemplateGroups([
          {
            id: 'group_1',
            name: 'Welcome Messages',
            description: 'Templates for welcoming new customers',
            color: '#10B981',
            icon: 'user-plus',
            is_active: true,
            template_count: 2,
            created_at: '2024-01-01',
            updated_at: '2024-01-01'
          },
          {
            id: 'group_2',
            name: 'Promotions',
            description: 'Marketing and promotional templates',
            color: '#F59E0B',
            icon: 'tag',
            is_active: true,
            template_count: 2,
            created_at: '2024-01-01',
            updated_at: '2024-01-01'
          },
          {
            id: 'group_3',
            name: 'Support',
            description: 'Customer support templates',
            color: '#3B82F6',
            icon: 'headphones',
            is_active: true,
            template_count: 1,
            created_at: '2024-01-01',
            updated_at: '2024-01-01'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching template groups:', error)
      // Fallback to demo groups
      setTemplateGroups([
        {
          id: 'group_1',
          name: 'Welcome Messages',
          description: 'Templates for welcoming new customers',
          color: '#10B981',
          icon: 'user-plus',
          is_active: true,
          template_count: 2,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: 'group_2',
          name: 'Promotions',
          description: 'Marketing and promotional templates',
          color: '#F59E0B',
          icon: 'tag',
          is_active: true,
          template_count: 2,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ])
    }
  }

  // Helper Functions
  const getValidTargets = () => {
    return targets.split('\n').filter(line => {
      const phone = line.trim().replace(/\D/g, '') // Remove all non-digits
      // Valid if 10 digits (Indian) or 12 digits (with country code)
      return phone && (phone.length === 10 || phone.length === 12)
    }).map(line => {
      const phone = line.trim().replace(/\D/g, '')
      // Add country code if missing
      return phone.length === 10 ? '91' + phone : phone
    })
  }

  // Filter functions for dropdowns
  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(sessionSearchTerm.toLowerCase()) ||
    session.phone.toLowerCase().includes(sessionSearchTerm.toLowerCase())
  )

  console.log('🔍 BulkMessaging: Sessions array:', sessions)
  console.log('🔍 BulkMessaging: Filtered sessions:', filteredSessions)
  console.log('🔍 BulkMessaging: Session search term:', sessionSearchTerm)

  const filteredTemplates = templates.filter(template => {
    // Search filter
    const matchesSearch = template.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(templateSearchTerm.toLowerCase())

    // Group filter
    const matchesGroup = selectedTemplateGroup === 'all' ||
      template.group_id === selectedTemplateGroup ||
      (!template.group_id && selectedTemplateGroup === 'ungrouped')

    return matchesSearch && matchesGroup
  })

  // Group templates by group for display
  const groupedTemplates = templateGroups.reduce((acc, group) => {
    acc[group.id] = templates.filter(t => t.group_id === group.id)
    return acc
  }, {} as Record<string, Template[]>)

  // Ungrouped templates
  const ungroupedTemplates = templates.filter(t => !t.group_id)

  // Calculate estimates
  useEffect(() => {
    const validTargets = getValidTargets()
    const totalMessages = validTargets.length * (selectedTemplates.length || 1)

    // Estimate time based on delays and batch settings
    const messagesPerBatch = batchSize
    const totalBatches = Math.ceil(totalMessages / messagesPerBatch)
    const timePerMessage = useRandomDelay ? (minDelay + maxDelay) / 2 : delayBetweenMessages
    const timePerBatch = messagesPerBatch * timePerMessage
    const totalBatchDelay = (totalBatches - 1) * delayBetweenBatches * 60
    const totalTimeSeconds = (totalBatches * timePerBatch) + totalBatchDelay

    const hours = Math.floor(totalTimeSeconds / 3600)
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60)
    const seconds = Math.floor(totalTimeSeconds % 60)

    let timeString = ''
    if (hours > 0) timeString += `${hours}h `
    if (minutes > 0) timeString += `${minutes}m `
    if (seconds > 0 || timeString === '') timeString += `${seconds}s`

    setEstimatedTime(timeString.trim())

    // Cost estimate (example: ₹0.50 per message)
    const costPerMessage = 0.50
    const totalCost = totalMessages * costPerMessage
    setCostEstimate(`₹${totalCost.toFixed(2)}`)

  }, [targets, selectedTemplates, batchSize, delayBetweenMessages, delayBetweenBatches, useRandomDelay, minDelay, maxDelay])

  // Generate message preview
  useEffect(() => {
    if (message.trim()) {
      let preview = message
      // Replace common variables with sample data
      preview = preview.replace(/\{\{name\}\}/g, 'John Doe')
      preview = preview.replace(/\{\{phone\}\}/g, '+91 98765 43210')
      preview = preview.replace(/\{\{company\}\}/g, 'Your Company')
      preview = preview.replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
      setMessagePreview(preview)
    } else if (selectedTemplates.length > 0) {
      const firstTemplate = templates.find(t => t.id === selectedTemplates[0])
      if (firstTemplate) {
        let preview = firstTemplate.content
        // Replace variables with sample data
        firstTemplate.variables.forEach(variable => {
          const sampleData = {
            name: 'John Doe',
            phone: '+91 98765 43210',
            company: 'Your Company',
            date: new Date().toLocaleDateString(),
            orderNumber: 'ORD123456',
            amount: '₹1,299',
            discount: '20',
            code: 'SAVE20'
          }
          preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), sampleData[variable] || `[${variable}]`)
        })
        setMessagePreview(preview)
      }
    } else {
      setMessagePreview('')
    }
  }, [message, selectedTemplates, templates])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setIsSessionDropdownOpen(false)
        setIsTemplateDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Distribution Logic Functions
  const generateDistributionPreview = () => {
    const validTargets = getValidTargets()
    if (validTargets.length === 0 || selectedSessions.length === 0) {
      setDistributionPreview([])
      return
    }

    const availableSessions = sessions.filter(s => selectedSessions.includes(s.id))
    const availableTemplates = selectedTemplates.length > 0
      ? templates.filter(t => selectedTemplates.includes(t.id))
      : [{ id: 'custom', name: 'Custom Message', content: message }]

    const preview = validTargets.slice(0, 10).map((target, index) => {
      let assignedSession
      let assignedTemplate

      // Session Distribution Logic
      switch (sessionDistribution) {
        case 'round-robin':
          assignedSession = availableSessions[index % availableSessions.length]
          break
        case 'random':
          assignedSession = availableSessions[Math.floor(Math.random() * availableSessions.length)]
          break
        case 'load-balanced':
          // Simple load balancing - distribute evenly
          const sessionIndex = Math.floor((index / validTargets.length) * availableSessions.length)
          assignedSession = availableSessions[Math.min(sessionIndex, availableSessions.length - 1)]
          break
        default: // manual
          assignedSession = availableSessions[0]
      }

      // Template Distribution Logic
      switch (templateDistribution) {
        case 'round-robin':
          assignedTemplate = availableTemplates[index % availableTemplates.length]
          break
        case 'random':
          assignedTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)]
          break
        case 'weighted':
          // Simple weighted distribution - could be enhanced with actual weights
          const weights = availableTemplates.map(() => 1) // Equal weights for now
          const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
          const randomWeight = Math.random() * totalWeight
          let currentWeight = 0
          for (let i = 0; i < availableTemplates.length; i++) {
            currentWeight += weights[i]
            if (randomWeight <= currentWeight) {
              assignedTemplate = availableTemplates[i]
              break
            }
          }
          break
        default: // manual
          assignedTemplate = availableTemplates[0]
      }

      return {
        target,
        session: assignedSession,
        template: assignedTemplate,
        index: index + 1
      }
    })

    setDistributionPreview(preview)
  }

  // Update distribution preview when settings change
  useEffect(() => {
    if (showDistributionPreview) {
      generateDistributionPreview()
    }
  }, [sessionDistribution, templateDistribution, selectedSessions, selectedTemplates, targets, showDistributionPreview])

  // Shuffle array function for random distribution
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const createCampaign = async () => {
    const targetList = getValidTargets()
    const hasMessage = message.trim() || selectedTemplates.length > 0

    if (!campaignName.trim()) {
      alert('❌ Please enter a campaign name')
      return
    }

    if (!hasMessage) {
      alert('❌ Please enter a message or select templates')
      return
    }

    if (targetList.length === 0) {
      alert('❌ Please enter valid phone numbers')
      return
    }

    if (selectedSessions.length === 0) {
      alert('❌ Please select at least one WhatsApp session')
      return
    }

    // Check if selected sessions are connected
    const connectedSessions = sessions.filter(s =>
      selectedSessions.includes(s.id) && s.status === 'connected'
    )

    if (connectedSessions.length === 0) {
      alert('❌ No connected WhatsApp sessions selected. Please select connected sessions.')
      return
    }

    setIsLoading(true)

    try {
      const campaignTemplates = selectedTemplates.map(id =>
        templates.find(t => t.id === id)!
      ).filter(Boolean)

      const newCampaign: Campaign = {
        id: `campaign_${Date.now()}`,
        name: campaignName,
        message: message,
        targets: targetList,
        selectedSessions: selectedSessions,
        templates: campaignTemplates,
        status: scheduleTime ? 'scheduled' : 'pending',
        progress: 0,
        sent: 0,
        failed: 0,
        pending: targetList.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scheduleTime: scheduleTime || undefined,
        // Distribution settings
        sessionDistribution: sessionDistribution,
        templateDistribution: templateDistribution,
        // Advanced settings
        delayBetweenMessages: delayBetweenMessages,
        batchSize: batchSize,
        delayBetweenBatches: delayBetweenBatches,
        useRandomDelay: useRandomDelay,
        minDelay: minDelay,
        maxDelay: maxDelay,
        messagePersonalization: messagePersonalization,
        autoRetry: autoRetry,
        retryAttempts: retryAttempts,
        trackDelivery: trackDelivery,
        enableAnalytics: enableAnalytics
      }

      const existingCampaigns = JSON.parse(localStorage.getItem('bulkCampaigns') || '[]')
      const updatedCampaigns = [...existingCampaigns, newCampaign]
      localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))
      setCampaigns(updatedCampaigns)

      // Reset form
      setCampaignName('')
      setMessage('')
      setTargets('')
      setSelectedSessions([])
      setSelectedTemplates([])
      setScheduleTime('')
      setActiveTab('campaigns')

      // Show success message with details
      const successMessage = `🎉 Campaign "${newCampaign.name}" created successfully!

📊 Campaign Details:
• Total Messages: ${targetList.length}
• Connected Sessions: ${connectedSessions.length}
• Templates: ${campaignTemplates.length || 1}
• Session Distribution: ${sessionDistribution}
• Template Distribution: ${templateDistribution}
• Status: ${newCampaign.status}
${scheduleTime ? `• Scheduled: ${new Date(scheduleTime).toLocaleString()}` : '• Ready to launch immediately'}

🚀 Your campaign is ready!`

      alert(successMessage)

    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCampaign = (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId)
      setCampaigns(updatedCampaigns)
      localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))
    }
  }

  const pauseCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.map(c =>
      c.id === campaignId ? { ...c, status: 'paused' as const, updatedAt: new Date().toISOString() } : c
    )
    setCampaigns(updatedCampaigns)
    localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))
  }

  const resumeCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.map(c =>
      c.id === campaignId ? { ...c, status: 'running' as const, updatedAt: new Date().toISOString() } : c
    )
    setCampaigns(updatedCampaigns)
    localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))
  }

  // Start/Execute Campaign Function
  const startCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) {
      alert('❌ Campaign not found')
      return
    }

    if (campaign.status === 'running') {
      alert('⚠️ Campaign is already running')
      return
    }

    // Update campaign status to running
    const updatedCampaigns = campaigns.map(c =>
      c.id === campaignId
        ? { ...c, status: 'running' as const, updatedAt: new Date().toISOString() }
        : c
    )
    setCampaigns(updatedCampaigns)
    localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))

    console.log('🚀 Starting campaign:', campaign.name)
    console.log('📱 Targets:', campaign.targets)
    console.log('📝 Message:', campaign.message)
    console.log('📝 Message length:', campaign.message?.length)
    console.log('📝 Message type:', typeof campaign.message)
    console.log('📝 Message empty check:', !campaign.message || campaign.message.trim() === '')
    console.log('🔗 Selected Sessions:', campaign.selectedSessions)

    // Validate campaign data before starting
    const hasDirectMessage = campaign.message && campaign.message.trim() !== ''
    const hasTemplates = campaign.templates && campaign.templates.length > 0

    if (!hasDirectMessage && !hasTemplates) {
      console.error('❌ Campaign has no message or templates!')
      alert('❌ Campaign has no message or templates! Please check your campaign setup.')
      return
    }

    console.log('✅ Campaign validation passed:', {
      hasDirectMessage,
      hasTemplates,
      templatesCount: campaign.templates?.length || 0
    })
    console.log('📊 Campaign Details:', {
      id: campaign.id,
      name: campaign.name,
      targetCount: campaign.targets.length,
      sessionCount: campaign.selectedSessions.length,
      status: campaign.status
    })

    try {
      // Get connected sessions
      const connectedSessions = sessions.filter(s =>
        campaign.selectedSessions.includes(s.id) && s.status === 'connected'
      )

      console.log('🔍 Available sessions:', sessions.map(s => ({ id: s.id, name: s.name, status: s.status })))
      console.log('🎯 Selected sessions:', campaign.selectedSessions)
      console.log('✅ Connected sessions:', connectedSessions.map(s => ({ id: s.id, name: s.name })))

      if (connectedSessions.length === 0) {
        alert('❌ No connected sessions available for this campaign.\nPlease ensure your WhatsApp sessions are connected.')

        // Update campaign status to failed
        const updatedCampaigns = campaigns.map(c =>
          c.id === campaignId
            ? { ...c, status: 'failed' as const, updatedAt: new Date().toISOString() }
            : c
        )
        setCampaigns(updatedCampaigns)
        localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))
        return
      }

      console.log('✅ Connected sessions:', connectedSessions.length)

      // Process each target
      let sentCount = 0
      let failedCount = 0

      for (let i = 0; i < campaign.targets.length; i++) {
        const target = campaign.targets[i]
        const sessionIndex = i % connectedSessions.length
        const session = connectedSessions[sessionIndex]

        console.log(`📤 Sending to ${target} via ${session.name}`)
        console.log(`🔍 Session details:`, {
          id: session.id,
          name: session.name,
          phone: session.phone,
          status: session.status,
          isConnected: session.status === 'connected'
        })

        // Validate session
        if (!session.id || session.status !== 'connected') {
          failedCount++
          console.error(`❌ Invalid session for ${target}:`, {
            sessionId: session.id,
            sessionStatus: session.status,
            sessionName: session.name
          })
          continue
        }

        try {
          // Format phone number (ensure it starts with country code)
          let formattedNumber = target.replace(/\D/g, '') // Remove non-digits
          if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber // Add India country code
          }

          console.log(`📤 Sending to ${target} (formatted: ${formattedNumber}) via ${session.name}`)

          // Send message via API
          const apiUrl = `${window.location.origin}/api/whatsapp/send-message`
          console.log(`🌐 API URL: ${apiUrl}`)

          // Determine message to send (template or direct message)
          let messageToSend = campaign.message

          // If campaign has templates but no direct message, use first template
          if ((!messageToSend || messageToSend.trim() === '') && campaign.templates && campaign.templates.length > 0) {
            const firstTemplate = campaign.templates[0]
            messageToSend = firstTemplate.content
            console.log(`📝 Using template message: ${firstTemplate.name}`)
          }

          const requestPayload = {
            sessionId: session.id,
            phoneNumber: formattedNumber,
            message: messageToSend
          }

          console.log(`📤 Request payload:`, requestPayload)
          console.log(`🔍 Payload validation:`, {
            hasSessionId: !!requestPayload.sessionId,
            hasPhoneNumber: !!requestPayload.phoneNumber,
            hasMessage: !!requestPayload.message,
            sessionIdType: typeof requestPayload.sessionId,
            phoneNumberType: typeof requestPayload.phoneNumber,
            messageType: typeof requestPayload.message,
            sessionIdValue: requestPayload.sessionId,
            phoneNumberValue: requestPayload.phoneNumber,
            messageValue: requestPayload.message?.substring(0, 50)
          })

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
          })

          const result = await response.json()
          console.log(`📋 API Response for ${target}:`, {
            status: response.status,
            ok: response.ok,
            result: result
          })

          if (response.ok && result.success) {
            sentCount++
            console.log(`✅ Message sent to ${target} - MessageID: ${result.messageId}`)
          } else {
            failedCount++
            console.error(`❌ Failed to send to ${target}:`, {
              status: response.status,
              statusText: response.statusText,
              error: result.error || result.message || 'Unknown error',
              fullResponse: result
            })
          }
        } catch (error) {
          failedCount++
          console.error(`❌ Network error sending to ${target}:`, {
            error: error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            target: target,
            sessionId: session.id,
            sessionName: session.name
          })
        }

        // Update campaign progress
        const progress = Math.round(((i + 1) / campaign.targets.length) * 100)
        const updatedCampaignsProgress = campaigns.map(c =>
          c.id === campaignId
            ? {
                ...c,
                sentCount,
                failedCount,
                progress,
                status: (i + 1) === campaign.targets.length ? 'completed' as const : 'running' as const,
                updatedAt: new Date().toISOString()
              }
            : c
        )
        setCampaigns(updatedCampaignsProgress)
        localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaignsProgress))

        // Add delay between messages (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Final campaign status update
      const finalCampaigns = campaigns.map(c =>
        c.id === campaignId
          ? {
              ...c,
              status: 'completed' as const,
              progress: 100,
              sent: sentCount,
              failed: failedCount,
              pending: 0,
              updatedAt: new Date().toISOString()
            }
          : c
      )
      setCampaigns(finalCampaigns)
      localStorage.setItem('bulkCampaigns', JSON.stringify(finalCampaigns))

      console.log(`🎉 Campaign completed! Sent: ${sentCount}, Failed: ${failedCount}`)
      alert(`🎉 Campaign completed!\n✅ Sent: ${sentCount}\n❌ Failed: ${failedCount}`)

    } catch (error) {
      console.error('❌ Campaign execution error:', error)
      alert('❌ Campaign execution failed. Please try again.')

      // Update campaign status to failed
      const updatedCampaigns = campaigns.map(c =>
        c.id === campaignId
          ? { ...c, status: 'failed' as const, updatedAt: new Date().toISOString() }
          : c
      )
      setCampaigns(updatedCampaigns)
      localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))
    }
  }

  // Render Create Campaign Form
  const renderCreateCampaign = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Create New Campaign</h2>
          <p className="text-gray-600">Set up your bulk messaging campaign with advanced features</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          {sessions.filter(s => s.status === 'connected').length} sessions connected
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Name */}
          <div className="bg-gray-50 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Enter campaign name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Message Content */}
          <div className="bg-gray-50 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Content
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here... You can use variables like {{name}}, {{phone}}, etc."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="mt-2 text-sm text-gray-500">
              Tip: Use variables like {`{{name}}, {{phone}}`} for personalization
            </div>
          </div>

          {/* Advanced Templates Selector */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Message Templates
              </label>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {templates.length} Available
              </span>
            </div>

            {/* Custom Dropdown */}
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-700">
                  {selectedTemplates.length === 0
                    ? 'Choose templates...'
                    : `${selectedTemplates.length} template${selectedTemplates.length > 1 ? 's' : ''} selected`
                  }
                </span>
                <div className="flex items-center gap-2">
                  {selectedTemplates.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {selectedTemplates.length}
                    </span>
                  )}
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isTemplateDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                  {/* Search Bar & Group Filter */}
                  <div className="p-3 border-b border-gray-200 space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search templates..."
                        value={templateSearchTerm}
                        onChange={(e) => setTemplateSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {/* Group Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Group:</span>
                      <select
                        value={selectedTemplateGroup}
                        onChange={(e) => setSelectedTemplateGroup(e.target.value)}
                        className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Templates</option>
                        {templateGroups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name} ({group.template_count})
                          </option>
                        ))}
                        <option value="ungrouped">Ungrouped ({ungroupedTemplates.length})</option>
                      </select>
                      <button
                        onClick={() => setShowGroupedView(!showGroupedView)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          showGroupedView
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                        title={showGroupedView ? 'Switch to list view' : 'Switch to grouped view'}
                      >
                        {showGroupedView ? '📁' : '📄'}
                      </button>
                    </div>
                  </div>

                  {/* Templates List */}
                  <div className="max-h-60 overflow-y-auto">
                    {filteredTemplates.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        No templates found
                      </div>
                    ) : showGroupedView && selectedTemplateGroup === 'all' ? (
                      // Grouped View
                      <div className="space-y-1">
                        {templateGroups.map(group => {
                          const groupTemplates = groupedTemplates[group.id] || []
                          if (groupTemplates.length === 0) return null

                          return (
                            <div key={group.id}>
                              {/* Group Header */}
                              <div
                                className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2"
                                style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
                              >
                                <span className="text-sm font-medium text-gray-700">{group.name}</span>
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                  {groupTemplates.length}
                                </span>
                              </div>

                              {/* Group Templates */}
                              {groupTemplates.map((template) => (
                                <div
                                  key={template.id}
                                  className={`p-3 pl-8 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                                    selectedTemplates.includes(template.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedTemplates(prev =>
                                      prev.includes(template.id)
                                        ? prev.filter(id => id !== template.id)
                                        : [...prev, template.id]
                                    )
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={selectedTemplates.includes(template.id)}
                                        onChange={() => {}}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      {template.category}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 line-clamp-1 ml-6">{template.content}</p>
                                  {template.variables && template.variables.length > 0 && (
                                    <div className="mt-1 ml-6 flex flex-wrap gap-1">
                                      {template.variables.slice(0, 2).map(variable => (
                                        <span key={variable} className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                          {`{{${variable}}}`}
                                        </span>
                                      ))}
                                      {template.variables.length > 2 && (
                                        <span className="text-xs text-gray-500">+{template.variables.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        })}

                        {/* Ungrouped Templates */}
                        {ungroupedTemplates.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 border-l-4 border-l-gray-400">
                              <span className="text-sm font-medium text-gray-700">Ungrouped</span>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                {ungroupedTemplates.length}
                              </span>
                            </div>
                            {ungroupedTemplates.map((template) => (
                              <div
                                key={template.id}
                                className={`p-3 pl-8 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                                  selectedTemplates.includes(template.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                                onClick={() => {
                                  setSelectedTemplates(prev =>
                                    prev.includes(template.id)
                                      ? prev.filter(id => id !== template.id)
                                      : [...prev, template.id]
                                  )
                                }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedTemplates.includes(template.id)}
                                      onChange={() => {}}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
                                  </div>
                                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {template.category}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-1 ml-6">{template.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // List View
                      filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                            selectedTemplates.includes(template.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => {
                            setSelectedTemplates(prev =>
                              prev.includes(template.id)
                                ? prev.filter(id => id !== template.id)
                                : [...prev, template.id]
                            )
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedTemplates.includes(template.id)}
                                onChange={() => {}}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <h4 className="font-medium text-gray-900">{template.name}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              {template.group_id && (
                                <span
                                  className="text-xs px-2 py-1 rounded text-white"
                                  style={{
                                    backgroundColor: templateGroups.find(g => g.id === template.group_id)?.color || '#6B7280'
                                  }}
                                >
                                  {templateGroups.find(g => g.id === template.group_id)?.name || 'Group'}
                                </span>
                              )}
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {template.category}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 ml-6">{template.content}</p>
                          {template.variables && template.variables.length > 0 && (
                            <div className="mt-2 ml-6 flex flex-wrap gap-1">
                              {template.variables.slice(0, 3).map(variable => (
                                <span key={variable} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  {`{{${variable}}}`}
                                </span>
                              ))}
                              {template.variables.length > 3 && (
                                <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          fetchTemplates()
                          fetchTemplateGroups()
                        }}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Refresh
                      </button>
                      <span className="text-xs text-gray-500">
                        {templates.length} templates, {templateGroups.length} groups
                      </span>
                    </div>
                    <button
                      onClick={() => setIsTemplateDropdownOpen(false)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Template Distribution Strategy */}
            {selectedTemplates.length > 0 && (
              <div className="mt-4 bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-blue-600" />
                  Template Distribution Strategy
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTemplateDistribution('manual')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      templateDistribution === 'manual'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">Manual</div>
                    <div className="text-xs text-gray-500">Use first template</div>
                  </button>
                  <button
                    onClick={() => setTemplateDistribution('round-robin')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      templateDistribution === 'round-robin'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">Round Robin</div>
                    <div className="text-xs text-gray-500">Rotate templates</div>
                  </button>
                  <button
                    onClick={() => setTemplateDistribution('random')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      templateDistribution === 'random'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">Random</div>
                    <div className="text-xs text-gray-500">Random selection</div>
                  </button>
                  <button
                    onClick={() => setTemplateDistribution('weighted')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      templateDistribution === 'weighted'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">Weighted</div>
                    <div className="text-xs text-gray-500">Smart distribution</div>
                  </button>
                </div>

                {/* Distribution Info */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    {templateDistribution === 'manual' && '📝 All messages will use the first selected template'}
                    {templateDistribution === 'round-robin' && '🔄 Templates will be rotated evenly across all messages'}
                    {templateDistribution === 'random' && '🎲 Each message will get a randomly selected template'}
                    {templateDistribution === 'weighted' && '⚖️ Templates will be distributed based on smart weights'}
                  </div>
                </div>
              </div>
            )}

            {/* Selected Templates Preview */}
            {selectedTemplates.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Templates:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplates.map((templateId, index) => {
                    const template = templates.find(t => t.id === templateId)
                    if (!template) return null

                    return (
                      <div key={template.id} className="bg-white border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{template.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {template.category}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedTemplates(prev => prev.filter(id => id !== template.id))
                          }}
                          className="text-red-500 hover:text-red-700 ml-1"
                          title="Remove template"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Target Numbers */}
          <div className="bg-gray-50 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Phone Numbers *
            </label>
            <textarea
              value={targets}
              onChange={(e) => setTargets(e.target.value)}
              placeholder="Enter phone numbers (one per line)&#10;+91 98765 43210&#10;+91 87654 32109&#10;+91 76543 21098"
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Valid numbers: {getValidTargets().length}
              </span>
              <button className="text-green-600 hover:text-green-700 flex items-center gap-1">
                <Upload className="w-4 h-4" />
                Import CSV
              </button>
            </div>
          </div>

          {/* Distribution Settings */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Smart Distribution Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Distribution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-600" />
                  Session Distribution Strategy
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'manual', label: 'Manual', desc: 'Use first session only', icon: '📱' },
                    { value: 'round-robin', label: 'Round Robin', desc: 'Rotate sessions evenly', icon: '🔄' },
                    { value: 'random', label: 'Random', desc: 'Random session selection', icon: '🎲' },
                    { value: 'load-balanced', label: 'Load Balanced', desc: 'Even distribution', icon: '⚖️' }
                  ].map((strategy) => (
                    <label key={strategy.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors">
                      <input
                        type="radio"
                        name="sessionDistribution"
                        value={strategy.value}
                        checked={sessionDistribution === strategy.value}
                        onChange={(e) => setSessionDistribution(e.target.value as any)}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{strategy.icon}</span>
                          <span className="font-medium text-gray-800">{strategy.label}</span>
                        </div>
                        <div className="text-xs text-gray-600">{strategy.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Template Distribution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Template Distribution Strategy
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'manual', label: 'Manual', desc: 'Use first template only', icon: '📝' },
                    { value: 'round-robin', label: 'Round Robin', desc: 'Rotate templates evenly', icon: '🔄' },
                    { value: 'random', label: 'Random', desc: 'Random template selection', icon: '🎲' },
                    { value: 'weighted', label: 'Weighted', desc: 'Smart distribution', icon: '⚖️' }
                  ].map((strategy) => (
                    <label key={strategy.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors">
                      <input
                        type="radio"
                        name="templateDistribution"
                        value={strategy.value}
                        checked={templateDistribution === strategy.value}
                        onChange={(e) => setTemplateDistribution(e.target.value as any)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{strategy.icon}</span>
                          <span className="font-medium text-gray-800">{strategy.label}</span>
                        </div>
                        <div className="text-xs text-gray-600">{strategy.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribution Info */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Strategy:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Sessions: </span>
                  <span className="font-medium text-green-700 capitalize">{sessionDistribution.replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Templates: </span>
                  <span className="font-medium text-blue-700 capitalize">{templateDistribution.replace('-', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gray-50 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="mt-2 text-sm text-gray-500">
              Leave empty to start immediately
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Advanced WhatsApp Sessions Selector */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                WhatsApp Sessions
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">{sessions.filter(s => s.status === 'connected').length}</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {sessions.length} Total
                </span>
              </div>
            </div>

            {/* Custom Sessions Dropdown */}
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:ring-2 focus:ring-green-500 focus:border-transparent flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-700">
                  {selectedSessions.length === 0
                    ? 'Select WhatsApp accounts...'
                    : `${selectedSessions.length} account${selectedSessions.length > 1 ? 's' : ''} selected`
                  }
                </span>
                <div className="flex items-center gap-2">
                  {selectedSessions.length > 0 && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {selectedSessions.length}
                    </span>
                  )}
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${isSessionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isSessionDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                  {/* Search Bar */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search sessions..."
                        value={sessionSearchTerm}
                        onChange={(e) => setSessionSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Sessions List */}
                  <div className="max-h-60 overflow-y-auto">
                    {sessionsLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                        Loading sessions...
                      </div>
                    ) : filteredSessions.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        No sessions found
                      </div>
                    ) : (
                      filteredSessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-4 border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors ${
                            selectedSessions.includes(session.id) ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                          } ${session.status !== 'connected' ? 'opacity-50' : ''}`}
                          onClick={() => {
                            if (session.status === 'connected') {
                              setSelectedSessions(prev =>
                                prev.includes(session.id)
                                  ? prev.filter(id => id !== session.id)
                                  : [...prev, session.id]
                              )
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedSessions.includes(session.id)}
                                disabled={session.status !== 'connected'}
                                onChange={() => {}}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                              />
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  session.status === 'connected' ? 'bg-green-500' :
                                  session.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                <div>
                                  <h4 className="font-medium text-gray-900">{session.name}</h4>
                                  <p className="text-sm text-gray-600">{session.phone}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                session.status === 'connected' ? 'bg-green-100 text-green-800' :
                                session.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {session.status}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">{session.lastSeen}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <button
                      onClick={() => {
                        console.log('🔄 Manual refresh triggered')
                        fetch('/api/whatsapp/sessions')
                          .then(res => res.json())
                          .then(data => {
                            if (data.success && data.sessions) {
                              const formatted = data.sessions.map((session: any) => ({
                                id: session.id || session.sessionId,
                                name: session.name || `Session ${session.id}`,
                                phone: session.phoneNumber || session.phone_number || 'Not connected',
                                status: session.status === 'ready' ? 'connected' :
                                       session.status === 'connected' ? 'connected' :
                                       session.status === 'qr_code' ? 'connecting' :
                                       session.status === 'scanning' ? 'connecting' : 'disconnected',
                                lastSeen: session.lastActivity || session.created_at ?
                                         new Date(session.lastActivity || session.created_at).toLocaleString() : 'Never',
                                qrCode: session.qrCode || session.qr_code,
                                isReady: session.isReady || session.is_active || false
                              }))
                              setLocalSessions(formatted)
                            }
                          })
                      }}
                      className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => setIsSessionDropdownOpen(false)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Session Distribution Strategy */}
            {selectedSessions.length > 0 && (
              <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  Session Distribution Strategy
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSessionDistribution('manual')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      sessionDistribution === 'manual'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-medium">Manual</div>
                    <div className="text-xs text-gray-500">Use first session</div>
                  </button>
                  <button
                    onClick={() => setSessionDistribution('round-robin')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      sessionDistribution === 'round-robin'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-medium">Round Robin</div>
                    <div className="text-xs text-gray-500">Rotate sessions</div>
                  </button>
                  <button
                    onClick={() => setSessionDistribution('random')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      sessionDistribution === 'random'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-medium">Random</div>
                    <div className="text-xs text-gray-500">Random selection</div>
                  </button>
                  <button
                    onClick={() => setSessionDistribution('load-balanced')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      sessionDistribution === 'load-balanced'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-medium">Load Balanced</div>
                    <div className="text-xs text-gray-500">Even distribution</div>
                  </button>
                </div>

                {/* Distribution Info */}
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800">
                    {sessionDistribution === 'manual' && '📱 All messages will be sent from the first selected session'}
                    {sessionDistribution === 'round-robin' && '🔄 Sessions will be rotated evenly for each message'}
                    {sessionDistribution === 'random' && '🎲 Each message will be sent from a randomly selected session'}
                    {sessionDistribution === 'load-balanced' && '⚖️ Messages will be distributed evenly across all sessions'}
                  </div>
                </div>
              </div>
            )}

            {/* Selected Sessions Preview */}
            {selectedSessions.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Sessions:</h4>
                <div className="space-y-2">
                  {selectedSessions.map((sessionId, index) => {
                    const session = sessions.find(s => s.id === sessionId)
                    if (!session) return null

                    return (
                      <div key={session.id} className="bg-white border border-green-200 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            #{index + 1}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            session.status === 'connected' ? 'bg-green-500' :
                            session.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <div className="font-medium text-sm text-gray-800">{session.name}</div>
                            <div className="text-xs text-gray-600">{session.phone}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSessions(prev => prev.filter(id => id !== session.id))
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Advanced Settings
            </h3>
            <div className="space-y-4">
              {/* Timing Controls */}
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-purple-600" />
                  Timing Controls
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay Between Messages
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="60"
                        value={delayBetweenMessages}
                        onChange={(e) => setDelayBetweenMessages(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">{delayBetweenMessages}s</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Size
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">{batchSize}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay Between Batches
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="120"
                        value={delayBetweenBatches}
                        onChange={(e) => setDelayBetweenBatches(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">{delayBetweenBatches}m</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="randomDelay"
                      checked={useRandomDelay}
                      onChange={(e) => setUseRandomDelay(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="randomDelay" className="text-sm text-gray-700 flex items-center gap-1">
                      <Shuffle className="w-4 h-4" />
                      Use Random Delays
                    </label>
                  </div>

                  {useRandomDelay && (
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Min (sec)</label>
                        <input
                          type="number"
                          value={minDelay}
                          onChange={(e) => setMinDelay(Number(e.target.value))}
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Max (sec)</label>
                        <input
                          type="number"
                          value={maxDelay}
                          onChange={(e) => setMaxDelay(Number(e.target.value))}
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Smart Features */}
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  Smart Features
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Message Personalization
                    </label>
                    <input
                      type="checkbox"
                      checked={messagePersonalization}
                      onChange={(e) => setMessagePersonalization(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Auto Retry Failed
                    </label>
                    <input
                      type="checkbox"
                      checked={autoRetry}
                      onChange={(e) => setAutoRetry(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>

                  {autoRetry && (
                    <div className="pl-6">
                      <label className="block text-xs text-gray-600 mb-1">Retry Attempts</label>
                      <input
                        type="number"
                        value={retryAttempts}
                        onChange={(e) => setRetryAttempts(Number(e.target.value))}
                        min="1"
                        max="5"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Track Delivery
                    </label>
                    <input
                      type="checkbox"
                      checked={trackDelivery}
                      onChange={(e) => setTrackDelivery(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Enable Analytics
                    </label>
                    <input
                      type="checkbox"
                      checked={enableAnalytics}
                      onChange={(e) => setEnableAnalytics(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Preview & Estimates */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Campaign Preview
            </h3>

            {/* Message Preview */}
            {messagePreview && (
              <div className="bg-white rounded-lg p-4 border border-orange-100 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Smile className="w-4 h-4 text-orange-600" />
                  Message Preview
                </h4>
                <div className="bg-green-100 rounded-lg p-3 text-sm text-gray-800 border-l-4 border-green-500">
                  {messagePreview}
                </div>
              </div>
            )}

            {/* Campaign Estimates */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                Campaign Estimates
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Messages:</span>
                  <span className="font-medium text-gray-800">
                    {getValidTargets().length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Time:</span>
                  <span className="font-medium text-gray-800">{estimatedTime || 'Calculating...'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Cost:</span>
                  <span className="font-medium text-gray-800">{costEstimate || 'Calculating...'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sessions Used:</span>
                  <span className="font-medium text-gray-800">{selectedSessions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Templates Used:</span>
                  <span className="font-medium text-gray-800">{selectedTemplates.length || 1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Session Strategy:</span>
                  <span className="font-medium text-gray-800 capitalize">{sessionDistribution}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Template Strategy:</span>
                  <span className="font-medium text-gray-800 capitalize">{templateDistribution}</span>
                </div>
              </div>
            </div>

            {/* Distribution Preview */}
            {(selectedSessions.length > 0 && getValidTargets().length > 0) && (
              <div className="bg-white rounded-lg p-4 border border-orange-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-600" />
                    Distribution Preview
                  </h4>
                  <button
                    onClick={() => {
                      setShowDistributionPreview(!showDistributionPreview)
                      if (!showDistributionPreview) {
                        generateDistributionPreview()
                      }
                    }}
                    className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
                  >
                    {showDistributionPreview ? 'Hide' : 'Show'} Preview
                    <svg className={`w-4 h-4 transition-transform ${showDistributionPreview ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showDistributionPreview && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {distributionPreview.length > 0 ? (
                      <>
                        {distributionPreview.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-800">#{item.index} {item.target}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {item.session?.name}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {item.template?.name}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              Session: {item.session?.phone} | Template: {item.template?.category}
                            </div>
                          </div>
                        ))}
                        {getValidTargets().length > 10 && (
                          <div className="text-center text-sm text-gray-500 py-2">
                            ... and {getValidTargets().length - 10} more messages
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        No distribution data available
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={createCampaign}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Launch Campaign
                </>
              )}
            </button>

            <button
              onClick={() => {
                setCampaignName('')
                setMessage('')
                setTargets('')
                setSelectedSessions([])
                setSelectedTemplates([])
                setScheduleTime('')
                setSessionSearchTerm('')
                setTemplateSearchTerm('')
              }}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300"
            >
              <RotateCcw className="w-5 h-5" />
              Reset Form
            </button>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const sampleNumbers = [
                    '+91 98765 43210',
                    '+91 87654 32109',
                    '+91 76543 21098',
                    '+91 65432 10987',
                    '+91 54321 09876'
                  ]
                  setTargets(sampleNumbers.join('\n'))
                }}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Users className="w-4 h-4" />
                Sample Numbers
              </button>
              <button
                onClick={() => {
                  const connectedSessions = sessions.filter(s => s.status === 'connected').map(s => s.id)
                  setSelectedSessions(connectedSessions)
                }}
                className="bg-green-100 hover:bg-green-200 text-green-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Smartphone className="w-4 h-4" />
                All Connected
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Debug Component */}
        <SessionsDebug />

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-8 mb-8 mt-4">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Advanced Bulk Messaging
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Multi-session WhatsApp messaging with intelligent distribution
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 mb-8 overflow-hidden">
          <div className="flex bg-gradient-to-r from-green-50 to-emerald-50">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-8 py-6 font-semibold text-base transition-all duration-300 relative ${
                activeTab === 'create'
                  ? 'text-green-700 bg-white shadow-lg border-b-4 border-green-500'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`p-2 rounded-lg ${activeTab === 'create' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Plus className="w-5 h-5" />
                </div>
                <span>Create Campaign</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex-1 px-8 py-6 font-semibold text-base transition-all duration-300 relative ${
                activeTab === 'campaigns'
                  ? 'text-green-700 bg-white shadow-lg border-b-4 border-green-500'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`p-2 rounded-lg ${activeTab === 'campaigns' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span>Manage Campaigns</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'create' && (
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
              {renderCreateCampaign()}
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Manage Campaigns</h2>
                  <p className="text-gray-600">Monitor and control your bulk messaging campaigns</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Total: {campaigns.length} campaigns
                  </div>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Campaign
                  </button>
                </div>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                  <p className="text-gray-600 mb-4">Create your first bulk messaging campaign to get started</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create Campaign
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            campaign.status === 'running' ? 'bg-green-500' :
                            campaign.status === 'paused' ? 'bg-yellow-500' :
                            campaign.status === 'completed' ? 'bg-blue-500' :
                            campaign.status === 'scheduled' ? 'bg-purple-500' :
                            campaign.status === 'pending' ? 'bg-orange-500' :
                            campaign.status === 'draft' ? 'bg-orange-500' :
                            'bg-gray-400'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                            <p className="text-sm text-gray-600">
                              Created {new Date(campaign.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'running' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            campaign.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                            campaign.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            campaign.status === 'draft' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                          <div className="flex items-center gap-1">
                            {(campaign.status === 'pending' || campaign.status === 'draft') && (
                              <button
                                onClick={() => startCampaign(campaign.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Start Campaign"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {campaign.status === 'running' && (
                              <button
                                onClick={() => pauseCampaign(campaign.id)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                title="Pause Campaign"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            )}
                            {campaign.status === 'paused' && (
                              <button
                                onClick={() => resumeCampaign(campaign.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Resume Campaign"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteCampaign(campaign.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete Campaign"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Sent</span>
                          </div>
                          <div className="text-2xl font-bold text-green-900">{campaign.sent}</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Pending</span>
                          </div>
                          <div className="text-2xl font-bold text-yellow-900">{campaign.pending}</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Failed</span>
                          </div>
                          <div className="text-2xl font-bold text-red-900">{campaign.failed}</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Total</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-900">{campaign.targets.length}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm text-gray-600">{campaign.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${campaign.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p className="mb-1">
                          <strong>Sessions:</strong> {campaign.selectedSessions.length} selected
                        </p>
                        <p className="mb-1">
                          <strong>Templates:</strong> {campaign.templates.length} templates
                        </p>
                        {campaign.scheduleTime && (
                          <p className="mb-1">
                            <strong>Scheduled:</strong> {new Date(campaign.scheduleTime).toLocaleString()}
                          </p>
                        )}
                        <p className="line-clamp-2">
                          <strong>Message:</strong> {campaign.message || 'Using templates'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkMessaging
