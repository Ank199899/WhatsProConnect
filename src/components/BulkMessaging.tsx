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
  Activity
} from 'lucide-react'

interface Session {
  id: string
  name: string
  phoneNumber?: string
  status: string
  isActive: boolean
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
}

interface Campaign {
  id: string
  name: string
  message: string
  templates: Template[]
  targets: string[]
  selectedSession: string
  status: 'draft' | 'running' | 'completed' | 'paused'
  progress: number
  sent: number
  failed: number
  createdAt: string
  useRandomTemplates: boolean
  useRandomTargets: boolean
  randomTargetCount?: number
  delayBetweenMessages: number
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
  scheduleTime?: string
  timezone: string
}

const BulkMessaging: React.FC<BulkMessagingProps> = ({
  sessions = [],
  sessionsLoading = false
}) => {
  // States
  const [activeTab, setActiveTab] = useState<'create' | 'campaigns'>('create')
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [targets, setTargets] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Advanced Features States
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [useRandomTemplates, setUseRandomTemplates] = useState(false)
  const [useRandomTargets, setUseRandomTargets] = useState(false)
  const [randomTargetCount, setRandomTargetCount] = useState(10)
  const [delayBetweenMessages, setDelayBetweenMessages] = useState(2)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // Anti-blocking States
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
  const [scheduleTime, setScheduleTime] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [showAntiBlockingOptions, setShowAntiBlockingOptions] = useState(false)

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
    console.log('🚀 Initializing templates...')
    loadTemplates()

    // Set up real-time sync every 30 seconds
    const interval = setInterval(() => {
      console.log('⏰ Auto-syncing templates...')
      loadTemplates()
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
  const handleCreateCampaign = async () => {
    // Validation
    const hasMessage = message.trim() || selectedTemplates.length > 0
    if (!campaignName.trim() || !hasMessage || validTargets.length === 0 || !selectedSession) {
      alert('Please fill all required fields and ensure you have valid phone numbers')
      return
    }

    if (useRandomTargets && randomTargetCount > validTargets.length) {
      alert(`Random target count (${randomTargetCount}) cannot be more than total targets (${validTargets.length})`)
      return
    }

    setIsLoading(true)

    // Get selected templates
    const campaignTemplates = selectedTemplates.map(id =>
      templates.find(t => t.id === id)!
    ).filter(Boolean)

    // Determine final targets
    const finalTargets = useRandomTargets
      ? getRandomSelection(validTargets, randomTargetCount)
      : validTargets

    const newCampaign: Campaign = {
      id: `campaign_${Date.now()}`,
      name: campaignName,
      message: message,
      templates: campaignTemplates,
      targets: finalTargets,
      selectedSession: selectedSession,
      status: scheduleTime ? 'draft' : 'draft',
      progress: 0,
      sent: 0,
      failed: 0,
      createdAt: new Date().toISOString(),
      useRandomTemplates: useRandomTemplates,
      useRandomTargets: useRandomTargets,
      randomTargetCount: useRandomTargets ? randomTargetCount : undefined,
      delayBetweenMessages: delayBetweenMessages,
      // Anti-blocking features
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
      scheduleTime: scheduleTime || undefined,
      timezone: timezone
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
    setSelectedTemplates([])
    setUseRandomTemplates(false)
    setUseRandomTargets(false)
    setRandomTargetCount(10)
    setIsLoading(false)
    setActiveTab('campaigns')

    alert(`Campaign "${newCampaign.name}" created successfully with ${finalTargets.length} targets!`)
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bulk Messaging</h1>
                <p className="text-gray-600">Send messages to multiple WhatsApp contacts efficiently</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
                <div className="text-sm text-gray-600">Active Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{campaigns.length}</div>
                <div className="text-sm text-gray-600">Total Campaigns</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Create Campaign
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'campaigns'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Manage Campaigns ({campaigns.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'create' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Campaign Setup */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Enter campaign name..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Templates Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        Message Templates
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Real-time Sync
                        </span>
                      </div>
                      <button
                        onClick={refreshTemplates}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        🔄 Refresh
                      </button>
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {templates.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                          Loading templates...
                        </div>
                      ) : (
                        templates.map((template) => (
                          <div
                            key={template.id}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              selectedTemplates.includes(template.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              if (selectedTemplates.includes(template.id)) {
                                setSelectedTemplates(selectedTemplates.filter(id => id !== template.id))
                              } else {
                                setSelectedTemplates([...selectedTemplates, template.id])
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900">{template.name}</h4>
                                <p className="text-xs text-gray-600 truncate">{template.content.substring(0, 50)}...</p>
                                {template.variables && template.variables.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {template.variables.map((variable: string) => (
                                      <span key={variable} className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                        {`{{${variable}}}`}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs bg-gray-100 px-2 py-1 rounded ml-2">
                                {template.category}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedTemplates.length} templates selected • {templates.length} total available
                      </p>
                      <p className="text-xs text-green-600">
                        ✅ Auto-sync every 30s
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Message Content
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter custom message here (optional if templates selected)..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {message.length} characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      WhatsApp Session *
                    </label>
                    {sessionsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2 text-sm">Loading sessions...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sessions.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No sessions available</p>
                        ) : (
                          sessions.map((session) => (
                            <div
                              key={session.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedSession === session.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedSession(session.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-900">{session.name}</h3>
                                  {session.phoneNumber && (
                                    <p className="text-sm text-gray-600">{session.phoneNumber}</p>
                                  )}
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                  session.status === 'ready' || session.status === 'connected'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {session.status}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Target Numbers */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Target Phone Numbers *
                    </label>
                    <textarea
                      value={targets}
                      onChange={(e) => setTargets(e.target.value)}
                      placeholder="Enter phone numbers (one per line)&#10;+919876543210&#10;+919876543211&#10;+919876543212"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-500">
                        {targetList.length} total, {validTargets.length} valid numbers
                      </p>
                      <label className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm flex items-center">
                        <Upload className="w-4 h-4 mr-1" />
                        Upload File
                        <input
                          type="file"
                          accept=".txt,.csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <button
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center">
                        <Settings className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="font-medium text-gray-900">Advanced Options</span>
                      </div>
                      {showAdvancedOptions ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {showAdvancedOptions && (
                      <div className="mt-4 space-y-4">
                        {/* Random Templates */}
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center">
                            <Shuffle className="w-4 h-4 mr-2 text-purple-600" />
                            <div>
                              <span className="font-medium text-gray-900">Random Templates</span>
                              <p className="text-xs text-gray-600">Send different templates randomly</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useRandomTemplates}
                              onChange={(e) => setUseRandomTemplates(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>

                        {/* Random Targets */}
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Target className="w-4 h-4 mr-2 text-green-600" />
                              <div>
                                <span className="font-medium text-gray-900">Random Targets</span>
                                <p className="text-xs text-gray-600">Send to random subset of targets</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useRandomTargets}
                                onChange={(e) => setUseRandomTargets(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                          {useRandomTargets && (
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Number of random targets
                              </label>
                              <input
                                type="number"
                                value={randomTargetCount}
                                onChange={(e) => setRandomTargetCount(parseInt(e.target.value) || 1)}
                                min="1"
                                max={validTargets.length}
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                          )}
                        </div>

                        {/* Message Delay */}
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Timer className="w-4 h-4 mr-2 text-blue-600" />
                            <div>
                              <span className="font-medium text-gray-900">Message Delay</span>
                              <p className="text-xs text-gray-600">Delay between messages (seconds)</p>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={delayBetweenMessages}
                            onChange={(e) => setDelayBetweenMessages(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>1s</span>
                            <span className="font-medium">{delayBetweenMessages}s</span>
                            <span>10s</span>
                          </div>
                        </div>

                        {/* Schedule Campaign */}
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                            <div>
                              <span className="font-medium text-gray-900">Schedule Campaign</span>
                              <p className="text-xs text-gray-600">Schedule for later execution</p>
                            </div>
                          </div>
                          <input
                            type="datetime-local"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Anti-Blocking Options */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <button
                      onClick={() => setShowAntiBlockingOptions(!showAntiBlockingOptions)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-red-600" />
                        <span className="font-medium text-gray-900">Anti-Blocking Protection</span>
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">PRO</span>
                      </div>
                      {showAntiBlockingOptions ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {showAntiBlockingOptions && (
                      <div className="mt-4 space-y-4">
                        {/* Random Delay */}
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <RotateCcw className="w-4 h-4 mr-2 text-orange-600" />
                              <div>
                                <span className="font-medium text-gray-900">Random Delays</span>
                                <p className="text-xs text-gray-600">Randomize message timing</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useRandomDelay}
                                onChange={(e) => setUseRandomDelay(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                            </label>
                          </div>
                          {useRandomDelay && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Min Delay (s)</label>
                                <input
                                  type="number"
                                  value={minDelay}
                                  onChange={(e) => setMinDelay(parseInt(e.target.value) || 1)}
                                  min="1"
                                  max="30"
                                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Max Delay (s)</label>
                                <input
                                  type="number"
                                  value={maxDelay}
                                  onChange={(e) => setMaxDelay(parseInt(e.target.value) || 5)}
                                  min="2"
                                  max="60"
                                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Batch Processing */}
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Layers className="w-4 h-4 mr-2 text-yellow-600" />
                            <div>
                              <span className="font-medium text-gray-900">Batch Processing</span>
                              <p className="text-xs text-gray-600">Process messages in batches</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Batch Size</label>
                              <input
                                type="number"
                                value={batchSize}
                                onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
                                min="10"
                                max="200"
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Batch Delay (s)</label>
                              <input
                                type="number"
                                value={batchDelay}
                                onChange={(e) => setBatchDelay(parseInt(e.target.value) || 300)}
                                min="60"
                                max="3600"
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Content Variations */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 bg-pink-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Smile className="w-4 h-4 mr-2 text-pink-600" />
                                <div>
                                  <span className="text-sm font-medium text-gray-900">Smart Emojis</span>
                                  <p className="text-xs text-gray-600">Add random emojis</p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={useEmojis}
                                  onChange={(e) => setUseEmojis(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                              </label>
                            </div>
                          </div>

                          <div className="p-3 bg-cyan-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-cyan-600" />
                                <div>
                                  <span className="text-sm font-medium text-gray-900">Personalization</span>
                                  <p className="text-xs text-gray-600">Time-based greetings</p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={usePersonalization}
                                  onChange={(e) => setUsePersonalization(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Advanced Protection */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 bg-teal-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Globe className="w-4 h-4 mr-2 text-teal-600" />
                                <div>
                                  <span className="text-sm font-medium text-gray-900">User Agents</span>
                                  <p className="text-xs text-gray-600">Rotate browser agents</p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={useUserAgent}
                                  onChange={(e) => setUseUserAgent(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                              </label>
                            </div>
                          </div>

                          <div className="p-3 bg-violet-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Activity className="w-4 h-4 mr-2 text-violet-600" />
                                <div>
                                  <span className="text-sm font-medium text-gray-900">Spintax</span>
                                  <p className="text-xs text-gray-600">Text variations</p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={useSpintax}
                                  onChange={(e) => setUseSpintax(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                      Campaign Preview
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Campaign:</span>
                        <span className="font-medium">{campaignName || 'Untitled'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Templates:</span>
                        <span className="font-medium">{selectedTemplates.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Targets:</span>
                        <span className="font-medium">{validTargets.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Final Targets:</span>
                        <span className="font-medium">
                          {useRandomTargets ? Math.min(randomTargetCount, validTargets.length) : validTargets.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Message Delay:</span>
                        <span className="font-medium">{delayBetweenMessages}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Session:</span>
                        <span className="font-medium">
                          {selectedSession ? sessions.find(s => s.id === selectedSession)?.name : 'None'}
                        </span>
                      </div>
                      {useRandomTemplates && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Template Mode:</span>
                          <span className="font-medium text-purple-600">Random</span>
                        </div>
                      )}
                      {useRandomTargets && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Target Mode:</span>
                          <span className="font-medium text-green-600">Random</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Create Button */}
                  <button
                    onClick={handleCreateCampaign}
                    disabled={
                      !campaignName.trim() ||
                      (!message.trim() && selectedTemplates.length === 0) ||
                      validTargets.length === 0 ||
                      !selectedSession ||
                      isLoading ||
                      (useRandomTargets && randomTargetCount > validTargets.length)
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Advanced Campaign...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Create Advanced Campaign
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-4">Create your first bulk messaging campaign to get started</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Create Campaign
                    </button>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(campaign.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </div>
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => startCampaign(campaign.id)}
                              disabled={isLoading}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 flex items-center"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-gray-900">{campaign.targets.length}</div>
                          <div className="text-xs text-gray-600">Total Targets</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">{campaign.sent}</div>
                          <div className="text-xs text-gray-600">Sent</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded">
                          <div className="text-lg font-bold text-red-600">{campaign.failed}</div>
                          <div className="text-xs text-gray-600">Failed</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-600">{campaign.progress}%</div>
                          <div className="text-xs text-gray-600">Progress</div>
                        </div>
                      </div>

                      {campaign.progress > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{campaign.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${campaign.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-600 space-y-2">
                        {campaign.templates && campaign.templates.length > 0 ? (
                          <div>
                            <p className="mb-1"><strong>Templates:</strong> {campaign.templates.length} templates</p>
                            <div className="flex flex-wrap gap-1">
                              {campaign.templates.map((template, index) => (
                                <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                  {template.name}
                                </span>
                              ))}
                            </div>
                            {campaign.useRandomTemplates && (
                              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded mt-1">
                                <Shuffle className="w-3 h-3 mr-1" />
                                Random Mode
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="mb-1"><strong>Message:</strong> {campaign.message.substring(0, 100)}{campaign.message.length > 100 ? '...' : ''}</p>
                        )}

                        <div className="flex items-center space-x-4">
                          <p><strong>Session:</strong> {sessions.find(s => s.id === campaign.selectedSession)?.name || 'Unknown'}</p>
                          {campaign.useRandomTargets && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              <Target className="w-3 h-3 mr-1" />
                              Random {campaign.randomTargetCount} targets
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            <Timer className="w-3 h-3 mr-1" />
                            {campaign.delayBetweenMessages}s delay
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkMessaging
