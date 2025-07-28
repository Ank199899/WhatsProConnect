'use client'

import React, { useState, useEffect } from 'react'
import {
  Send,
  Users,
  Phone,
  MessageSquare,
  Upload,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Plus,
  Trash2,
  Settings,
  Shuffle,
  Timer,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Shield,
  Globe,
  Layers,
  Calendar,
  Smile,
  User,
  RotateCcw,
  Activity,
  RefreshCw,
  Filter,
  BarChart3,
  TrendingUp,
  Wifi,
  WifiOff,
  Smartphone,
  Gauge,
  Network,
  ArrowRight,
  Star,
  HelpCircle,
  Rocket,
  Pause
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface Session {
  id: string
  name: string
  phoneNumber?: string
  status: string
  isActive: boolean
  qrCode?: string
  lastActivity?: string
  messagesSent?: number
  messagesReceived?: number
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor'
  batteryLevel?: number
  deviceInfo?: string
}

interface BulkMessagingProps {
  sessions?: Session[]
  sessionsLoading?: boolean
}

interface Template {
  id: string
  name: string
  content: string
  variables: string[]
  category: string
  mediaUrl?: string
  mediaType?: 'image' | 'video' | 'audio' | 'document'
  mediaFilename?: string
  isActive?: boolean
  usageCount?: number
  lastUsed?: string
  tags?: string[]
  priority?: 'high' | 'medium' | 'low'
}

interface Campaign {
  id: string
  name: string
  message: string
  templates: Template[]
  targets: string[]
  selectedSessions: string[] // Changed to support multiple sessions
  status: 'draft' | 'running' | 'completed' | 'paused' | 'scheduled'
  progress: number
  sent: number
  failed: number
  pending: number
  createdAt: string
  updatedAt: string
  scheduledAt?: string
  completedAt?: string

  // Template Selection Strategy
  useRandomTemplates: boolean
  useRoundRobinTemplates: boolean
  templateSelectionMode: 'sequential' | 'random' | 'round-robin' | 'weighted'

  // Session Selection Strategy
  useRandomSessions: boolean
  useRoundRobinSessions: boolean
  sessionSelectionMode: 'sequential' | 'random' | 'round-robin' | 'load-balanced'

  // Target Selection
  useRandomTargets: boolean
  randomTargetCount?: number
  targetSelectionMode: 'all' | 'random' | 'filtered'

  // Timing & Delays
  delayBetweenMessages: number
  delayBetweenBatches: number
  delayBetweenSessions: number

  // Anti-blocking features
  useRandomDelay: boolean
  minDelay: number
  maxDelay: number
  useUserAgent: boolean
  useProxyRotation: boolean
  batchSize: number
  batchDelay: number
  useSpintax: boolean
  useEmojis: boolean
  usePersonalization: boolean
  useTypingSimulation: boolean
  useReadReceipts: boolean
  useOnlineStatus: boolean

  // Advanced Anti-blocking
  humanBehaviorSimulation: boolean
  randomMessageOrder: boolean
  sessionRotationInterval: number
  cooldownPeriod: number
  maxMessagesPerSession: number
  maxMessagesPerHour: number
  respectBusinessHours: boolean
  businessHoursStart: string
  businessHoursEnd: string

  // Scheduling
  scheduleTime?: string
  timezone: string
  repeatSchedule?: 'none' | 'daily' | 'weekly' | 'monthly'

  // Analytics
  openRate?: number
  responseRate?: number
  deliveryRate?: number
  bounceRate?: number

  // Filters & Conditions
  targetFilters?: {
    includeKeywords?: string[]
    excludeKeywords?: string[]
    minLength?: number
    maxLength?: number
    phoneNumberPattern?: string
  }
}

const BulkMessaging: React.FC<BulkMessagingProps> = ({
  sessions = [],
  sessionsLoading = false
}) => {
  // Theme hook
  const { colors, isDark } = useTheme()

  // Main States
  const [activeTab, setActiveTab] = useState<'create' | 'campaigns' | 'analytics'>('create')
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [targets, setTargets] = useState('')
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Multi-Selection States
  const [sessionSelectionMode, setSessionSelectionMode] = useState<'single' | 'multiple' | 'all'>('single')
  const [templateSelectionMode, setTemplateSelectionMode] = useState<'sequential' | 'random' | 'round-robin' | 'weighted'>('sequential')
  const [sessionDistributionMode, setSessionDistributionMode] = useState<'sequential' | 'random' | 'round-robin' | 'load-balanced'>('round-robin')

  // UI States
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showSessionSelector, setShowSessionSelector] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showTargetImporter, setShowTargetImporter] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)

  // Template States
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateGroups, setTemplateGroups] = useState<any[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<string>('')
  const [useRandomTemplates, setUseRandomTemplates] = useState(false)
  const [useRoundRobinTemplates, setUseRoundRobinTemplates] = useState(true)

  // Target States
  const [useRandomTargets, setUseRandomTargets] = useState(false)
  const [randomTargetCount, setRandomTargetCount] = useState(100)
  const [targetSelectionMode, setTargetSelectionMode] = useState<'all' | 'random' | 'filtered'>('all')

  // Timing States
  const [delayBetweenMessages, setDelayBetweenMessages] = useState(2)
  const [delayBetweenBatches, setDelayBetweenBatches] = useState(30)
  const [delayBetweenSessions, setDelayBetweenSessions] = useState(10)

  // Basic Anti-blocking States
  const [useRandomDelay, setUseRandomDelay] = useState(true)
  const [minDelay, setMinDelay] = useState(1)
  const [maxDelay, setMaxDelay] = useState(5)
  const [useUserAgent, setUseUserAgent] = useState(true)
  const [useProxyRotation, setUseProxyRotation] = useState(false)
  const [batchSize, setBatchSize] = useState(50)
  const [batchDelay, setBatchDelay] = useState(300)
  const [useSpintax, setUseSpintax] = useState(true)
  const [useEmojis, setUseEmojis] = useState(true)
  const [usePersonalization, setUsePersonalization] = useState(true)

  // Advanced Anti-blocking States
  const [useTypingSimulation, setUseTypingSimulation] = useState(true)
  const [useReadReceipts, setUseReadReceipts] = useState(false)
  const [useOnlineStatus, setUseOnlineStatus] = useState(true)
  const [humanBehaviorSimulation, setHumanBehaviorSimulation] = useState(true)
  const [randomMessageOrder, setRandomMessageOrder] = useState(false)
  const [sessionRotationInterval, setSessionRotationInterval] = useState(100)
  const [cooldownPeriod, setCooldownPeriod] = useState(60)
  const [maxMessagesPerSession, setMaxMessagesPerSession] = useState(200)
  const [maxMessagesPerHour, setMaxMessagesPerHour] = useState(500)

  // Business Hours States
  const [respectBusinessHours, setRespectBusinessHours] = useState(false)
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00')
  const [businessHoursEnd, setBusinessHoursEnd] = useState('18:00')

  // Scheduling States
  const [scheduleTime, setScheduleTime] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [repeatSchedule, setRepeatSchedule] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none')

  // UI Control States
  const [showAntiBlockingOptions, setShowAntiBlockingOptions] = useState(false)
  const [showTimingOptions, setShowTimingOptions] = useState(false)
  const [showBusinessHours, setShowBusinessHours] = useState(false)

  // Load templates from API with real-time sync
  const loadTemplates = async () => {
    try {
      console.log('🔄 Loading templates from API...')
      const response = await fetch('/api/templates')
      if (response.ok) {
        const apiResponse = await response.json()
        console.log('📋 API Response:', apiResponse)

        // Handle both direct array and object with templates property
        const apiTemplates = apiResponse.templates || apiResponse

        if (apiTemplates && Array.isArray(apiTemplates) && apiTemplates.length > 0) {
          const formattedTemplates = apiTemplates.map((t: any) => ({
            id: t.id,
            name: t.name,
            content: t.content,
            variables: Array.isArray(t.variables) ? t.variables : JSON.parse(t.variables || '[]'),
            category: t.category || 'general'
          }))

          console.log('✅ Templates loaded successfully:', formattedTemplates.length)
          setTemplates(formattedTemplates)
          return
        }
      }
    } catch (error) {
      console.log('❌ API templates not available, using defaults:', error)
    }
  }

  // Load template groups from API
  const loadTemplateGroups = async () => {
    try {
      console.log('🔄 Loading template groups from API...')
      const response = await fetch('/api/template-groups')
      if (response.ok) {
        const apiResponse = await response.json()
        if (apiResponse.success && Array.isArray(apiResponse.groups)) {
          console.log(`✅ Loaded ${apiResponse.groups.length} template groups from API`)
          setTemplateGroups(apiResponse.groups)
        } else {
          console.warn('⚠️ Template groups API response format unexpected:', apiResponse)
          setTemplateGroups([])
        }
      } else {
        console.error('❌ Failed to load template groups from API:', response.status)
        setTemplateGroups([])
      }
    } catch (error) {
      console.error('❌ Error loading template groups:', error)
      setTemplateGroups([])
    }

    // Fallback to default templates with anti-blocking variations
    const defaultTemplates: Template[] = [
      {
        id: 'template-1',
        name: 'Welcome Message',
        content: '{Hello|Hi|Hey} {{name}}, {welcome to|glad to have you in} our service! We are {excited|thrilled|happy} to have you on board. 🎉',
        variables: ['name'],
        category: 'welcome'
      },
      {
        id: 'template-2',
        name: 'Promotional Offer',
        content: '{Hi|Hello} {{name}}! {Special|Exclusive|Limited} offer just for you - Get {{discount}}% off on your next purchase. Use code: {{code}} 🛍️',
        variables: ['name', 'discount', 'code'],
        category: 'promotion'
      },
      {
        id: 'template-3',
        name: 'Order Confirmation',
        content: 'Dear {{name}}, your order #{{orderNumber}} has been {confirmed|processed|received}. Total amount: ₹{{amount}}. Expected delivery: {{date}} 📦',
        variables: ['name', 'orderNumber', 'amount', 'date'],
        category: 'order'
      },
      {
        id: 'template-4',
        name: 'Reminder Message',
        content: '{Hi|Hello} {{name}}, this is a {friendly|gentle|quick} reminder about {{event}} scheduled for {{date}}. {Don\'t miss out|See you there}! ⏰',
        variables: ['name', 'event', 'date'],
        category: 'reminder'
      },
      {
        id: 'template-5',
        name: 'Thank You Message',
        content: '{Thank you|Thanks} {{name}} for {choosing|using} our service! Your feedback {means a lot|is valuable} to us. Rate us: {{rating_link}} ⭐',
        variables: ['name', 'rating_link'],
        category: 'thankyou'
      },
      {
        id: 'template-6',
        name: 'Follow Up',
        content: '{Hi|Hello} {{name}}, {just checking in|following up} on your recent {purchase|order}. {How was your experience|Any feedback}? 💬',
        variables: ['name'],
        category: 'followup'
      },
      {
        id: 'template-7',
        name: 'Birthday Wishes',
        content: '🎂 {Happy Birthday|Many happy returns} {{name}}! {Hope you have|Wishing you} a {wonderful|fantastic|amazing} day! Special birthday discount: {{discount}}% 🎁',
        variables: ['name', 'discount'],
        category: 'birthday'
      }
    ]
    setTemplates(defaultTemplates)
  }

  // Initialize templates with real-time sync
  useEffect(() => {
    console.log('🚀 Initializing templates and groups...')
    loadTemplates()
    loadTemplateGroups()

    // Set up real-time sync every 30 seconds
    const interval = setInterval(() => {
      console.log('⏰ Auto-syncing templates and groups...')
      loadTemplates()
      loadTemplateGroups()
    }, 30000)

    return () => {
      console.log('🛑 Cleaning up template sync interval')
      clearInterval(interval)
    }
  }, [])

  // Force refresh templates function
  const refreshTemplates = async () => {
    console.log('🔄 Manual template refresh triggered')
    await loadTemplates()
  }

  // Auto-select first available session (only once)
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      const readySession = sessions.find(s => s.status === 'ready' || s.status === 'connected')
      if (readySession) {
        setSelectedSession(readySession.id)
      }
    }
  }, [sessions.length, selectedSession]) // Only depend on sessions.length to prevent unnecessary re-renders

  // Parse targets
  const targetList = targets.split('\n').filter(line => line.trim()).map(line => line.trim())
  const validTargets = targetList.filter(target => /^\+?[1-9]\d{1,14}$/.test(target.replace(/\s/g, '')))

  // Handle file upload for bulk numbers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const numbers = text.split(/[\n,;]/).map(num => num.trim()).filter(num => num)
      setTargets(numbers.join('\n'))
    }
    reader.readAsText(file)
  }

  // Get random selection from array
  const getRandomSelection = (array: any[], count: number) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, array.length))
  }

  // Anti-blocking functions
  const getRandomDelay = () => {
    if (!useRandomDelay) return delayBetweenMessages * 1000
    return (Math.random() * (maxDelay - minDelay) + minDelay) * 1000
  }

  const processSpintax = (text: string) => {
    if (!useSpintax) return text

    return text.replace(/\{([^}]+)\}/g, (match, options) => {
      const choices = options.split('|')
      return choices[Math.floor(Math.random() * choices.length)]
    })
  }

  const addRandomEmojis = (text: string) => {
    if (!useEmojis) return text

    const emojis = ['😊', '👍', '🎉', '💯', '✨', '🚀', '💪', '🔥', '⭐', '🎯', '💝', '🌟']
    const shouldAddEmoji = Math.random() > 0.7 // 30% chance

    if (shouldAddEmoji) {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
      return `${text} ${randomEmoji}`
    }

    return text
  }

  const personalizeMessage = (text: string, target: string) => {
    if (!usePersonalization) return text

    // Extract name from phone number (basic personalization)
    const timeOfDay = new Date().getHours()
    let greeting = 'Hello'

    if (timeOfDay < 12) greeting = 'Good morning'
    else if (timeOfDay < 17) greeting = 'Good afternoon'
    else greeting = 'Good evening'

    // Replace generic greetings with time-based ones
    return text.replace(/^(Hi|Hello|Hey)/i, greeting)
  }

  const generateUserAgent = () => {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0'
    ]
    return userAgents[Math.floor(Math.random() * userAgents.length)]
  }

  // Replace template variables with sample data
  const replaceTemplateVariables = (template: Template) => {
    let content = template.content
    const sampleData: { [key: string]: string } = {
      name: 'Customer',
      discount: '20',
      code: 'SAVE20',
      orderNumber: 'ORD123456',
      amount: '1999',
      date: new Date().toLocaleDateString(),
      event: 'Meeting',
      rating_link: 'https://example.com/rate'
    }

    template.variables.forEach(variable => {
      const value = sampleData[variable] || `{{${variable}}}`
      content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value)
    })

    return content
  }

  // Create new campaign
  const createCampaign = async () => {
    // Validation
    const targetList = targets.split('\n').filter(line => line.trim())
    const hasMessage = message.trim() || selectedTemplates.length > 0

    if (!campaignName.trim()) {
      alert('Please enter a campaign name')
      return
    }

    if (!hasMessage) {
      alert('Please enter a message or select templates')
      return
    }

    if (targetList.length === 0) {
      alert('Please enter target phone numbers')
      return
    }

    if (selectedSessions.length === 0) {
      alert('Please select at least one WhatsApp session')
      return
    }

    if (useRandomTargets && randomTargetCount > targetList.length) {
      alert(`Random target count (${randomTargetCount}) cannot be more than total targets (${targetList.length})`)
      return
    }

    setIsLoading(true)

    try {
      // Get selected templates
      const campaignTemplates = selectedTemplates.map(id =>
        templates.find(t => t.id === id)!
      ).filter(Boolean)

      // Determine final targets
      const finalTargets = targetSelectionMode === 'random'
        ? getRandomSelection(targetList, randomTargetCount)
        : targetList

      const newCampaign: Campaign = {
        id: `campaign_${Date.now()}`,
        name: campaignName,
        message: message,
        templates: campaignTemplates,
        targets: finalTargets,
        selectedSessions: selectedSessions,
        status: scheduleTime ? 'scheduled' : 'draft',
        progress: 0,
        sent: 0,
        failed: 0,
        pending: finalTargets.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scheduledAt: scheduleTime || undefined,

        // Template Selection Strategy
        useRandomTemplates: templateSelectionMode === 'random',
        useRoundRobinTemplates: templateSelectionMode === 'round-robin',
        templateSelectionMode: templateSelectionMode,

        // Session Selection Strategy
        useRandomSessions: sessionDistributionMode === 'random',
        useRoundRobinSessions: sessionDistributionMode === 'round-robin',
        sessionSelectionMode: sessionDistributionMode,

        // Target Selection
        useRandomTargets: targetSelectionMode === 'random',
        randomTargetCount: targetSelectionMode === 'random' ? randomTargetCount : undefined,
        targetSelectionMode: targetSelectionMode,

        // Timing & Delays
        delayBetweenMessages: delayBetweenMessages,
        delayBetweenBatches: delayBetweenBatches,
        delayBetweenSessions: delayBetweenSessions,

        // Basic Anti-blocking features
        useRandomDelay: useRandomDelay,
        minDelay: minDelay,
        maxDelay: maxDelay,
        useUserAgent: useUserAgent,
        useProxyRotation: useProxyRotation,
        batchSize: batchSize,
        batchDelay: batchDelay,
        useSpintax: useSpintax,
        useEmojis: useEmojis,
        usePersonalization: usePersonalization,

        // Advanced Anti-blocking
        useTypingSimulation: useTypingSimulation,
        useReadReceipts: useReadReceipts,
        useOnlineStatus: useOnlineStatus,
        humanBehaviorSimulation: humanBehaviorSimulation,
        randomMessageOrder: randomMessageOrder,
        sessionRotationInterval: sessionRotationInterval,
        cooldownPeriod: cooldownPeriod,
        maxMessagesPerSession: maxMessagesPerSession,
        maxMessagesPerHour: maxMessagesPerHour,

        // Business Hours
        respectBusinessHours: respectBusinessHours,
        businessHoursStart: businessHoursStart,
        businessHoursEnd: businessHoursEnd,

        // Scheduling
        scheduleTime: scheduleTime || undefined,
        timezone: timezone,
        repeatSchedule: repeatSchedule,

        // Analytics (will be calculated)
        openRate: 0,
        responseRate: 0,
        deliveryRate: 0,
        bounceRate: 0
      }

      // Save to localStorage for now
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
      setIsLoading(false)
      setActiveTab('campaigns')

      alert(`Campaign "${newCampaign.name}" created successfully with ${finalTargets.length} targets and ${selectedSessions.length} sessions!`)

    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function for random selection
  const getRandomSelection = (array: any[], count: number) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  // Campaign management functions
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

  const deleteCampaign = (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId)
      setCampaigns(updatedCampaigns)
      localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))
    }
  }

  // Load campaigns from localStorage
  useEffect(() => {
    const savedCampaigns = JSON.parse(localStorage.getItem('bulkCampaigns') || '[]')
    setCampaigns(savedCampaigns)
  }, [])

  // Start campaign with advanced anti-blocking features
  const startCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) return

    setIsLoading(true)

    // Update campaign status
    const updatedCampaigns = campaigns.map(c =>
      c.id === campaignId ? { ...c, status: 'running' as const } : c
    )
    setCampaigns(updatedCampaigns)
    localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))

    // Advanced batch processing with anti-blocking
    let sent = 0
    let failed = 0
    const batchSize = campaign.batchSize || 50
    const targets = campaign.targets

    for (let batchStart = 0; batchStart < targets.length; batchStart += batchSize) {
      const batch = targets.slice(batchStart, batchStart + batchSize)

      // Process batch with random delays
      for (let i = 0; i < batch.length; i++) {
        const target = batch[i]
        const globalIndex = batchStart + i

        // Determine message to send with anti-blocking
        let messageToSend = campaign.message
        let selectedTemplate: any = null

        // If using templates, select random template or use all
        if (campaign.templates.length > 0) {
          if (campaign.useRandomTemplates) {
            // Select random template for each message
            selectedTemplate = campaign.templates[Math.floor(Math.random() * campaign.templates.length)]
            messageToSend = replaceTemplateVariables(selectedTemplate)
          } else {
            // Use templates in sequence
            const templateIndex = globalIndex % campaign.templates.length
            selectedTemplate = campaign.templates[templateIndex]
            messageToSend = replaceTemplateVariables(selectedTemplate)
          }
        }

        // Apply anti-blocking transformations
        messageToSend = processSpintax(messageToSend)
        messageToSend = personalizeMessage(messageToSend, target)
        messageToSend = addRandomEmojis(messageToSend)

        try {
          // Prepare headers with anti-blocking
          const headers: any = { 'Content-Type': 'application/json' }
          if (campaign.useUserAgent) {
            headers['User-Agent'] = generateUserAgent()
          }

          // Check if template has media
          let response
          if (selectedTemplate && selectedTemplate.mediaUrl && selectedTemplate.mediaType) {
            console.log('📎 Sending message with media:', {
              mediaType: selectedTemplate.mediaType,
              mediaUrl: selectedTemplate.mediaUrl,
              message: messageToSend
            })

            // Send message with media
            response = await fetch('/api/messages/send-media', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify({
                sessionId: campaign.selectedSession,
                to: target,
                mediaType: selectedTemplate.mediaType,
                mediaUrl: selectedTemplate.mediaUrl,
                caption: messageToSend,
                filename: selectedTemplate.mediaFilename || 'media',
                antiBlocking: {
                  useRandomDelay: campaign.useRandomDelay,
                  useUserAgent: campaign.useUserAgent,
                  useProxyRotation: campaign.useProxyRotation
                }
              })
            })
          } else {
            // Send text-only message
            response = await fetch('/api/messages/send', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify({
                sessionId: campaign.selectedSession,
                to: target,
                message: messageToSend,
                antiBlocking: {
                  useRandomDelay: campaign.useRandomDelay,
                  useUserAgent: campaign.useUserAgent,
                  useProxyRotation: campaign.useProxyRotation
                }
              })
            })
          }

          if (response.ok) {
            sent++
          } else {
            failed++
          }
        } catch (error) {
          failed++
        }

        // Update progress
        const progress = ((globalIndex + 1) / targets.length) * 100
        const updatedCampaigns = campaigns.map(c =>
          c.id === campaignId ? {
            ...c,
            progress: Math.round(progress),
            sent: sent,
            failed: failed,
            status: progress === 100 ? 'completed' as const : 'running' as const
          } : c
        )
        setCampaigns(updatedCampaigns)
        localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))

        // Smart delay with anti-blocking
        const delay = getRandomDelay()
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      // Batch delay to avoid rate limiting
      if (batchStart + batchSize < targets.length) {
        await new Promise(resolve => setTimeout(resolve, campaign.batchDelay * 1000))
      }
    }

    setIsLoading(false)
  }

  // Delete campaign
  const deleteCampaign = (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId)
      setCampaigns(updatedCampaigns)
      localStorage.setItem('bulkCampaigns', JSON.stringify(updatedCampaigns))
    }
  }

  return (
    <div
      className="min-h-screen p-6 transition-colors duration-300"
      style={{
        background: `linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 50%, ${colors.background.tertiary} 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Modern Header with Theme Colors */}
        <div
          className="rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden transition-colors duration-300"
          style={{
            backgroundColor: colors.background.secondary,
            border: `1px solid ${colors.border}40`
          }}
        >
          {/* Background Pattern */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${colors.primary}05, ${colors.accent}05)`
            }}
          ></div>
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-32 translate-x-32"
            style={{
              background: `linear-gradient(to bottom left, ${colors.primary}20, transparent)`
            }}
          ></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div
                  className="p-4 rounded-2xl shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                  }}
                >
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1
                    className="text-4xl font-bold transition-colors duration-300"
                    style={{ color: colors.text.primary }}
                  >
                    Advanced Bulk Messaging
                  </h1>
                  <p
                    className="text-lg mt-1 transition-colors duration-300"
                    style={{ color: colors.text.secondary }}
                  >
                    Multi-session WhatsApp messaging with intelligent distribution
                  </p>
                </div>
              </div>

              {/* Real-time Stats */}
              <div className="flex space-x-6">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <Smartphone className="w-5 h-5 text-green-600 mr-2" />
                    <div className="text-2xl font-bold text-green-600">{sessions.length}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">Active Sessions</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="w-5 h-5 text-blue-600 mr-2" />
                    <div className="text-2xl font-bold text-blue-600">{campaigns.filter(c => c.status === 'running').length}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">Running Campaigns</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                    <div className="text-2xl font-bold text-purple-600">{campaigns.filter(c => c.status === 'completed').length}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">Completed</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-3 mt-6">
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg">
                <Rocket className="w-4 h-4 mr-2" />
                Quick Start
              </button>
              <button className="flex items-center px-4 py-2 bg-white text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button className="flex items-center px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </button>
            </div>
          </div>
        </div>

        {/* Modern Navigation Tabs */}
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
              {activeTab === 'create' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-green-500 rounded-t-full"></div>
              )}
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
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-bold">
                  {campaigns.length}
                </span>
              </div>
              {activeTab === 'campaigns' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-green-500 rounded-t-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-8 py-6 font-semibold text-base transition-all duration-300 relative ${
                activeTab === 'analytics'
                  ? 'text-green-700 bg-white shadow-lg border-b-4 border-green-500'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`p-2 rounded-lg ${activeTab === 'analytics' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span>Analytics</span>
              </div>
              {activeTab === 'analytics' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-green-500 rounded-t-full"></div>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'create' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Campaign Setup */}
              <div className="xl:col-span-2 space-y-8">
                {/* Campaign Basic Info */}
                <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-green-100 rounded-xl mr-4">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Campaign Information</h3>
                      <p className="text-gray-600">Set up your bulk messaging campaign</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Campaign Name *
                      </label>
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="Enter a descriptive campaign name..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 font-medium"
                      />
                    </div>

                    {/* Multi-Session Selector */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        WhatsApp Sessions *
                      </label>

                      {/* Session Selection Mode */}
                      <div className="flex space-x-3 mb-4">
                        <button
                          onClick={() => setSessionSelectionMode('single')}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            sessionSelectionMode === 'single'
                              ? 'bg-green-500 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 inline mr-2" />
                          Single Session
                        </button>
                        <button
                          onClick={() => setSessionSelectionMode('multiple')}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            sessionSelectionMode === 'multiple'
                              ? 'bg-green-500 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Network className="w-4 h-4 inline mr-2" />
                          Multi-Session
                        </button>
                        <button
                          onClick={() => {
                            setSessionSelectionMode('all')
                            setSelectedSessions(sessions.filter(s => s.isActive).map(s => s.id))
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            sessionSelectionMode === 'all'
                              ? 'bg-green-500 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Globe className="w-4 h-4 inline mr-2" />
                          All Active
                        </button>
                      </div>

                      {/* Session Distribution Strategy */}
                      {sessionSelectionMode === 'multiple' && (
                        <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                          <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Distribution Strategy
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setSessionDistributionMode('round-robin')}
                              className={`p-3 rounded-lg text-left transition-colors ${
                                sessionDistributionMode === 'round-robin'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white text-gray-700 hover:bg-green-100'
                              }`}
                            >
                              <RotateCcw className="w-4 h-4 mb-1" />
                              <div className="font-medium">Round Robin</div>
                              <div className="text-xs opacity-75">Rotate sessions evenly</div>
                            </button>
                            <button
                              onClick={() => setSessionDistributionMode('random')}
                              className={`p-3 rounded-lg text-left transition-colors ${
                                sessionDistributionMode === 'random'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white text-gray-700 hover:bg-green-100'
                              }`}
                            >
                              <Shuffle className="w-4 h-4 mb-1" />
                              <div className="font-medium">Random</div>
                              <div className="text-xs opacity-75">Random session selection</div>
                            </button>
                            <button
                              onClick={() => setSessionDistributionMode('load-balanced')}
                              className={`p-3 rounded-lg text-left transition-colors ${
                                sessionDistributionMode === 'load-balanced'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white text-gray-700 hover:bg-green-100'
                              }`}
                            >
                              <Gauge className="w-4 h-4 mb-1" />
                              <div className="font-medium">Load Balanced</div>
                              <div className="text-xs opacity-75">Based on session load</div>
                            </button>
                            <button
                              onClick={() => setSessionDistributionMode('sequential')}
                              className={`p-3 rounded-lg text-left transition-colors ${
                                sessionDistributionMode === 'sequential'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white text-gray-700 hover:bg-green-100'
                              }`}
                            >
                              <ArrowRight className="w-4 h-4 mb-1" />
                              <div className="font-medium">Sequential</div>
                              <div className="text-xs opacity-75">One by one in order</div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Session List */}
                      {sessionsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                          <p className="text-gray-600 font-medium">Loading sessions...</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {sessions.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl">
                              <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500 font-medium">No sessions available</p>
                              <p className="text-gray-400 text-sm">Connect WhatsApp sessions first</p>
                            </div>
                          ) : (
                            sessions.map((session) => (
                              <div
                                key={session.id}
                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                  selectedSessions.includes(session.id)
                                    ? 'border-green-500 bg-green-50 shadow-lg'
                                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                                }`}
                                onClick={() => {
                                  if (sessionSelectionMode === 'single') {
                                    setSelectedSessions([session.id])
                                  } else if (sessionSelectionMode === 'multiple') {
                                    if (selectedSessions.includes(session.id)) {
                                      setSelectedSessions(selectedSessions.filter(id => id !== session.id))
                                    } else {
                                      setSelectedSessions([...selectedSessions, session.id])
                                    }
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${
                                      session.isActive ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                      {session.isActive ? (
                                        <Wifi className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <WifiOff className="w-5 h-5 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-900">{session.name}</div>
                                      <div className="text-sm text-gray-600">{session.phoneNumber}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      session.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {session.status}
                                    </span>
                                    {selectedSessions.includes(session.id) && (
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Templates Section */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-green-600" />
                          Message Templates
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Real-time Sync
                          </span>
                        </div>
                        <button
                          onClick={refreshTemplates}
                          className="flex items-center text-xs bg-green-100 text-green-800 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors font-medium"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Refresh
                        </button>
                      </label>

                      {/* Template Selection Strategy */}
                      <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                          Template Selection Strategy
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setTemplateSelectionMode('sequential')}
                            className={`p-3 rounded-lg text-left transition-colors ${
                              templateSelectionMode === 'sequential'
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-green-100'
                            }`}
                          >
                            <ArrowRight className="w-4 h-4 mb-1" />
                            <div className="font-medium">Sequential</div>
                            <div className="text-xs opacity-75">Use templates in order</div>
                          </button>
                          <button
                            onClick={() => setTemplateSelectionMode('random')}
                            className={`p-3 rounded-lg text-left transition-colors ${
                              templateSelectionMode === 'random'
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-green-100'
                            }`}
                          >
                            <Shuffle className="w-4 h-4 mb-1" />
                            <div className="font-medium">Random</div>
                            <div className="text-xs opacity-75">Random template selection</div>
                          </button>
                          <button
                            onClick={() => setTemplateSelectionMode('round-robin')}
                            className={`p-3 rounded-lg text-left transition-colors ${
                              templateSelectionMode === 'round-robin'
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-green-100'
                            }`}
                          >
                            <RotateCcw className="w-4 h-4 mb-1" />
                            <div className="font-medium">Round Robin</div>
                            <div className="text-xs opacity-75">Rotate templates evenly</div>
                          </button>
                          <button
                            onClick={() => setTemplateSelectionMode('weighted')}
                            className={`p-3 rounded-lg text-left transition-colors ${
                              templateSelectionMode === 'weighted'
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-green-100'
                            }`}
                          >
                            <Star className="w-4 h-4 mb-1" />
                            <div className="font-medium">Weighted</div>
                            <div className="text-xs opacity-75">Based on priority</div>
                          </button>
                        </div>
                      </div>

                      {/* Template Group Selection */}
                      {templateGroups.length > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Select Template Group (Quick Selection)
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedTemplateGroup('')
                                setSelectedTemplates([])
                              }}
                              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedTemplateGroup === ''
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white text-gray-700 hover:bg-blue-100'
                              }`}
                            >
                              All Templates
                            </button>
                            {templateGroups.map(group => (
                              <button
                                key={group.id}
                                onClick={() => {
                                  setSelectedTemplateGroup(group.id)
                                  // Auto-select all templates from this group
                                  const groupTemplates = templates.filter(t => t.group_id === group.id)
                                  setSelectedTemplates(groupTemplates.map(t => t.id))
                                }}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                  selectedTemplateGroup === group.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-blue-100'
                                }`}
                                style={{
                                  borderLeft: `4px solid ${group.color}`,
                                  paddingLeft: '8px'
                                }}
                              >
                                {group.name} ({templates.filter(t => t.group_id === group.id).length})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Template List */}
                      <div className="space-y-3 max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl p-4">
                        {templates.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="font-medium">Loading templates...</p>
                          </div>
                        ) : (
                          <>
                            {/* Select All Button */}
                            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">
                                {selectedTemplates.length} of {
                                  selectedTemplateGroup
                                    ? templates.filter(t => t.group_id === selectedTemplateGroup).length
                                    : templates.length
                                } templates selected
                              </span>
                              <button
                                onClick={() => {
                                  const availableTemplates = selectedTemplateGroup
                                    ? templates.filter(t => t.group_id === selectedTemplateGroup)
                                    : templates

                                  if (selectedTemplates.length === availableTemplates.length) {
                                    setSelectedTemplates([])
                                  } else {
                                    setSelectedTemplates(availableTemplates.map(t => t.id))
                                  }
                                }}
                                className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors font-medium"
                              >
                                {selectedTemplates.length === (selectedTemplateGroup
                                  ? templates.filter(t => t.group_id === selectedTemplateGroup).length
                                  : templates.length) ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>

                            {(selectedTemplateGroup
                              ? templates.filter(t => t.group_id === selectedTemplateGroup)
                              : templates
                            ).map((template) => (
                              <div
                                key={template.id}
                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                  selectedTemplates.includes(template.id)
                                    ? 'border-green-500 bg-green-50 shadow-lg'
                                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                                }`}
                                onClick={() => {
                                  if (selectedTemplates.includes(template.id)) {
                                    setSelectedTemplates(selectedTemplates.filter(id => id !== template.id))
                                  } else {
                                    setSelectedTemplates([...selectedTemplates, template.id])
                                  }
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <div className="font-semibold text-gray-900">{template.name}</div>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                        {template.category}
                                      </span>
                                      {template.mediaType && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                          {template.mediaType}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600 line-clamp-2">
                                      {template.content.substring(0, 100)}
                                      {template.content.length > 100 && '...'}
                                    </div>
                                    {template.variables && template.variables.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {template.variables.map((variable, index) => (
                                          <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                                            {`{{${variable}}}`}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 ml-4">
                                    {template.priority && (
                                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                                        template.priority === 'high' ? 'bg-red-100 text-red-700' :
                                        template.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {template.priority}
                                      </div>
                                    )}
                                    {selectedTemplates.includes(template.id) && (
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                          {selectedTemplates.length} templates selected • {templates.length} total available
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          ✅ Auto-sync every 30s
                        </p>
                      </div>
                  </div>
                </div>

                {/* Target Numbers Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl mr-4">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Target Numbers</h3>
                      <p className="text-gray-600">Add phone numbers to send messages to</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Target Selection Mode */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Target Selection Mode
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setTargetSelectionMode('all')}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            targetSelectionMode === 'all'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-blue-100'
                          }`}
                        >
                          <Globe className="w-4 h-4 mb-1" />
                          <div className="font-medium">All Numbers</div>
                          <div className="text-xs opacity-75">Send to all targets</div>
                        </button>
                        <button
                          onClick={() => setTargetSelectionMode('random')}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            targetSelectionMode === 'random'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-blue-100'
                          }`}
                        >
                          <Shuffle className="w-4 h-4 mb-1" />
                          <div className="font-medium">Random</div>
                          <div className="text-xs opacity-75">Random selection</div>
                        </button>
                        <button
                          onClick={() => setTargetSelectionMode('filtered')}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            targetSelectionMode === 'filtered'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-blue-100'
                          }`}
                        >
                          <Filter className="w-4 h-4 mb-1" />
                          <div className="font-medium">Filtered</div>
                          <div className="text-xs opacity-75">Apply filters</div>
                        </button>
                      </div>
                    </div>

                    {/* Random Count Input */}
                    {targetSelectionMode === 'random' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                          Number of Random Targets
                        </label>
                        <input
                          type="number"
                          value={randomTargetCount}
                          onChange={(e) => setRandomTargetCount(parseInt(e.target.value) || 0)}
                          min="1"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 font-medium"
                          placeholder="Enter number of targets..."
                        />
                      </div>
                    )}

                    {/* Target Numbers Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Phone Numbers *
                      </label>
                      <textarea
                        value={targets}
                        onChange={(e) => setTargets(e.target.value)}
                        placeholder="Enter phone numbers (one per line)&#10;+919876543210&#10;+919876543211&#10;+919876543212"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 font-medium"
                        rows={8}
                      />
                      <div className="flex justify-between items-center mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                          {targets.split('\n').filter(line => line.trim()).length} numbers entered
                        </p>
                        <div className="flex space-x-2">
                          <button className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                            <Upload className="w-3 h-3 inline mr-1" />
                            Import CSV
                          </button>
                          <button className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors font-medium">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            Validate
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Custom Message Content */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Custom Message Content
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter custom message here (optional if templates selected)..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 font-medium"
                        rows={4}
                      />
                      <div className="flex justify-between items-center mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                          {message.length} characters
                        </p>
                        <div className="flex space-x-2">
                          <button className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                            <Smile className="w-3 h-3 inline mr-1" />
                            Add Emoji
                          </button>
                          <button className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200 transition-colors font-medium">
                            <User className="w-3 h-3 inline mr-1" />
                            Variables
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Advanced Features */}
              <div className="space-y-8">
                {/* Anti-Blocking Features */}
                <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-red-100 rounded-xl mr-4">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Anti-Blocking Protection</h3>
                      <p className="text-gray-600">Advanced features to avoid detection</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Anti-Blocking */}
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                      <h4 className="font-semibold text-gray-800 mb-4">Basic Protection</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">Random Delays</div>
                            <div className="text-sm text-gray-600">Randomize message timing</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useRandomDelay}
                              onChange={(e) => setUseRandomDelay(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        {useRandomDelay && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Min Delay (sec)</label>
                              <input
                                type="number"
                                value={minDelay}
                                onChange={(e) => setMinDelay(parseInt(e.target.value) || 1)}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Max Delay (sec)</label>
                              <input
                                type="number"
                                value={maxDelay}
                                onChange={(e) => setMaxDelay(parseInt(e.target.value) || 5)}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">User Agent Rotation</div>
                            <div className="text-sm text-gray-600">Rotate browser signatures</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useUserAgent}
                              onChange={(e) => setUseUserAgent(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">Typing Simulation</div>
                            <div className="text-sm text-gray-600">Simulate human typing</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useTypingSimulation}
                              onChange={(e) => setUseTypingSimulation(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Anti-Blocking */}
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <h4 className="font-semibold text-gray-800 mb-4">Advanced Protection</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">Human Behavior Simulation</div>
                            <div className="text-sm text-gray-600">Mimic human patterns</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={humanBehaviorSimulation}
                              onChange={(e) => setHumanBehaviorSimulation(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">Session Rotation</div>
                            <div className="text-sm text-gray-600">Auto-rotate sessions</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sessionRotationInterval > 0}
                              onChange={(e) => setSessionRotationInterval(e.target.checked ? 100 : 0)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        {sessionRotationInterval > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rotation Interval (messages)</label>
                            <input
                              type="number"
                              value={sessionRotationInterval}
                              onChange={(e) => setSessionRotationInterval(parseInt(e.target.value) || 100)}
                              min="10"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Messages/Session</label>
                            <input
                              type="number"
                              value={maxMessagesPerSession}
                              onChange={(e) => setMaxMessagesPerSession(parseInt(e.target.value) || 200)}
                              min="10"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Messages/Hour</label>
                            <input
                              type="number"
                              value={maxMessagesPerHour}
                              onChange={(e) => setMaxMessagesPerHour(parseInt(e.target.value) || 500)}
                              min="10"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timing & Scheduling */}
                <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl mr-4">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Timing & Scheduling</h3>
                      <p className="text-gray-600">Control when messages are sent</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Batch Settings */}
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <h4 className="font-semibold text-gray-800 mb-4">Batch Settings</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                          <input
                            type="number"
                            value={batchSize}
                            onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Delay (sec)</label>
                          <input
                            type="number"
                            value={delayBetweenBatches}
                            onChange={(e) => setDelayBetweenBatches(parseInt(e.target.value) || 30)}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Hours */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800">Business Hours</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={respectBusinessHours}
                            onChange={(e) => setRespectBusinessHours(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      {respectBusinessHours && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={businessHoursStart}
                              onChange={(e) => setBusinessHoursStart(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                              type="time"
                              value={businessHoursEnd}
                              onChange={(e) => setBusinessHoursEnd(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Schedule Campaign */}
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <h4 className="font-semibold text-gray-800 mb-4">Schedule Campaign</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="datetime-local"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
                          <select
                            value={repeatSchedule}
                            onChange={(e) => setRepeatSchedule(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="none">No Repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Actions */}
                <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
                  <div className="space-y-4">
                    <button
                      onClick={createCampaign}
                      disabled={isLoading || !campaignName || selectedSessions.length === 0 || (!targets && selectedTemplates.length === 0)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Creating Campaign...</span>
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5" />
                          <span>Launch Campaign</span>
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
                      }}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset Form</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              {/* Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-medium">Total Campaigns</p>
                      <p className="text-3xl font-bold text-blue-700">{campaigns.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium">Running</p>
                      <p className="text-3xl font-bold text-green-700">{campaigns.filter(c => c.status === 'running').length}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Play className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 font-medium">Completed</p>
                      <p className="text-3xl font-bold text-purple-700">{campaigns.filter(c => c.status === 'completed').length}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 font-medium">Total Messages</p>
                      <p className="text-3xl font-bold text-orange-700">{campaigns.reduce((sum, c) => sum + c.sent, 0)}</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Send className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign List */}
              <div className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-6">Create your first bulk messaging campaign to get started</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Create Campaign
                    </button>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{campaign.name}</h3>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              campaign.status === 'running' ? 'bg-green-100 text-green-700' :
                              campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </span>
                            <span className="text-sm text-gray-600">
                              Created {new Date(campaign.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {campaign.status === 'running' && (
                            <button
                              onClick={() => pauseCampaign(campaign.id)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            >
                              <Pause className="w-5 h-5" />
                            </button>
                          )}
                          {campaign.status === 'paused' && (
                            <button
                              onClick={() => resumeCampaign(campaign.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Play className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {campaign.progress > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{campaign.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${campaign.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <div className="text-lg font-bold text-gray-900">{campaign.targets.length}</div>
                          <div className="text-xs text-gray-600">Total Targets</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-xl">
                          <div className="text-lg font-bold text-green-600">{campaign.sent}</div>
                          <div className="text-xs text-gray-600">Sent</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl">
                          <div className="text-lg font-bold text-red-600">{campaign.failed}</div>
                          <div className="text-xs text-gray-600">Failed</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-xl">
                          <div className="text-lg font-bold text-blue-600">{campaign.pending || 0}</div>
                          <div className="text-xs text-gray-600">Pending</div>
                        </div>
                      </div>

                      {/* Campaign Details */}
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="w-4 h-4" />
                          <span>Sessions: {campaign.selectedSessions?.length || 1}</span>
                        </div>
                        {campaign.templates && campaign.templates.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>Templates: {campaign.templates.length}</span>
                          </div>
                        )}
                        {campaign.scheduleTime && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Scheduled: {new Date(campaign.scheduleTime).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-600">Detailed analytics and reporting features will be available soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkMessaging
