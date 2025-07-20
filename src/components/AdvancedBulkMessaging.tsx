'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Trash2, 
  Edit3, 
  Send, 
  FileText,
  BarChart3,
  Users,
  CheckCircle,
  Shield,
  Shuffle,
  List,
  Phone,
  Settings,
  Ban,
  RefreshCw,
  Target,
  Zap,
  Database,
  Activity,
  Eye,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'
import { cn } from '../lib/utils'
import { LocalStorage } from '../lib/local-storage'

// Types
interface Template {
  id: string
  name: string
  message: string
  category: string
  variables: string[]
  isApproved: boolean
  createdAt: string
}

interface Session {
  id: string
  name: string
  phone: string
  status: 'initializing' | 'qr_code' | 'ready' | 'disconnected' | 'auth_failure'
  lastUsed: string
  messagesSent: number
  isBlocked: boolean
}

interface Campaign {
  id: string
  name: string
  description: string
  templates: string[]
  sessions: string[]
  targets: string[]
  sendMode: 'random' | 'sequence'
  antiBlock: {
    enabled: boolean
    delayMin: number
    delayMax: number
    dailyLimit: number
    cooldownHours: number
  }
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed'
  stats: {
    sent: number
    delivered: number
    read: number
    failed: number
    blocked: number
  }
  createdAt: string
  lastRun: string
  templateVariables?: Record<string, string>
  excelData?: any[]
  useExcelVariables?: boolean
}

interface BlockedNumber {
  phone: string
  sessionId: string
  blockedAt: string
  reason: string
}

interface AdvancedBulkMessagingProps {
  sessions?: Session[]
  templates?: Template[]
  onSessionSelected?: (sessionId: string) => void
  selectedSession?: string
}

const AdvancedBulkMessaging: React.FC<AdvancedBulkMessagingProps> = ({
  sessions = [],
  templates = [],
  onSessionSelected,
  selectedSession
}) => {
  // State Management
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics' | 'settings'>('campaigns')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    priority: 'medium',
    selectedSessions: [] as string[],
    selectedTemplates: [] as string[],
    targets: '',
    sendMode: 'random' as 'random' | 'sequence',
    startTime: '09:00',
    endTime: '18:00',
    rotationStrategy: 'round_robin',
    sendingSpeed: 'medium',
    skipDuplicates: true,
    skipBlocked: true,
    skipRecent: true,
    antiBlock: {
      enabled: true,
      delayMin: 30,
      delayMax: 120,
      dailyLimit: 100,
      cooldownHours: 24
    },
    templateVariables: {} as Record<string, string>,
    excelData: [] as any[],
    useExcelVariables: false
  })



  // Real-time Templates State Management
  const [localTemplates, setLocalTemplates] = useState<Template[]>([])

  // Combine props templates with locally created templates for real-time sync (only after mounting)
  const allTemplates = isMounted ? [...(templates || []), ...localTemplates] : []

  // Load campaigns from localStorage
  const loadCampaigns = () => {
    const storedCampaigns = LocalStorage.getCampaigns()
    setCampaigns(storedCampaigns)
    console.log('📊 Loaded campaigns from localStorage:', storedCampaigns.length, storedCampaigns)
  }

  // Load blocked numbers from localStorage
  const loadBlockedNumbers = () => {
    // Mock blocked numbers for now
    setBlockedNumbers([])
    console.log('🚫 Loaded blocked numbers')
  }

  // Client-side mounting
  useEffect(() => {
    setIsMounted(true)
    console.log('🔧 Component mounted')
    console.log('📝 Templates received as props:', templates?.length || 0, templates)
    console.log('📱 Sessions received as props:', sessions?.length || 0, sessions)
    console.log('📋 Campaign form initial state:', campaignForm)

    // Load data
    loadCampaigns()
    loadBlockedNumbers()

    // Debug localStorage
    if (typeof window !== 'undefined') {
      console.log('🔍 localStorage available:', !!window.localStorage)
      console.log('🔍 Current localStorage keys:', Object.keys(localStorage))

      // Test localStorage
      try {
        localStorage.setItem('test', 'working')
        const test = localStorage.getItem('test')
        console.log('🔍 localStorage test:', test)
        localStorage.removeItem('test')

        // Check existing WhatsApp data
        const existingCampaigns = localStorage.getItem('whatsapp_campaigns')
        const existingTemplates = localStorage.getItem('whatsapp_templates')
        console.log('🔍 Existing campaigns in localStorage:', existingCampaigns)
        console.log('🔍 Existing templates in localStorage:', existingTemplates)
      } catch (error) {
        console.error('❌ localStorage error:', error)
      }
    }
  }, [])

  // Start bulk campaign function
  const startBulkCampaign = async (campaign: Campaign) => {
    console.log('🚀 Starting bulk campaign:', campaign.name)
    console.log('📊 Campaign data:', campaign)
    console.log('📱 Available sessions:', sessions)
    console.log('📝 Available templates:', templates)

    try {
      // Get first template content
      const templateId = campaign.templates[0]
      console.log('🔍 Looking for template ID:', templateId)
      console.log('🔍 Campaign templates array:', campaign.templates)
      console.log('🔍 Available templates:', templates.map(t => ({ id: t.id, name: t.name })))

      // Check if templateId is valid
      if (!templateId) {
        console.error('❌ No template ID found in campaign')
        throw new Error('No template selected for campaign')
      }

      let template = allTemplates.find(t => t.id === templateId)

      if (!template) {
        console.log('❌ Template not found in cache, trying to reload templates...')

        // Try to reload templates from API
        try {
          const templatesResponse = await fetch('/api/templates')
          if (templatesResponse.ok) {
            const freshTemplates = await templatesResponse.json()
            console.log('🔄 Fresh templates loaded:', freshTemplates.map((t: any) => ({ id: t.id, name: t.name })))
            template = freshTemplates.find((t: any) => t.id === templateId)

            // Update local templates state
            setLocalTemplates(freshTemplates)
          }
        } catch (reloadError) {
          console.error('❌ Failed to reload templates:', reloadError)
        }

        if (!template) {
          console.error('❌ Template still not found after reload:', templateId)
          console.error('❌ Available template IDs after reload:', templates.map(t => t.id))

          // Try to use any available template as fallback
          if (allTemplates.length > 0) {
            template = allTemplates[0]
            console.log('⚠️ Using fallback template:', template.name)
          } else {
            throw new Error(`Template not found: ${templateId}. No templates available.`)
          }
        }
      }

      // Get first session
      const sessionId = campaign.sessions[0]
      const session = sessions.find(s => s.id === sessionId)
      if (!session || session.status !== 'ready') {
        console.error('❌ Session not found or not ready:', sessionId, 'Available sessions:', sessions.map(s => ({ id: s.id, status: s.status })))
        throw new Error('No ready session found')
      }

      console.log(`📤 Sending to ${campaign.targets.length} targets using session ${session.name}`)
      console.log(`📝 Using template: ${template.name}`)
      console.log(`📱 Target numbers:`, campaign.targets)
      console.log(`📝 Template content:`, template)

      // Get message content from template - templates use 'content' field
      const templateAny = template as any
      let messageContent = templateAny.content || template.message || templateAny.text || templateAny.body || ''

      // If still no content, check if template has components (for WhatsApp Business API templates)
      if (!messageContent && templateAny.components && templateAny.components.length > 0) {
        const bodyComponent = templateAny.components.find((comp: any) => comp.type === 'BODY')
        if (bodyComponent && bodyComponent.text) {
          messageContent = bodyComponent.text
        }
      }

      if (!messageContent) {
        console.error('❌ Template has no message content:', template)
        console.error('❌ Template structure:', JSON.stringify(template, null, 2))
        throw new Error(`Template "${template.name}" has no message content. Please check template structure.`)
      }

      console.log('✅ Message content found:', messageContent)

      // Replace template variables with actual values
      if (campaign.templateVariables && Object.keys(campaign.templateVariables).length > 0) {
        Object.entries(campaign.templateVariables).forEach(([variable, value]) => {
          const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g')
          messageContent = messageContent.replace(regex, value)
        })
        console.log('✅ Template variables replaced:', campaign.templateVariables)
        console.log('📝 Final message content:', messageContent)
      }

      // Check if using Excel data for personalized messages
      if (campaign.useExcelVariables && campaign.excelData && campaign.excelData.length > 0) {
        console.log('📊 Using Excel data for personalized messages')

        // Send personalized messages to each contact
        let successCount = 0
        let failCount = 0

        for (let i = 0; i < campaign.excelData.length; i++) {
          const contactData = campaign.excelData[i]
          const phoneNumber = contactData.phone || contactData.number || contactData.mobile

          if (!phoneNumber) {
            console.warn('⚠️ No phone number found for contact:', contactData)
            failCount++
            continue
          }

          // Create personalized message for this contact
          let personalizedMessage = messageContent

          // Replace variables with contact-specific data
          Object.entries(contactData).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
            personalizedMessage = personalizedMessage.replace(regex, String(value || ''))
          })

          console.log(`📝 Sending personalized message ${i + 1}/${campaign.excelData.length} to ${phoneNumber}`)
          console.log('📝 Message content:', personalizedMessage)

          try {
            // Send individual message
            const response = await fetch('/api/messages/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: sessionId,
                to: phoneNumber,
                message: personalizedMessage
              }),
            })

            const result = await response.json()

            if (result.success) {
              successCount++
              console.log(`✅ Message sent successfully to ${phoneNumber}`)
            } else {
              failCount++
              console.error(`❌ Failed to send message to ${phoneNumber}:`, result.message)
            }

            // Add delay between messages for anti-blocking
            if (i < campaign.excelData.length - 1) {
              const delay = Math.random() * (campaign.antiBlock.delayMax - campaign.antiBlock.delayMin) + campaign.antiBlock.delayMin
              await new Promise(resolve => setTimeout(resolve, delay * 1000))
            }

          } catch (error) {
            failCount++
            console.error(`❌ Error sending message to ${phoneNumber}:`, error)
          }
        }

        console.log(`✅ Personalized campaign completed! Success: ${successCount}, Failed: ${failCount}`)
        alert(`✅ Personalized campaign "${campaign.name}" completed!\n\n✅ Successful: ${successCount}\n❌ Failed: ${failCount}`)

        // Update campaign stats
        LocalStorage.updateCampaign(campaign.id, {
          lastRun: new Date().toISOString().split('T')[0],
          stats: {
            ...campaign.stats,
            sent: successCount,
            failed: failCount
          }
        })

      } else {
        // Send bulk message via API (original logic)
        const apiUrl = '/api/messages/bulk-send'
        const requestBody = {
          sessionId: sessionId,
          contacts: campaign.targets,
          message: messageContent,
          delay: campaign.antiBlock.delayMin * 1000 || 2000
        }

        console.log('📡 Making API request to:', apiUrl)
        console.log('📡 Request body:', requestBody)

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        console.log('📡 Response status:', response.status)
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

        const result = await response.json()

        if (result.success) {
          console.log('✅ Bulk campaign started successfully!')
          alert(`✅ Campaign "${campaign.name}" started! Messages are being sent to ${campaign.targets.length} contacts.`)

          // Update campaign stats
          LocalStorage.updateCampaign(campaign.id, {
            lastRun: new Date().toISOString().split('T')[0],
            stats: {
              ...campaign.stats,
              sent: campaign.targets.length
            }
          })
        } else {
          throw new Error(result.message || 'Failed to start bulk campaign')
        }
      }

    } catch (error) {
      console.error('❌ Error in bulk campaign:', error)
      console.error('❌ Bulk campaign error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        campaignName: campaign.name,
        campaignId: campaign.id,
        templatesCount: campaign.templates.length,
        sessionsCount: campaign.sessions.length,
        targetsCount: campaign.targets.length
      })
      throw error
    }
  }

  // Load Data from localStorage - ONLY ONCE
  useEffect(() => {
    if (!isMounted) return

    console.log('🔄 Loading data from localStorage...')
    console.log('🔍 LocalStorage object:', LocalStorage)

    // Load campaigns from localStorage
    const savedCampaigns = LocalStorage.getCampaigns()
    console.log('📋 Loaded campaigns from localStorage:', savedCampaigns)
    console.log('📋 Campaigns length:', savedCampaigns.length)

    // Load campaigns from localStorage only - no sample data
    console.log('✅ Loading campaigns from localStorage')
    setCampaigns(savedCampaigns)

    // Load templates from localStorage
    const savedTemplates = LocalStorage.getTemplates()
    console.log('📝 Loaded templates from localStorage:', savedTemplates)
    setLocalTemplates(savedTemplates)

    // Force state update to ensure UI reflects localStorage data
    setTimeout(() => {
      const refreshedCampaigns = LocalStorage.getCampaigns()
      const refreshedTemplates = LocalStorage.getTemplates()
      console.log('🔄 Force refresh - campaigns:', refreshedCampaigns)
      console.log('🔄 Force refresh - templates:', refreshedTemplates)

      if (refreshedCampaigns.length > 0) {
        setCampaigns(refreshedCampaigns)
      }
      if (refreshedTemplates.length > 0) {
        setLocalTemplates(refreshedTemplates)
      }
    }, 100)

    // Load blocked numbers from localStorage or API
    try {
      const savedBlockedNumbers = JSON.parse(localStorage.getItem('blockedNumbers') || '[]')
      setBlockedNumbers(savedBlockedNumbers)
    } catch (error) {
      console.error('Failed to load blocked numbers:', error)
      setBlockedNumbers([])
    }
  }, [isMounted])

  // Real-time sync with localStorage on window focus and storage events
  useEffect(() => {
    if (!isMounted) return

    const handleFocus = () => {
      console.log('🔄 Window focused - refreshing data from localStorage')
      const refreshedCampaigns = LocalStorage.getCampaigns()
      const refreshedTemplates = LocalStorage.getTemplates()

      console.log('🔄 Refreshed campaigns:', refreshedCampaigns)
      console.log('🔄 Refreshed templates:', refreshedTemplates)

      setCampaigns(refreshedCampaigns)
      setLocalTemplates(refreshedTemplates)
    }

    // Listen for localStorage changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'whatsapp_templates' || e.key === 'whatsapp_campaigns') {
        console.log('🔄 Storage change detected:', e.key)

        const refreshedCampaigns = LocalStorage.getCampaigns()
        const refreshedTemplates = LocalStorage.getTemplates()

        console.log('🔄 Storage sync - Refreshed campaigns:', refreshedCampaigns)
        console.log('🔄 Storage sync - Refreshed templates:', refreshedTemplates)

        setCampaigns(refreshedCampaigns)
        setLocalTemplates(refreshedTemplates)
      }
    }

    // Listen for custom events from other components
    const handleTemplateUpdate = () => {
      console.log('🔄 Template update event received')
      const refreshedTemplates = LocalStorage.getTemplates()
      console.log('🔄 Event sync - Refreshed templates:', refreshedTemplates)
      setLocalTemplates(refreshedTemplates)
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('templatesUpdated', handleTemplateUpdate)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('templatesUpdated', handleTemplateUpdate)
    }
  }, [isMounted])

  // Note: We save data directly in action functions instead of useEffect to avoid conflicts

  // Real-time sync with templates from props and localStorage
  useEffect(() => {
    console.log('📝 Props templates updated:', templates)
    // Force refresh from localStorage when props change
    if (isMounted) {
      const refreshedTemplates = LocalStorage.getTemplates()
      console.log('📝 Syncing with localStorage templates:', refreshedTemplates)
      setLocalTemplates(refreshedTemplates)
    }
  }, [templates, isMounted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic sync for real-time updates (every 2 seconds)
  useEffect(() => {
    if (!isMounted) return

    const syncInterval = setInterval(() => {
      const refreshedTemplates = LocalStorage.getTemplates()
      const refreshedCampaigns = LocalStorage.getCampaigns()

      // Only update if there are actual changes to avoid unnecessary re-renders
      if (JSON.stringify(refreshedTemplates) !== JSON.stringify(localTemplates)) {
        console.log('🔄 Periodic sync - Templates updated:', refreshedTemplates)
        setLocalTemplates(refreshedTemplates)
      }

      if (JSON.stringify(refreshedCampaigns) !== JSON.stringify(campaigns)) {
        console.log('🔄 Periodic sync - Campaigns updated:', refreshedCampaigns)
        setCampaigns(refreshedCampaigns)
      }
    }, 2000) // Sync every 2 seconds

    return () => clearInterval(syncInterval)
  }, [isMounted, localTemplates, campaigns])

  // Real-time sync with sessions
  useEffect(() => {
    // This would sync with session changes in real-time
    console.log('Sessions updated:', sessions)
  }, [sessions])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  // Excel file handling functions
  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        console.log('📊 Excel data loaded:', jsonData)

        // Validate Excel data
        if (jsonData.length === 0) {
          alert('❌ Excel file is empty!')
          return
        }

        // Check if phone column exists
        const firstRow = jsonData[0] as any
        const hasPhone = 'phone' in firstRow || 'number' in firstRow || 'mobile' in firstRow

        if (!hasPhone) {
          alert('❌ Excel file must have a "phone", "number", or "mobile" column!')
          return
        }

        setCampaignForm(prev => ({
          ...prev,
          excelData: jsonData,
          useExcelVariables: true
        }))

        // Extract phone numbers for targets
        const phoneNumbers = jsonData.map((row: any) => {
          return row.phone || row.number || row.mobile || ''
        }).filter(phone => phone).join('\n')

        setCampaignForm(prev => ({
          ...prev,
          targets: phoneNumbers
        }))

        alert(`✅ Excel file loaded successfully! ${jsonData.length} contacts imported.`)

      } catch (error) {
        console.error('❌ Error reading Excel file:', error)
        alert('❌ Error reading Excel file. Please check the format.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Generate sample Excel file
  const downloadSampleExcel = () => {
    const sampleData = [
      {
        phone: '919876543210',
        name: 'John Doe',
        company: 'ABC Corp',
        amount: '₹5000',
        order_id: 'ORD001'
      },
      {
        phone: '919876543211',
        name: 'Jane Smith',
        company: 'XYZ Ltd',
        amount: '₹7500',
        order_id: 'ORD002'
      },
      {
        phone: '919876543212',
        name: 'Bob Johnson',
        company: 'Tech Solutions',
        amount: '₹3200',
        order_id: 'ORD003'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts')
    XLSX.writeFile(workbook, 'sample_contacts.xlsx')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      running: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  const handleCreateCampaign = async () => {
    console.log('🚀 handleCreateCampaign called')
    console.log('📋 Campaign form data:', campaignForm)
    console.log('📝 Available templates:', templates)
    console.log('📱 Available sessions:', sessions)

    setIsLoading(true)
    try {
      // Validate required fields
      if (!campaignForm.name || campaignForm.selectedSessions.length === 0 || !campaignForm.targets.trim() || campaignForm.selectedTemplates.length === 0) {
        console.log('❌ Validation failed:', {
          name: !!campaignForm.name,
          sessions: campaignForm.selectedSessions.length,
          targets: !!campaignForm.targets.trim(),
          templates: campaignForm.selectedTemplates.length
        })
        alert('❌ Please fill all required fields and select at least one template')
        setIsLoading(false)
        return
      }

      // Check if templates are available
      if (allTemplates.length === 0) {
        console.error('❌ No templates available')
        console.log('📝 Available templates:', allTemplates)
        console.log('📝 Props templates:', templates)
        console.log('📝 Local templates:', localTemplates)
        alert('❌ No templates available. Please create templates first from the main Templates section.')
        setIsLoading(false)
        return
      }

      console.log('✅ Validation passed, creating campaign...')
      console.log('✅ Using selected templates:', campaignForm.selectedTemplates)

      // Use selected templates
      const selectedTemplateIds = campaignForm.selectedTemplates

      // Parse targets
      const targetNumbers = campaignForm.targets
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

      // Create new campaign
      const newCampaign: Campaign = {
        id: `campaign_${Date.now()}`,
        name: campaignForm.name,
        description: campaignForm.description || 'No description provided',
        templates: selectedTemplateIds, // Use selected templates
        sessions: campaignForm.selectedSessions,
        targets: targetNumbers,
        sendMode: campaignForm.sendMode,
        antiBlock: campaignForm.antiBlock,
        status: 'draft',
        stats: {
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          blocked: 0
        },
        createdAt: new Date().toISOString().split('T')[0],
        lastRun: 'Never',
        templateVariables: campaignForm.templateVariables,
        excelData: campaignForm.excelData,
        useExcelVariables: campaignForm.useExcelVariables
      }

      // Save to localStorage first, then update state
      console.log('💾 Saving new campaign to localStorage...')
      console.log('💾 Campaign data to save:', newCampaign)

      const savedCampaign = LocalStorage.createCampaign(newCampaign)
      console.log('💾 Saved campaign result:', savedCampaign)

      const updatedCampaigns = [savedCampaign, ...campaigns]
      console.log('💾 Updated campaigns array:', updatedCampaigns)

      setCampaigns(updatedCampaigns)
      console.log('✅ Campaign created and saved:', savedCampaign)

      // Verify localStorage save
      const verifyData = LocalStorage.getCampaigns()
      console.log('🔍 Verification - campaigns in localStorage:', verifyData)

      // Reset form and close modal
      setShowCreateModal(false)
      setCampaignForm({
        name: '',
        description: '',
        priority: 'medium',
        selectedSessions: [],
        selectedTemplates: [],
        targets: '',
        sendMode: 'random',
        startTime: '09:00',
        endTime: '18:00',
        rotationStrategy: 'round_robin',
        sendingSpeed: 'medium',
        skipDuplicates: true,
        skipBlocked: true,
        skipRecent: true,
        antiBlock: {
          enabled: true,
          delayMin: 30,
          delayMax: 120,
          dailyLimit: 100,
          cooldownHours: 24
        },
        templateVariables: {},
        excelData: [],
        useExcelVariables: false
      })

      // Show success message
      alert(`✅ Campaign "${newCampaign.name}" created successfully! Campaign ID: ${newCampaign.id}`)

    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('❌ Error creating campaign. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCampaignAction = async (campaignId: string, action: string) => {
    console.log(`🎯 ${action} campaign:`, campaignId)
    console.log('📊 All campaigns:', campaigns)

    switch (action) {
      case 'start':
        console.log('▶️ Starting campaign...')

        // Find the campaign
        const campaign = campaigns.find(c => c.id === campaignId)
        console.log('🔍 Found campaign:', campaign)
        if (!campaign) {
          console.error('❌ Campaign not found in campaigns array:', campaignId)
          console.error('❌ Available campaign IDs:', campaigns.map(c => c.id))
          alert('❌ Campaign not found!')
          return
        }

        // Validate campaign data
        if (!campaign.sessions.length) {
          alert('❌ No sessions selected for campaign!')
          return
        }

        if (!campaign.targets.length) {
          alert('❌ No target numbers in campaign!')
          return
        }

        if (!campaign.templates.length) {
          alert('❌ No templates available for campaign! Please create templates first.')
          return
        }

        try {
          // Update status to running first
          const startSuccess = LocalStorage.updateCampaign(campaignId, { status: 'running' })
          if (startSuccess) {
            const updatedCampaigns = campaigns.map(c =>
              c.id === campaignId ? { ...c, status: 'running' as const } : c
            )
            setCampaigns(updatedCampaigns)
          }

          // Start actual bulk message sending
          await startBulkCampaign(campaign)

        } catch (error) {
          console.error('❌ Error starting campaign:', error)
          console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            campaignId,
            campaign
          })
          alert(`❌ Failed to start campaign! Error: ${error instanceof Error ? error.message : 'Unknown error'}`)

          // Revert status back to draft
          LocalStorage.updateCampaign(campaignId, { status: 'draft' })
          const revertedCampaigns = campaigns.map(c =>
            c.id === campaignId ? { ...c, status: 'draft' as const } : c
          )
          setCampaigns(revertedCampaigns)
        }
        break

      case 'pause':
        console.log('⏸️ Pausing campaign...')
        const pauseSuccess = LocalStorage.updateCampaign(campaignId, { status: 'paused' })
        if (pauseSuccess) {
          const updatedCampaigns = campaigns.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, status: 'paused' as const }
              : campaign
          )
          setCampaigns(updatedCampaigns)
          console.log('✅ Campaign paused and saved')
          alert(`⏸️ Campaign paused successfully!`)
        }
        break

      case 'stop':
        console.log('⏹️ Stopping campaign...')
        const stopSuccess = LocalStorage.updateCampaign(campaignId, { status: 'completed' })
        if (stopSuccess) {
          const updatedCampaigns = campaigns.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, status: 'completed' as const }
              : campaign
          )
          setCampaigns(updatedCampaigns)
          console.log('✅ Campaign stopped and saved')
          alert(`⏹️ Campaign stopped successfully!`)
        }
        break

      case 'delete':
        if (confirm('Are you sure you want to delete this campaign?')) {
          console.log('🗑️ Deleting campaign...', campaignId)
          console.log('🗑️ Current campaigns before delete:', campaigns)

          const deleteSuccess = LocalStorage.deleteCampaign(campaignId)
          console.log('🗑️ Delete operation result:', deleteSuccess)

          if (deleteSuccess) {
            const updatedCampaigns = campaigns.filter(campaign => campaign.id !== campaignId)
            console.log('🗑️ Updated campaigns after filter:', updatedCampaigns)

            setCampaigns(updatedCampaigns)
            console.log('✅ Campaign deleted and saved')

            // Verify deletion in localStorage
            const verifyData = LocalStorage.getCampaigns()
            console.log('🔍 Verification - campaigns after delete:', verifyData)

            alert(`🗑️ Campaign deleted successfully!`)
          } else {
            console.error('❌ Failed to delete campaign from localStorage')
            alert('❌ Failed to delete campaign. Please try again.')
          }
        }
        break

      case 'edit':
        alert('📝 Edit functionality coming soon!')
        break

      default:
        console.log('Unknown action:', action)
    }
  }



  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Loading state during hydration
  if (!isMounted) {
    return (
      <div className="p-6">
        <div className="text-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-black mb-2">Loading...</h2>
          <p className="text-gray-600">Initializing WhatsApp Advanced Bulk Messaging</p>
        </div>
      </div>
    )
  }

  // No session selected state
  if (!selectedSession) {
    return (
      <div className="p-6">
        <div className="text-center mb-8">
          <Megaphone size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">
            No Session Selected
          </h3>
          <p className="text-black mb-6">
            Please select a WhatsApp session to manage bulk messaging campaigns
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-black mb-2">
              Select WhatsApp Session:
            </label>
            <select
              onChange={(e) => onSessionSelected?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              defaultValue=""
            >
              <option value="" disabled>Choose a session...</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} ({session.phone})
                </option>
              ))}
            </select>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="text-center">
            <p className="text-black mb-4">
              No WhatsApp sessions available. Please create a session first.
            </p>
            <Button
              onClick={() => window.location.href = '#sessions'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to WhatsApp Numbers
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-48 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black flex items-center">
            <Megaphone className="w-8 h-8 mr-3 text-blue-600" />
            Advanced Bulk Messaging
          </h1>
          <p className="text-black mt-1">
            Create, manage, and track your WhatsApp bulk messaging campaigns with advanced anti-blocking
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => {
              const localStorageCampaigns = LocalStorage.getCampaigns()
              const localStorageTemplates = LocalStorage.getTemplates()
              console.log('🔍 Current campaigns in state:', campaigns)
              console.log('🔍 Current templates in state:', localTemplates)
              console.log('🔍 localStorage campaigns:', localStorageCampaigns)
              console.log('🔍 localStorage templates:', localStorageTemplates)
              console.log('🔍 All localStorage keys:', Object.keys(localStorage))
              alert(`State: ${campaigns.length} campaigns, ${localTemplates.length} templates\nLocalStorage: ${localStorageCampaigns.length} campaigns, ${localStorageTemplates.length} templates`)
            }}
            variant="outline"
            className="text-xs"
          >
            🔍 Debug
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            className="bg-blue-600 hover:bg-blue-700"
          >
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Megaphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-black">Total Campaigns</p>
              <p className="text-xl font-bold text-black">{campaigns.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-black">Active</p>
              <p className="text-xl font-bold text-black">
                {campaigns.filter(c => c.status === 'running').length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-black">Messages Sent</p>
              <p className="text-xl font-bold text-black">
                {formatNumber(campaigns.reduce((sum, c) => sum + c.stats.sent, 0))}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-black">Blocked Numbers</p>
              <p className="text-xl font-bold text-black">{blockedNumbers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white border border-gray-200 rounded-lg p-1">
        {[
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Anti-Block Settings', icon: Shield }
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
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="running">Running</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>

                <Button
                  variant="outline"
                  icon={<Filter size={16} />}
                  className="justify-center"
                >
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Grid */}
          {filteredCampaigns.length === 0 ? (
            <Card variant="elevated" className="text-center py-12">
              <div className="flex flex-col items-center">
                <Megaphone size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No Campaigns Found
                </h3>
                <p className="text-black mb-6">
                  Create your first bulk messaging campaign to start reaching your audience
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus size={16} />}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Campaign
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card variant="elevated" className="relative overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 transform translate-x-8 -translate-y-8 bg-blue-500" />

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {campaign.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-black">
                              {campaign.name}
                            </h3>
                            <p className="text-sm text-black">
                              {campaign.templates.length} templates • {campaign.sessions.length} sessions
                            </p>
                          </div>
                        </div>

                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getStatusColor(campaign.status)
                        )}>
                          {campaign.status}
                        </span>
                      </div>

                      <p className="text-sm text-black mb-4">
                        {campaign.description}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-black">Send Mode:</span>
                          <span className="text-sm font-medium text-black flex items-center">
                            {campaign.sendMode === 'random' ? (
                              <><Shuffle size={12} className="mr-1" /> Random</>
                            ) : (
                              <><List size={12} className="mr-1" /> Sequence</>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-black">Anti-Block:</span>
                          <span className="text-sm font-medium text-black flex items-center">
                            {campaign.antiBlock.enabled ? (
                              <><Shield size={12} className="mr-1 text-green-600" /> Enabled</>
                            ) : (
                              <><Ban size={12} className="mr-1 text-red-600" /> Disabled</>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-black">Sent:</span>
                          <span className="text-sm font-medium text-black">
                            {formatNumber(campaign.stats.sent)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-black">Success Rate:</span>
                          <span className="text-sm font-medium text-black">
                            {campaign.stats.sent > 0
                              ? ((campaign.stats.delivered / campaign.stats.sent) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between space-x-2">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCampaignAction(campaign.id, 'edit')}
                                icon={<Edit3 size={14} />}
                              >
                                Edit
                              </Button>

                              {campaign.status === 'running' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCampaignAction(campaign.id, 'pause')}
                                  icon={<Pause size={14} />}
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  Pause
                                </Button>
                              ) : campaign.status === 'paused' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCampaignAction(campaign.id, 'resume')}
                                  icon={<Play size={14} />}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Resume
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCampaignAction(campaign.id, 'start')}
                                  icon={<Play size={14} />}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Start
                                </Button>
                              )}
                            </div>

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
              ))}
            </div>
          )}
        </div>
      )}



      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader title="Campaign Analytics" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Send className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-black">
                    {formatNumber(campaigns.reduce((sum, c) => sum + c.stats.sent, 0))}
                  </p>
                  <p className="text-sm text-black">Total Sent</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-black">
                    {formatNumber(campaigns.reduce((sum, c) => sum + c.stats.delivered, 0))}
                  </p>
                  <p className="text-sm text-black">Delivered</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Eye className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-black">
                    {formatNumber(campaigns.reduce((sum, c) => sum + c.stats.read, 0))}
                  </p>
                  <p className="text-sm text-black">Read</p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Ban className="w-8 h-8 mx-auto text-red-600 mb-2" />
                  <p className="text-2xl font-bold text-black">
                    {formatNumber(campaigns.reduce((sum, c) => sum + c.stats.blocked, 0))}
                  </p>
                  <p className="text-sm text-black">Blocked</p>
                </div>
              </div>

              <div className="text-center py-12">
                <BarChart3 size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-black">
                  Advanced analytics dashboard coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Anti-Block Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader title="Anti-Blocking System" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-blue-600" />
                      Protection Features
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-black">Smart Delay System</p>
                          <p className="text-sm text-black">Random delays between messages</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-black">Daily Limits</p>
                          <p className="text-sm text-black">Automatic daily message limits</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-black">24hr Cooldown</p>
                          <p className="text-sm text-black">Prevents duplicate messages</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-black">Session Rotation</p>
                          <p className="text-sm text-black">Distributes load across sessions</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-red-600" />
                      Blocked Numbers
                    </h3>

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {blockedNumbers.map((blocked, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-black">{blocked.phone}</p>
                            <p className="text-sm text-black">{blocked.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-black">
                              {new Date(blocked.blockedAt).toLocaleDateString()}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Unblock
                            </Button>
                          </div>
                        </div>
                      ))}

                      {blockedNumbers.length === 0 && (
                        <div className="text-center py-8">
                          <Shield size={48} className="mx-auto text-green-600 mb-2" />
                          <p className="text-black">No blocked numbers</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="🚀 Create Advanced Bulk Messaging Campaign"
        size="xl"
      >
        <div className="space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Basic Campaign Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Campaign Name *
                </label>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="e.g., Product Launch 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Campaign Priority
                </label>
                <select
                  value={campaignForm.priority || 'medium'}
                  onChange={(e) => setCampaignForm({ ...campaignForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-black mb-2">
                Campaign Description
              </label>
              <textarea
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                placeholder="Describe your campaign objectives and target audience..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Template Information */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Template Information & Messaging Strategy
            </h3>

            <div className="mb-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-black">📝 Available Templates (Real-time)</span>
                  <span className="text-lg font-bold text-green-600 animate-pulse">{allTemplates.length}</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  ✅ All available templates will be automatically used in this campaign for better engagement and rotation.
                  <br />
                  🔄 Templates sync in real-time from the main Templates section.
                </p>

                {allTemplates.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800 font-medium">⚠️ No templates available</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please create templates from the main Templates section first before creating a campaign.
                    </p>
                    <div className="mt-2 flex items-center text-xs text-yellow-600">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></div>
                      Syncing with Templates section...
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">Select Templates for Campaign:</p>
                      <div className="flex items-center text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                        Live sync
                      </div>
                    </div>

                    {/* Template Selection */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {allTemplates.map((template) => (
                        <label key={template.id} className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={campaignForm.selectedTemplates.includes(template.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCampaignForm(prev => ({
                                  ...prev,
                                  selectedTemplates: [...prev.selectedTemplates, template.id]
                                }))
                              } else {
                                setCampaignForm(prev => ({
                                  ...prev,
                                  selectedTemplates: prev.selectedTemplates.filter(id => id !== template.id)
                                }))
                              }
                            }}
                            className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{template.name}</span>
                              <span className="text-xs text-gray-500">{template.category}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 truncate">{template.message}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Selected Templates Summary */}
                    {campaignForm.selectedTemplates.length > 0 && (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-700 font-medium mb-1">
                          Selected Templates ({campaignForm.selectedTemplates.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {campaignForm.selectedTemplates.map((templateId) => {
                            const template = allTemplates.find(t => t.id === templateId)
                            return template ? (
                              <span key={templateId} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">
                                {template.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {/* Select All / Deselect All */}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCampaignForm(prev => ({
                          ...prev,
                          selectedTemplates: allTemplates.map(t => t.id)
                        }))}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-gray-400">|</span>
                      <button
                        type="button"
                        onClick={() => setCampaignForm(prev => ({
                          ...prev,
                          selectedTemplates: []
                        }))}
                        className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Template Variables Section */}
            {campaignForm.selectedTemplates.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-3">
                  🔧 Template Variables
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-blue-800">
                      💡 Set values for template variables. These will replace variable placeholders in your templates.
                    </p>
                    {campaignForm.excelData.length > 0 && (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={campaignForm.useExcelVariables}
                          onChange={(e) => setCampaignForm(prev => ({
                            ...prev,
                            useExcelVariables: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-blue-800 font-medium">📊 Use Excel Data</span>
                      </label>
                    )}
                  </div>

                  {campaignForm.useExcelVariables && campaignForm.excelData.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-green-800 mb-2">
                        ✅ Using Excel data for personalized variables. Available columns:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(campaignForm.excelData[0] || {}).map((column) => (
                          <span key={column} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">
                            {column}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-green-700 mt-2">
                        💡 Use these column names as variables in your templates.
                      </p>
                    </div>
                  ) : (
                    (() => {
                      // Get all unique variables from selected templates
                      const allVariables = new Set<string>()
                      campaignForm.selectedTemplates.forEach(templateId => {
                        const template = allTemplates.find(t => t.id === templateId)
                        if (template && template.variables) {
                          template.variables.forEach(variable => allVariables.add(variable))
                        }
                      })

                      const variableArray = Array.from(allVariables)

                      if (variableArray.length === 0) {
                        return (
                          <p className="text-sm text-gray-600">
                            ℹ️ No variables found in selected templates.
                          </p>
                        )
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {variableArray.map((variable) => (
                            <div key={variable}>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {variable}
                              </label>
                              <input
                                type="text"
                                value={campaignForm.templateVariables[variable] || ''}
                                onChange={(e) => setCampaignForm(prev => ({
                                  ...prev,
                                  templateVariables: {
                                    ...prev.templateVariables,
                                    [variable]: e.target.value
                                  }
                                }))}
                                placeholder={`Enter value for {{${variable}}}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )
                    })()
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  🎯 Message Sending Mode *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sendMode"
                      value="random"
                      checked={campaignForm.sendMode === 'random'}
                      onChange={(e) => setCampaignForm({ ...campaignForm, sendMode: e.target.value as 'random' | 'sequence' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center">
                        <Shuffle size={16} className="mr-2 text-blue-600" />
                        <span className="font-medium text-black">🎲 Random Mode</span>
                      </div>
                      <p className="text-xs text-gray-600">Templates sent in random order (Better for anti-blocking)</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sendMode"
                      value="sequence"
                      checked={campaignForm.sendMode === 'sequence'}
                      onChange={(e) => setCampaignForm({ ...campaignForm, sendMode: e.target.value as 'random' | 'sequence' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center">
                        <List size={16} className="mr-2 text-blue-600" />
                        <span className="font-medium text-black">📋 Sequence Mode</span>
                      </div>
                      <p className="text-xs text-gray-600">Templates sent in defined order</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  ⏰ Message Timing
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-black">Start Time</label>
                    <input
                      type="time"
                      value={campaignForm.startTime || '09:00'}
                      onChange={(e) => setCampaignForm({ ...campaignForm, startTime: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-black">End Time</label>
                    <input
                      type="time"
                      value={campaignForm.endTime || '18:00'}
                      onChange={(e) => setCampaignForm({ ...campaignForm, endTime: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Selection */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-purple-600" />
              WhatsApp Session Management
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                📱 Select WhatsApp Sessions (Multiple Selection for Load Distribution) *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                {sessions.map((session) => (
                  <label key={session.id} className="flex items-center space-x-3 p-3 hover:bg-purple-50 rounded-lg border border-gray-200 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={campaignForm.selectedSessions.includes(session.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCampaignForm({
                            ...campaignForm,
                            selectedSessions: [...campaignForm.selectedSessions, session.id]
                          })
                        } else {
                          setCampaignForm({
                            ...campaignForm,
                            selectedSessions: campaignForm.selectedSessions.filter(id => id !== session.id)
                          })
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      disabled={session.status !== 'ready'}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-black">{session.name}</p>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          session.status === 'ready' ? 'bg-green-100 text-green-800' :
                          session.status === 'disconnected' || session.status === 'auth_failure' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        )}>
                          {session.status === 'ready' ? '🟢 Ready' :
                           session.status === 'disconnected' || session.status === 'auth_failure' ? '🔴 Disconnected' :
                           session.status === 'qr_code' ? '📱 QR Code' : '⚪ Initializing'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{session.phone}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">Messages: {session.messagesSent}</span>
                        <span className="text-xs text-gray-500">Last: {session.lastUsed}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                💡 Select multiple sessions for better load distribution and anti-blocking protection.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  🔄 Session Rotation Strategy
                </label>
                <select
                  value={campaignForm.rotationStrategy || 'round_robin'}
                  onChange={(e) => setCampaignForm({ ...campaignForm, rotationStrategy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="round_robin">🔄 Round Robin (Equal Distribution)</option>
                  <option value="random">🎲 Random Selection</option>
                  <option value="least_used">📊 Least Used First</option>
                  <option value="performance_based">⚡ Performance Based</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  ⚡ Sending Speed
                </label>
                <select
                  value={campaignForm.sendingSpeed || 'medium'}
                  onChange={(e) => setCampaignForm({ ...campaignForm, sendingSpeed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="slow">🐌 Slow (Safest - 60-120s delay)</option>
                  <option value="medium">🚶 Medium (Balanced - 30-60s delay)</option>
                  <option value="fast">🏃 Fast (Risky - 15-30s delay)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Target Management */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-orange-600" />
              Target Audience & Contact Management
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  📞 Target Phone Numbers (One per line) *
                </label>
                <textarea
                  value={campaignForm.targets}
                  onChange={(e) => setCampaignForm({ ...campaignForm, targets: e.target.value })}
                  placeholder="919876543210&#10;919876543211&#10;919876543212&#10;&#10;Or paste from Excel/CSV..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-600">
                    📋 Format: Country code + number (e.g., 919876543210)
                  </p>
                  <span className="text-xs text-orange-600 font-medium">
                    {campaignForm.targets.split('\n').filter(line => line.trim()).length} numbers
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    📁 Import Options
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleExcelUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="excel-upload"
                      />
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        icon={<Database size={16} />}
                        onClick={() => document.getElementById('excel-upload')?.click()}
                      >
                        📊 Import from CSV/Excel
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      icon={<Download size={16} />}
                      onClick={downloadSampleExcel}
                    >
                      📥 Download Sample Excel
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      icon={<Users size={16} />}
                      onClick={() => {
                        // Import from contacts functionality
                        alert('📱 Contact import feature coming soon!')
                      }}
                    >
                      👥 Import from Contacts
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      icon={<RefreshCw size={16} />}
                      onClick={() => {
                        // Use previous campaign functionality
                        const lastCampaign = campaigns[campaigns.length - 1]
                        if (lastCampaign) {
                          setCampaignForm(prev => ({
                            ...prev,
                            targets: lastCampaign.targets.join('\n')
                          }))
                          alert(`✅ Imported ${lastCampaign.targets.length} numbers from "${lastCampaign.name}"`)
                        } else {
                          alert('❌ No previous campaigns found!')
                        }
                      }}
                    >
                      🔄 Use Previous Campaign
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    🎯 Targeting Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={campaignForm.skipDuplicates || true}
                        onChange={(e) => setCampaignForm({ ...campaignForm, skipDuplicates: e.target.checked })}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-black">🚫 Skip duplicate numbers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={campaignForm.skipBlocked || true}
                        onChange={(e) => setCampaignForm({ ...campaignForm, skipBlocked: e.target.checked })}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-black">🔴 Skip blocked numbers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={campaignForm.skipRecent || true}
                        onChange={(e) => setCampaignForm({ ...campaignForm, skipRecent: e.target.checked })}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-black">⏰ Skip recently contacted (24hr)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Anti-Blocking System */}
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              🛡️ Advanced Anti-Blocking Protection System
            </h3>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-black">🔒 Enable Anti-Block Protection</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campaignForm.antiBlock.enabled}
                    onChange={(e) => setCampaignForm({
                      ...campaignForm,
                      antiBlock: { ...campaignForm.antiBlock, enabled: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {campaignForm.antiBlock.enabled && (
                <div className="space-y-4 p-4 bg-white rounded-lg border border-red-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-black mb-1">
                        ⏱️ Min Delay (seconds)
                      </label>
                      <input
                        type="number"
                        value={campaignForm.antiBlock.delayMin}
                        onChange={(e) => setCampaignForm({
                          ...campaignForm,
                          antiBlock: { ...campaignForm.antiBlock, delayMin: parseInt(e.target.value) || 30 }
                        })}
                        min="10"
                        max="300"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-black mb-1">
                        ⏰ Max Delay (seconds)
                      </label>
                      <input
                        type="number"
                        value={campaignForm.antiBlock.delayMax}
                        onChange={(e) => setCampaignForm({
                          ...campaignForm,
                          antiBlock: { ...campaignForm.antiBlock, delayMax: parseInt(e.target.value) || 120 }
                        })}
                        min="30"
                        max="600"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-black mb-1">
                        📊 Daily Limit (per session)
                      </label>
                      <input
                        type="number"
                        value={campaignForm.antiBlock.dailyLimit}
                        onChange={(e) => setCampaignForm({
                          ...campaignForm,
                          antiBlock: { ...campaignForm.antiBlock, dailyLimit: parseInt(e.target.value) || 100 }
                        })}
                        min="10"
                        max="1000"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-black mb-1">
                        🕐 Cooldown Hours
                      </label>
                      <input
                        type="number"
                        value={campaignForm.antiBlock.cooldownHours}
                        onChange={(e) => setCampaignForm({
                          ...campaignForm,
                          antiBlock: { ...campaignForm.antiBlock, cooldownHours: parseInt(e.target.value) || 24 }
                        })}
                        min="1"
                        max="72"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-xs text-black font-medium mb-2">🛡️ Active Protection Features:</p>
                    <ul className="list-disc list-inside text-xs text-black space-y-1">
                      <li>🎲 Random delays between {campaignForm.antiBlock.delayMin}-{campaignForm.antiBlock.delayMax} seconds</li>
                      <li>📊 Maximum {campaignForm.antiBlock.dailyLimit} messages per session per day</li>
                      <li>⏰ {campaignForm.antiBlock.cooldownHours}hr cooldown prevents duplicate messages</li>
                      <li>🔄 Automatic session rotation for load distribution</li>
                      <li>🚫 Smart blocking detection and prevention</li>
                      <li>📈 Adaptive delay adjustment based on success rate</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Campaign Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-3 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-gray-600" />
              📋 Campaign Summary
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-2 bg-white rounded border">
                <p className="text-gray-600">Templates</p>
                <p className="font-bold text-blue-600">{allTemplates.length}</p>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <p className="text-gray-600">Sessions</p>
                <p className="font-bold text-purple-600">{campaignForm.selectedSessions.length}</p>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <p className="text-gray-600">Targets</p>
                <p className="font-bold text-orange-600">
                  {campaignForm.targets.split('\n').filter(line => line.trim()).length}
                </p>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <p className="text-gray-600">Mode</p>
                <p className="font-bold text-green-600">
                  {campaignForm.sendMode === 'random' ? '🎲 Random' : '📋 Sequence'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 bg-gray-50 p-4 rounded-b-lg">
          <div className="text-sm text-gray-600">
            <p className="font-medium">⚠️ Campaign Validation:</p>
            <ul className="text-xs mt-1 space-y-1">
              {!campaignForm.name && <li className="text-red-600">• Campaign name required</li>}
              {allTemplates.length === 0 && <li className="text-red-600">• No templates available - create templates first</li>}
              {campaignForm.selectedTemplates.length === 0 && <li className="text-red-600">• At least one template must be selected</li>}
              {campaignForm.selectedSessions.length === 0 && <li className="text-red-600">• At least one session required</li>}
              {!campaignForm.targets.trim() && <li className="text-red-600">• Target numbers required</li>}
              {campaignForm.name && allTemplates.length > 0 && campaignForm.selectedTemplates.length > 0 && campaignForm.selectedSessions.length > 0 && campaignForm.targets.trim() && (
                <li className="text-green-600">✅ Campaign ready to launch</li>
              )}
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="px-6"
            >
              ❌ Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('🔥 Launch Campaign button clicked!')
                console.log('📋 Current form state:', campaignForm)
                console.log('✅ Form validation:', {
                  name: !!campaignForm.name,
                  templates: allTemplates.length > 0,
                  selectedTemplates: campaignForm.selectedTemplates.length > 0,
                  sessions: campaignForm.selectedSessions.length > 0,
                  targets: !!campaignForm.targets.trim()
                })
                handleCreateCampaign()
              }}
              disabled={!campaignForm.name || allTemplates.length === 0 || campaignForm.selectedTemplates.length === 0 || campaignForm.selectedSessions.length === 0 || !campaignForm.targets.trim()}
              className="bg-blue-600 hover:bg-blue-700 px-6"
              icon={<Zap size={16} />}
            >
              🚀 Launch Campaign
            </Button>
          </div>
        </div>
      </Modal>



    </div>
  )
}

// Export with dynamic import to avoid SSR issues
export default dynamic(() => Promise.resolve(AdvancedBulkMessaging), {
  ssr: false,
  loading: () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-black mb-2">Loading Advanced Bulk Messaging...</h2>
        <p className="text-gray-600">Initializing WhatsApp campaigns and templates</p>
      </div>
    </div>
  )
})
