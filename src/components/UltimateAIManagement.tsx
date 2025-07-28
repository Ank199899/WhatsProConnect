'use client'

import { useState, useEffect } from 'react'

// Advanced CSS animations for ultra-modern UI
const advancedStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(1deg); }
    66% { transform: translateY(-5px) rotate(-1deg); }
  }

  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-15px) rotate(-1deg); }
    66% { transform: translateY(-8px) rotate(1deg); }
  }

  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-12px) rotate(0.5deg); }
  }

  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
  }

  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
  .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
  .animate-gradient { animation: gradient-shift 3s ease infinite; background-size: 200% 200%; }
  .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .glass-effect {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`
import {
  Bot,
  Plus,
  Edit,
  Settings,
  Users,
  MessageSquare,
  Activity,
  BarChart3,
  CheckCircle,
  Zap,
  Clock,
  Brain,
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  Search,
  MoreVertical,
  RefreshCw,
  Power,
  Globe,
  Workflow,
  Rocket,
  Wand2,
  DollarSign,
  Bell,
  Save,
  Shield,
  Zap as Lightning,
  Infinity as InfinityIcon,
  Gauge,
  Star,
  Crown,
  Diamond,
  Layers,
  Key,
  Sparkles,
  FileText,
  Image,
  Code,
  Cpu,
  Trash2,
  X,
  Lock,
  Bug,
  Palette,
  Users as UsersIcon
} from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { cn } from '@/lib/utils'

// Advanced AI Provider Types
interface AIProvider {
  id: string
  name: string
  displayName: string
  category: 'text' | 'image' | 'audio' | 'video' | 'multimodal' | 'code' | 'reasoning'
  tier: 'free' | 'premium' | 'enterprise' | 'ultimate'
  supportedModels: AIModel[]
  defaultModel: string
  hasApiKey: boolean
  isActive: boolean
  description: string
  capabilities: string[]
  pricing: {
    inputTokens: number
    outputTokens: number
    currency: string
  }
  limits: {
    requestsPerMinute: number
    tokensPerRequest: number
    dailyLimit: number
  }
  features: {
    streaming: boolean
    functionCalling: boolean
    vision: boolean
    audio: boolean
    codeGeneration: boolean
    reasoning: boolean
    multimodal: boolean
  }
  performance: {
    latency: number
    reliability: number
    accuracy: number
  }
  icon: string
  color: string
  website: string
  documentation: string
}

interface AIModel {
  id: string
  name: string
  displayName: string
  description: string
  contextLength: number
  maxTokens: number
  capabilities: string[]
  pricing: {
    input: number
    output: number
  }
  performance: {
    speed: number
    quality: number
    reasoning: number
  }
  isRecommended: boolean
  isNew: boolean
  isBeta: boolean
}

// Advanced AI Agent Types
interface AIAgent {
  id: string
  name: string
  description: string
  avatar: string
  personality: string
  language: string[]
  responseStyle: string
  autoReplyEnabled: boolean
  responseDelayMin: number
  responseDelayMax: number
  maxResponseLength: number
  keywords: string[]
  systemPrompt: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  providers: AgentProvider[]
  stats: AgentStats
  capabilities: AgentCapability[]
  workflows: AgentWorkflow[]
  integrations: AgentIntegration[]
  analytics: AgentAnalytics
  performance: AgentPerformance
  security: AgentSecurity
  customization: AgentCustomization
}

interface AgentProvider {
  id: string
  providerId: string
  providerName: string
  modelId: string
  modelName: string
  priority: number
  isActive: boolean
  fallbackEnabled: boolean
  customSettings: Record<string, any>
  temperature: number
  topP: number
  maxTokens: number
  frequencyPenalty: number
  presencePenalty: number
}

interface AgentStats {
  totalResponses: number
  avgResponseTime: number
  avgConfidence: number
  successRate: number
  lastUsed: string
  totalTokensUsed: number
  totalCost: number
  userSatisfaction: number
  errorRate: number
}

interface AgentCapability {
  id: string
  name: string
  type: 'text' | 'image' | 'audio' | 'video' | 'code' | 'reasoning' | 'search' | 'memory'
  isEnabled: boolean
  settings: Record<string, any>
}

interface AgentWorkflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  triggers: WorkflowTrigger[]
  isActive: boolean
}

interface WorkflowStep {
  id: string
  type: 'condition' | 'action' | 'ai_response' | 'api_call' | 'delay'
  config: Record<string, any>
  nextSteps: string[]
}

interface WorkflowTrigger {
  id: string
  type: 'keyword' | 'intent' | 'time' | 'event' | 'user_action'
  config: Record<string, any>
}

interface AgentIntegration {
  id: string
  name: string
  type: 'webhook' | 'api' | 'database' | 'service'
  isEnabled: boolean
  config: Record<string, any>
}

interface AgentAnalytics {
  conversationFlow: ConversationFlow[]
  userEngagement: UserEngagement
  performanceMetrics: PerformanceMetrics
  sentimentAnalysis: SentimentAnalysis
}

interface ConversationFlow {
  step: string
  count: number
  avgTime: number
  dropoffRate: number
}

interface UserEngagement {
  avgSessionDuration: number
  messagesPerSession: number
  returnRate: number
  satisfactionScore: number
}

interface PerformanceMetrics {
  responseAccuracy: number
  taskCompletion: number
  errorHandling: number
  adaptability: number
}

interface SentimentAnalysis {
  positive: number
  neutral: number
  negative: number
  trends: SentimentTrend[]
}

interface SentimentTrend {
  date: string
  sentiment: number
  volume: number
}

interface AgentPerformance {
  speed: number
  accuracy: number
  reliability: number
  efficiency: number
  learningRate: number
  adaptability: number
}

interface AgentSecurity {
  dataEncryption: boolean
  accessControl: string[]
  auditLogging: boolean
  privacyCompliance: string[]
  threatDetection: boolean
}

interface AgentCustomization {
  theme: {
    primaryColor: string
    secondaryColor: string
    avatar: string
    voice: string
  }
  behavior: {
    formality: number
    creativity: number
    empathy: number
    humor: number
  }
  knowledge: {
    domains: string[]
    sources: string[]
    updateFrequency: string
  }
}

interface AgentWhatsAppNumber {
  id: string
  agentId: string
  whatsappNumberId: string
  whatsappNumberName: string
  isActive: boolean
  assignedAt: string
  messageCount: number
  lastActivity: string
  status: 'connected' | 'disconnected' | 'scanning' | 'error'
}

interface ChatSession {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'scanning' | 'error'
  phoneNumber?: string
  lastActivity: string
  messageCount: number
  assignedAgent?: string
}

function UltimateAIManagement() {
  const [isClient, setIsClient] = useState(false)
  const [randomValues, setRandomValues] = useState<number[]>([])

  // Inject advanced styles
  useEffect(() => {
    setIsClient(true)
    // Generate consistent random values for particles
    const values = Array.from({ length: 100 }, () => Math.random())
    setRandomValues(values)
    const styleElement = document.createElement('style')
    styleElement.textContent = advancedStyles
    document.head.appendChild(styleElement)
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement)
      }
    }
  }, [])
  const [activeTab, setActiveTab] = useState<'providers' | 'agents'>('providers')
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterTier, setFilterTier] = useState<string>('all')

  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProviderModal, setShowProviderModal] = useState(false)

  const [showProviderConfigModal, setShowProviderConfigModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // WhatsApp Number management state
  const [agentWhatsAppNumbers, setAgentWhatsAppNumbers] = useState<AgentWhatsAppNumber[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [showWhatsAppNumberModal, setShowWhatsAppNumberModal] = useState(false)
  const [selectedAgentForWhatsAppNumber, setSelectedAgentForWhatsAppNumber] = useState<AIAgent | null>(null)

  // Analytics and workflows state
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    monthlyCost: 0,
    trendsData: {
      responseTime: [],
      requests: []
    },
    agentPerformance: [],
    recentActivity: []
  })

  // Dashboard metrics state
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalProviders: 0,
    activeProviders: 0,
    totalSessions: 0,
    activeSessions: 0,
    messagesLast24h: 0,
    systemUptime: 99.9
  })

  // Workflows state
  const [workflows, setWorkflows] = useState<any[]>([])
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    language: 'hi',
    timezone: 'Asia/Kolkata',
    theme: 'light',
    autoBackup: true,
    debugMode: false,
    pushNotifications: true,
    defaultResponseTime: 2000,
    maxTokens: 1000,
    temperature: 0.7,
    apiRetries: 3
  })

  // Load real-time data on component mount
  useEffect(() => {
    console.log('🚀 Initializing AI Management with real-time data sync...')
    console.log('🧹 Demo data removed - now using live API data only')

    // Load all real-time data
    const initializeData = async () => {
      try {
        // Load real-time data from APIs
        await loadData()
        await loadChatSessions()
        await calculateDashboardMetrics()

        // Setup real-time sync
        setupRealTimeSync()

        console.log('✅ AI Management initialized with real-time data sync')
        console.log('📡 WebSocket/Polling active for live updates')
      } catch (error) {
        console.error('❌ Error initializing AI Management:', error)
        setLoading(false)
      }
    }

    initializeData()
  }, [])

  // Real-time data sync with WebSocket and polling fallback
  const setupRealTimeSync = () => {
    console.log('🔄 Setting up real-time data sync...')

    // Try WebSocket connection first
    try {
      const wsUrl = process.env.NODE_ENV === 'production'
        ? 'wss://your-domain.com/ws/realtime'
        : 'ws://localhost:3001/ws/realtime'

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('🔗 WebSocket connected for real-time data sync')
        // Subscribe to all data updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          channels: ['agents', 'providers', 'sessions', 'analytics', 'workflows']
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Real-time update received:', data.type)

          switch (data.type) {
            case 'agents_update':
              if (data.agents) {
                setAgents(data.agents)
                console.log('🤖 Agents updated via WebSocket')
              }
              break
            case 'providers_update':
              if (data.providers) {
                setProviders(data.providers)
                console.log('🧠 Providers updated via WebSocket')
              }
              break
            case 'sessions_update':
              loadChatSessions()
              console.log('📱 Sessions updated via WebSocket')
              break
            case 'analytics_update':
              calculateDashboardMetrics()
              console.log('📊 Analytics updated via WebSocket')
              break
            case 'workflows_update':
              if (data.workflows) {
                setWorkflows(data.workflows)
                console.log('⚡ Workflows updated via WebSocket')
              }
              break
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected, falling back to polling')
        setupPolling()
      }

      ws.onerror = () => {
        console.log('❌ WebSocket error, using polling instead')
        setupPolling()
      }

      // Cleanup on unmount
      return () => {
        ws.close()
      }
    } catch (error) {
      console.log('🔄 WebSocket not available, using polling')
      setupPolling()
    }
  }

  // Fallback polling for real-time sync
  const setupPolling = () => {
    console.log('🔄 Setting up polling for real-time data sync...')

    const interval = setInterval(async () => {
      try {
        console.log('📡 Polling for data updates...')

        // Poll for all data updates
        await Promise.all([
          loadChatSessions(),
          loadData(),
          calculateDashboardMetrics()
        ])

        console.log('✅ Polling update completed')
      } catch (error) {
        console.error('❌ Error during polling update:', error)
      }
    }, 10000) // Poll every 10 seconds

    return () => {
      console.log('🛑 Stopping polling')
      clearInterval(interval)
    }
  }

  // Real-time data sync - no localStorage needed
  useEffect(() => {
    if (agents.length > 0) {
      console.log('🤖 Agents data updated:', agents.length)
      calculateDashboardMetrics()
    }
  }, [agents])

  useEffect(() => {
    if (providers.length > 0) {
      console.log('🧠 Providers data updated:', providers.length)
      calculateDashboardMetrics()
    }
  }, [providers])

  useEffect(() => {
    if (agentWhatsAppNumbers.length > 0) {
      console.log('📱 Agent WhatsApp numbers updated:', agentWhatsAppNumbers.length)
    }
  }, [agentWhatsAppNumbers])

  // Calculate dashboard metrics when agents or providers change
  useEffect(() => {
    if (agents.length > 0 || providers.length > 0) {
      calculateDashboardMetrics()
    }
  }, [agents, providers])

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings?real_time=true')
        if (response.ok) {
          const settingsData = await response.json()
          setSettings(prev => ({ ...prev, ...settingsData.settings }))
          console.log('⚙️ Loaded settings from API')
        }
      } catch (error) {
        console.log('Using default settings:', error)
      }
    }

    loadSettings()
  }, [])



  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading real-time data...')

      // Load real-time agents data
      try {
        const agentsResponse = await fetch('/api/ai-agents?include_stats=true&include_analytics=true&real_time=true')
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json()
          if (agentsData.agents && agentsData.agents.length > 0) {
            setAgents(agentsData.agents)
            console.log('✅ Loaded real-time agents from API:', agentsData.agents.length)
          } else {
            console.log('📭 No agents found in API response')
            setAgents([])
          }
        } else {
          console.log('❌ Agents API not available, using empty data')
          setAgents([])
        }
      } catch (apiError) {
        console.log('❌ Agents API failed, using empty data')
        setAgents([])
      }

      // Load real-time providers data
      try {
        const providersResponse = await fetch('/api/ai-providers?include_models=true&include_pricing=true&real_time=true')
        if (providersResponse.ok) {
          const providersData = await providersResponse.json()
          if (providersData.providers && providersData.providers.length > 0) {
            setProviders(providersData.providers)
            console.log('✅ Loaded real-time providers from API:', providersData.providers.length)
          } else {
            console.log('📭 No providers found in API response')
            setProviders([])
          }
        } else {
          console.log('❌ Providers API not available, using empty data')
          setProviders([])
        }
      } catch (apiError) {
        console.log('❌ Providers API failed, using empty data')
        setProviders([])
      }

      // Load real-time workflows data
      try {
        const workflowsResponse = await fetch('/api/workflows?real_time=true')
        if (workflowsResponse.ok) {
          const workflowsData = await workflowsResponse.json()
          if (workflowsData.workflows && workflowsData.workflows.length > 0) {
            setWorkflows(workflowsData.workflows)
            console.log('✅ Loaded real-time workflows from API:', workflowsData.workflows.length)
          } else {
            console.log('📭 No workflows found in API response')
            setWorkflows([])
          }
        } else {
          console.log('❌ Workflows API not available, using empty data')
          setWorkflows([])
        }
      } catch (apiError) {
        console.log('❌ Workflows API failed, using empty data')
        setWorkflows([])
      }

      await calculateDashboardMetrics()

    } catch (error) {
      console.error('❌ Error loading real-time data:', error)
      console.log('🧹 Starting with completely empty data')
      setAgents([])
      setProviders([])
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }

  // Advanced functionality functions
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })

    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  // Calculate dashboard metrics from real-time data
  const calculateDashboardMetrics = async () => {
    try {
      console.log('📊 Calculating real-time dashboard metrics...')

      // Calculate agent metrics
      const totalAgents = agents.length
      const activeAgents = agents.filter(agent => agent.isActive).length

      // Calculate provider metrics
      const totalProviders = providers.length
      const activeProviders = providers.filter(provider => provider.isActive !== false).length

      // Get real-time WhatsApp session data
      let totalSessions = 0
      let activeSessions = 0
      let messagesLast24h = 0

      try {
        const sessionsResponse = await fetch('/api/whatsapp/sessions?real_time=true')
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          totalSessions = sessionsData.sessions?.length || 0
          activeSessions = sessionsData.sessions?.filter((s: any) => s.status === 'ready' || s.status === 'connected').length || 0
          console.log('📱 Real-time sessions:', { totalSessions, activeSessions })
        }
      } catch (error) {
        console.log('Could not fetch real-time session data:', error)
      }

      // Get real-time message analytics
      try {
        const analyticsResponse = await fetch('/api/analytics/messages?period=24h&real_time=true')
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          messagesLast24h = analyticsData.messageCount || 0
          console.log('📈 Real-time messages last 24h:', messagesLast24h)
        }
      } catch (error) {
        console.log('Could not fetch real-time message analytics:', error)
      }

      // Calculate real-time analytics data
      const totalRequests = agents.reduce((sum, agent) => sum + (agent.stats?.totalResponses || 0), 0)
      const successRate = agents.length > 0 ?
        agents.reduce((sum, agent) => sum + (agent.stats?.successRate || 0), 0) / agents.length : 0

      // Get real-time performance metrics
      let avgResponseTime = 0
      try {
        const performanceResponse = await fetch('/api/analytics/performance?real_time=true')
        if (performanceResponse.ok) {
          const performanceData = await performanceResponse.json()
          avgResponseTime = performanceData.avgResponseTime || 0
        }
      } catch (error) {
        console.log('Could not fetch real-time performance data:', error)
      }

      const monthlyCost = totalRequests * 0.002 // Calculate based on actual usage

      // Update dashboard metrics with real data
      setDashboardMetrics({
        totalAgents,
        activeAgents,
        totalProviders,
        activeProviders,
        totalSessions,
        activeSessions,
        messagesLast24h,
        systemUptime: activeSessions > 0 ? 99.9 : 0
      })

      // Update analytics with real data
      setAnalytics(prev => ({
        ...prev,
        totalRequests,
        successRate: Math.round(successRate),
        avgResponseTime: Math.round(avgResponseTime),
        monthlyCost: Math.round(monthlyCost * 100) / 100
      }))

      console.log('✅ Dashboard metrics calculated:', { totalAgents, activeAgents, totalSessions, activeSessions })

    } catch (error) {
      console.error('Error calculating dashboard metrics:', error)
    }
  }



  const updateAgent = async (agentId: string, updates: any) => {
    try {
      // Update via API first
      const response = await fetch(`/api/ai-agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const result = await response.json()
        // Update local state with API response
        setAgents(prev => prev.map(agent =>
          agent.id === agentId ? { ...agent, ...result.agent } : agent
        ))
        showNotification('✅ Agent updated successfully!', 'success')
        console.log('📝 Agent updated via API:', agentId, updates)
        return result.agent
      } else {
        throw new Error('Failed to update agent via API')
      }
    } catch (error) {
      console.error('Error updating agent:', error)
      showNotification('❌ Failed to update agent', 'error')
    }
  }

  const deleteAgent = async (agentId: string) => {
    try {
      const agentToDelete = agents.find(agent => agent.id === agentId)

      // Delete via API first
      const response = await fetch(`/api/ai-agents/${agentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Update local state
        setAgents(prev => prev.filter(agent => agent.id !== agentId))
        showNotification(`🗑️ Agent "${agentToDelete?.name || 'Unknown'}" deleted successfully!`, 'success')
        console.log('🗑️ Agent deleted via API:', agentId)
      } else {
        throw new Error('Failed to delete agent via API')
      }
    } catch (error) {
      console.error('Error deleting agent:', error)
      showNotification('❌ Failed to delete agent', 'error')
    }
  }

  const toggleAgentStatus = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    await updateAgent(agentId, { isActive: !agent.isActive })
  }

  const handleDeleteAgent = (agentId: string) => {
    setAgentToDelete(agentId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAgent = async () => {
    if (agentToDelete) {
      await deleteAgent(agentToDelete)
      setAgentToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  const createAgent = async (agentData: any) => {
    try {
      // Create via API first
      const response = await fetch('/api/ai-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentData.name || 'New Agent',
          description: agentData.description || 'AI Assistant',
          isActive: true,
          ...agentData
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Update local state with API response
        setAgents(prev => [...prev, result.agent])
        showNotification('✅ Agent created successfully!', 'success')
        setShowCreateModal(false)
        console.log('🎉 New agent created via API:', result.agent.name)
      } else {
        throw new Error('Failed to create agent via API')
      }
    } catch (error) {
      console.error('Error creating agent:', error)
      showNotification('❌ Failed to create agent', 'error')
    }
  }

  // Clear all data and refresh from API
  const clearStoredData = async () => {
    try {
      // Clear all local state
      setAgents([])
      setProviders([])
      setAgentWhatsAppNumbers([])
      setChatSessions([])
      setWorkflows([])

      // Clear any cached data via API
      try {
        await fetch('/api/cache/clear', { method: 'POST' })
        console.log('🧹 API cache cleared')
      } catch (error) {
        console.log('No API cache to clear')
      }

      // Reload fresh data
      await loadData()
      await loadChatSessions()
      await calculateDashboardMetrics()

      showNotification('🗑️ All data cleared and refreshed!', 'info')
      console.log('🧹 Data cleared and refreshed from API')
    } catch (error) {
      console.error('Error clearing data:', error)
      showNotification('❌ Error clearing data', 'error')
    }
  }

  // WhatsApp Number management functions
  const assignAgentToWhatsAppNumber = async (agentId: string, whatsappNumberId: string) => {
    try {
      const whatsappNumberName = chatSessions.find(s => s.id === whatsappNumberId)?.name || `WhatsApp Number ${whatsappNumberId}`

      // Try API first
      const response = await fetch('/api/agent-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, sessionId: whatsappNumberId, sessionName: whatsappNumberName })
      })

      if (response.ok) {
        const data = await response.json()
        setAgentWhatsAppNumbers(prev => [...prev, data.assignment])
        showNotification('✅ Agent assigned to WhatsApp number successfully!', 'success')
        console.log('🔗 Agent assigned to WhatsApp number via API:', agentId, whatsappNumberId)
      } else {
        // Fallback to local storage
        const newAssignment: AgentWhatsAppNumber = {
          id: `assignment_${Date.now()}`,
          agentId,
          whatsappNumberId,
          whatsappNumberName,
          isActive: true,
          assignedAt: new Date().toISOString(),
          messageCount: 0,
          lastActivity: new Date().toISOString(),
          status: 'connected'
        }

        setAgentWhatsAppNumbers(prev => [...prev, newAssignment])
        showNotification('✅ Agent assigned to WhatsApp number successfully!', 'success')
        console.log('🔗 Agent assigned to WhatsApp number locally:', agentId, whatsappNumberId)
      }
    } catch (error) {
      console.error('Error assigning agent to WhatsApp number:', error)
      showNotification('❌ Failed to assign agent to WhatsApp number', 'error')
    }
  }

  const removeAgentFromWhatsAppNumber = async (assignmentId: string) => {
    try {
      // Try API first
      const response = await fetch(`/api/agent-sessions?id=${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAgentWhatsAppNumbers(prev => prev.filter(assignment => assignment.id !== assignmentId))
        showNotification('🔗 Agent removed from WhatsApp number successfully!', 'success')
        console.log('🔗 Agent removed from WhatsApp number via API:', assignmentId)
      } else {
        // Fallback to local removal
        setAgentWhatsAppNumbers(prev => prev.filter(assignment => assignment.id !== assignmentId))
        showNotification('🔗 Agent removed from WhatsApp number successfully!', 'success')
        console.log('🔗 Agent removed from WhatsApp number locally:', assignmentId)
      }
    } catch (error) {
      console.error('Error removing agent from WhatsApp number:', error)
      showNotification('❌ Failed to remove agent from WhatsApp number', 'error')
    }
  }

  const loadChatSessions = async () => {
    try {
      // Try to load real sessions from WhatsApp API
      const response = await fetch('/api/whatsapp/sessions')
      if (response.ok) {
        const data = await response.json()
        const sessions: ChatSession[] = data.sessions?.map((session: any) => ({
          id: session.id || session.sessionId,
          name: session.name || `Session ${session.id}`,
          status: session.status || 'disconnected',
          phoneNumber: session.phoneNumber,
          lastActivity: session.lastActivity || new Date().toISOString(),
          messageCount: session.messageCount || 0,
          assignedAgent: undefined
        })) || []

        setChatSessions(sessions)
        console.log('✅ Loaded real WhatsApp sessions:', sessions.length)
      } else {
        // No real sessions available, show empty state
        setChatSessions([])
        console.log('📱 No active WhatsApp sessions found')
      }
    } catch (error) {
      console.log('📱 WhatsApp API not available, showing empty sessions')
      setChatSessions([])
    }
  }





  // Provider management functions
  const updateProvider = async (providerId: string, updates: any) => {
    try {
      const response = await fetch(`/api/ai-providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const result = await response.json()
        setProviders(prev => prev.map(provider =>
          provider.id === providerId ? { ...provider, ...result.provider } : provider
        ))
        showNotification('Provider updated successfully!', 'success')
        return result.provider
      } else {
        throw new Error('Failed to update provider')
      }
    } catch (error) {
      console.error('Error updating provider:', error)
      showNotification('Failed to update provider', 'error')
    }
  }

  const toggleProvider = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (provider) {
      await updateProvider(providerId, { isActive: !provider.isActive })
    }
  }

  const deleteProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/ai-providers/${providerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProviders(providers.filter(p => p.id !== providerId))
        showNotification('Provider deleted successfully!', 'success')
      } else {
        throw new Error('Failed to delete provider')
      }
    } catch (error) {
      console.error('Error deleting provider:', error)
      showNotification('Failed to delete provider', 'error')
    }
  }

  const updateProviderApiKey = async (providerId: string, apiKey: string) => {
    try {
      const response = await fetch(`/api/ai-providers/${providerId}/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      if (response.ok) {
        await updateProvider(providerId, { hasApiKey: true })
        showNotification('API key updated successfully!', 'success')
      } else {
        throw new Error('Failed to update API key')
      }
    } catch (error) {
      console.error('Error updating API key:', error)
      showNotification('Failed to update API key', 'error')
    }
  }

  // Workflow management functions
  const createWorkflow = async (workflowData: any) => {
    try {
      const newWorkflow = {
        id: `workflow_${Date.now()}`,
        name: workflowData.name || 'New Workflow',
        description: workflowData.description || 'Automated workflow',
        status: 'active',
        isActive: true,
        triggers: workflowData.triggers || ['Message Received'],
        actions: workflowData.actions || ['Send Response'],
        executions: 0,
        successRate: 100,
        avgTime: '0.5s'
      }

      setWorkflows(prev => [...prev, newWorkflow])
      showNotification('✅ Workflow created successfully!', 'success')
      setShowWorkflowModal(false)
      console.log('🎉 New workflow created:', newWorkflow.name)
    } catch (error) {
      console.error('Error creating workflow:', error)
      showNotification('❌ Failed to create workflow', 'error')
    }
  }

  const toggleWorkflow = async (workflowId: string) => {
    try {
      setWorkflows(prev => prev.map(workflow =>
        workflow.id === workflowId
          ? { ...workflow, isActive: !workflow.isActive }
          : workflow
      ))

      const workflow = workflows.find(w => w.id === workflowId)
      showNotification(
        `🔄 Workflow "${workflow?.name}" ${workflow?.isActive ? 'disabled' : 'enabled'}!`,
        'success'
      )
    } catch (error) {
      console.error('Error toggling workflow:', error)
      showNotification('❌ Failed to update workflow', 'error')
    }
  }

  const deleteWorkflow = async (workflowId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId)
      setWorkflows(prev => prev.filter(w => w.id !== workflowId))
      showNotification(`🗑️ Workflow "${workflow?.name}" deleted successfully!`, 'success')
    } catch (error) {
      console.error('Error deleting workflow:', error)
      showNotification('❌ Failed to delete workflow', 'error')
    }
  }

  // Settings management functions
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        showNotification('⚙️ Settings saved successfully!', 'success')
        console.log('💾 Settings saved to API:', settings)
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showNotification('❌ Failed to save settings', 'error')
    }
  }

  const resetSettings = async () => {
    try {
      const defaultSettings = {
        language: 'hi',
        timezone: 'Asia/Kolkata',
        theme: 'light',
        autoBackup: true,
        debugMode: false,
        pushNotifications: true,
        defaultResponseTime: 2000,
        maxTokens: 1000,
        temperature: 0.7,
        apiRetries: 3
      }

      const response = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultSettings })
      })

      if (response.ok) {
        setSettings(defaultSettings)
        showNotification('🔄 Settings reset to defaults!', 'success')
      } else {
        throw new Error('Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      showNotification('❌ Failed to reset settings', 'error')
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Real-time data refresh
  const refreshData = async () => {
    setIsRefreshing(true)
    console.log('🔄 Refreshing all real-time data...')

    try {
      // Refresh all data sources
      await Promise.all([
        loadData(),
        loadChatSessions(),
        calculateDashboardMetrics()
      ])

      // Refresh session assignments from API
      try {
        const response = await fetch('/api/agent-sessions?real_time=true')
        if (response.ok) {
          const sessionData = await response.json()
          setAgentWhatsAppNumbers(sessionData.sessions || [])
          console.log('📱 Agent sessions refreshed')
        }
      } catch (error) {
        console.log('No API available for session sync')
      }

      showNotification('🔄 All data synced successfully!', 'success')
      console.log('✅ Real-time data refresh completed')
    } catch (error) {
      console.error('❌ Error refreshing data:', error)
      showNotification('❌ Failed to refresh data', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter functions
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' ||
                           (agent.capabilities && agent.capabilities.some(cap => cap.type === filterCategory))
    return matchesSearch && matchesCategory
  })

  const filteredProviders = providers.filter(provider => {
    const matchesCategory = filterCategory === 'all' || provider.category === filterCategory
    const matchesTier = filterTier === 'all' || provider.tier === filterTier
    return matchesCategory && matchesTier
  })

  if (loading || !isClient) {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent" style={{borderTopColor: '#296073', borderRightColor: '#3596B5'}}></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 opacity-20" style={{borderColor: '#ADC5CF'}}></div>
          <div className="absolute inset-2 animate-pulse rounded-full opacity-20" style={{backgroundColor: '#ADC5CF'}}></div>
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-bold text-black">Loading AI Management</h3>
          <p className="text-gray-600">Initializing advanced AI systems...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Notifications */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg shadow-lg border-l-4 ${
              notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
              notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
              'bg-blue-50 border-blue-500 text-blue-800'
            } animate-slide-in-right`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="max-w-7xl mx-auto space-y-6">
      {/* Professional Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#ADC5CF'}}>
              <Brain className="w-6 h-6" style={{color: '#296073'}} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                AI Management
              </h1>
              <p className="text-gray-600">
                Manage AI providers, agents, and configurations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{backgroundColor: '#ADC5CF'}}>
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#296073'}}></div>
              <span className="text-sm font-medium text-green-700">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Real-time Sync Active</span>
            </div>
            <span className="text-sm text-gray-600">
              {agents.length} agents • {providers.length} providers • {dashboardMetrics.activeSessions} active WhatsApp numbers
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={refreshData}
              disabled={isRefreshing}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="text-white"
              style={{background: 'linear-gradient(to right, #296073, #3596B5)'}}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>

            <Button
              onClick={clearStoredData}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </div>


      {/* Simple Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-1 mb-6">
        <div className="flex overflow-x-auto">
          {[
            { id: 'providers', label: 'AI Providers', icon: Brain },
            { id: 'agents', label: 'AI Agents', icon: Bot }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 min-w-fit',
                activeTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
              style={activeTab === tab.id ? {background: 'linear-gradient(to right, #296073, #3596B5)'} : {}}
            >
              <tab.icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Based on Active Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* Providers Header */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Providers</h2>
                  <p className="text-gray-600">Manage AI service providers and API keys</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{providers.length}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{providers.filter(p => p.isActive).length}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowProviderModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id} className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className={`w-2 h-2 rounded-full ${provider.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{provider.displayName}</h3>
                  <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${provider.hasApiKey ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {provider.hasApiKey ? '✓ API Key Set' : '✗ No API Key'}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProvider(provider)
                        setShowProviderConfigModal(true)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Setup
                    </Button>
                  </div>
                </div>
              </Card>
            ))}


          </div>
        </div>
      )}

      {/* AI Agents Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Agents Header */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Agents</h2>
                  <p className="text-gray-600">Manage and deploy AI agents</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{agents.length}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{agents.filter(a => a.isActive).length}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Wand2 className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border-gray-300 focus:border-purple-500 rounded-md"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="text">Text Processing</option>
                    <option value="image">Image Analysis</option>
                    <option value="audio">Audio Processing</option>
                    <option value="code">Code Generation</option>
                    <option value="reasoning">Advanced Reasoning</option>
                    <option value="multimodal">Multimodal AI</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredAgents.length}</span> of <span className="font-medium">{agents.length}</span> agents
                </div>
                <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </div>
          </div>

          {/* Ultra-Enhanced Super Agents Grid */}
          {filteredAgents.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-xl">
                  <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">!</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mt-6 mb-2">No AI Agents Available</h3>
              <p className="text-gray-500 mb-6">
                {agents.length === 0
                  ? "Connect to your AI providers and create your first agent to start automating conversations"
                  : "No agents match your current filters. Try adjusting your search criteria."
                }
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 py-4 rounded-2xl font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Super Agent
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredAgents.map((agent, index) => (
                <Card
                  key={agent.id}
                  className="relative p-6 hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-purple-400/50 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 backdrop-blur-sm group overflow-hidden rounded-3xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Enhanced Animated Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl animate-float opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Floating Particles Effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-float opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          left: `${10 + i * 10}%`,
                          top: `${10 + i * 8}%`,
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: `${2 + i * 0.5}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* Enhanced Agent Header */}
                  <div className="relative z-10 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`p-4 rounded-2xl ${
                            agent.isActive
                              ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 animate-pulse-glow'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          } text-white shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                            <Bot className="h-8 w-8" />
                          </div>
                          {agent.isActive && (
                            <>
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"></div>
                            </>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-black text-gray-900">{agent.name}</h3>
                            {agent.isActive && (
                              <div className="flex items-center gap-1">
                                <Crown className="h-4 w-4 text-yellow-500 animate-pulse" />
                                <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full font-bold">SUPER</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 font-medium line-clamp-2">{agent.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-xl text-xs font-bold shadow-lg ${
                          agent.isActive
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse-glow'
                            : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                        }`}>
                          {agent.isActive ? '🟢 LIVE' : '⚫ OFFLINE'}
                        </div>
                        <Button variant="ghost" size="sm" className="p-1 hover:bg-purple-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-purple-600 font-semibold">AI-Powered Intelligence</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                        <Clock className="h-3 w-3" />
                        <span>Active 2m ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Agent Capabilities */}
                  <div className="relative z-10 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-bold text-gray-900">Super Powers</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities?.slice(0, 4).map((capability, index) => (
                        <span key={index} className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-xl text-xs font-semibold border border-purple-200 hover:scale-105 transition-transform duration-200">
                          {capability.name}
                        </span>
                      )) || [
                        <span key="text" className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded-xl text-xs font-semibold border border-blue-200">Text AI</span>,
                        <span key="smart" className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl text-xs font-semibold border border-green-200">Smart Reply</span>,
                        <span key="multi" className="px-3 py-1 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 rounded-xl text-xs font-semibold border border-orange-200">Multi-lang</span>
                      ]}
                    </div>
                  </div>

                  {/* Enhanced Performance Metrics */}
                  <div className="relative z-10 mb-6 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-xl font-black text-blue-600">
                          {agent.stats?.totalResponses?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-600 font-semibold">Total Responses</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-xl border border-green-100 shadow-sm">
                        <p className="text-xl font-black text-green-600">
                          {agent.stats?.avgResponseTime || 0}ms
                        </p>
                        <p className="text-xs text-gray-600 font-semibold">Avg Response</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-semibold text-gray-700">Success Rate</span>
                        </div>
                        <span className="text-sm font-bold text-yellow-600">{agent.stats?.successRate || 95}%</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-semibold text-gray-700">Active WhatsApp Numbers</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">
                          {agentWhatsAppNumbers.filter(as => as.agentId === agent.id && as.isActive).length}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-semibold text-gray-700">Cost Efficiency</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">96%</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Provider Info */}
                  <div className="relative z-10 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        AI Provider
                      </span>
                      <Button size="sm" variant="outline" className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50">
                        Configure
                      </Button>
                    </div>

                    {agent.providers && agent.providers.length > 0 ? (
                      <div className="space-y-2">
                        {agent.providers.slice(0, 2).map((provider, index) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-gradient-to-r from-white to-purple-50 rounded-xl p-3 border border-purple-100">
                            <span className="text-gray-700 font-semibold">{provider.providerName}</span>
                            <span className="font-bold text-purple-700">{provider.modelName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-orange-700 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3 border border-orange-200">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <span className="font-semibold">No provider assigned</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Agent Actions */}
                  <div className="relative z-10 flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                        onClick={() => {
                          console.log('🖊️ Edit button clicked for agent:', agent.name)
                          setEditingAgent(agent)
                          setShowCreateModal(true)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 border-green-300 text-green-700 hover:bg-green-50 rounded-xl"
                        onClick={() => {
                          console.log('🔗 Assign to WhatsApp Number clicked for agent:', agent.name)
                          setSelectedAgentForWhatsAppNumber(agent)
                          loadChatSessions()
                          setShowWhatsAppNumberModal(true)
                        }}
                      >
                        <MessageSquare className="h-3 w-3" />
                        WhatsApp Numbers
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => toggleAgentStatus(agent.id)}
                      className={`flex items-center gap-1 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                        agent.isActive
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg'
                      }`}
                    >
                      <Power className="h-3 w-3" />
                      {agent.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Enhanced Create New Agent Card */}
              <Card
                className="relative p-6 border-2 border-dashed border-purple-300 hover:border-purple-500 transition-all duration-500 cursor-pointer bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 hover:shadow-2xl group overflow-hidden rounded-3xl"
                onClick={() => setShowCreateModal(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl animate-float opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="relative mb-6">
                    <div className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl text-white shadow-2xl group-hover:scale-110 transition-transform duration-500 animate-pulse-glow">
                      <Plus className="h-10 w-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 mb-3">
                    Create Super Agent
                  </h3>
                  <p className="text-gray-600 mb-6 font-semibold">
                    Build your next AI powerhouse with advanced capabilities
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">AI-Powered</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Multi-Modal</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Smart Learning</span>
                  </div>

                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-4 rounded-2xl font-bold"
                  >
                    <Rocket className="h-5 w-5 mr-2" />
                    Start Building Now
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* AI Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* Providers Header */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Providers</h2>
                  <p className="text-gray-600">Manage AI service providers</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{providers.length}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{providers.filter(p => p.isActive).length}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowProviderModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </Button>
            </div>
          </div>

          {/* Category Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Provider Categories</h3>
                  <p className="text-gray-600 text-sm">Choose your AI technology stack</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Smart Filtering</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { id: 'all', label: 'All Providers', icon: Globe, count: providers.length, color: 'bg-gray-500' },
                { id: 'text', label: 'Text AI', icon: FileText, count: providers.filter(p => p.category === 'text').length, color: 'bg-blue-500' },
                { id: 'multimodal', label: 'Multimodal', icon: Layers, count: providers.filter(p => p.category === 'multimodal').length, color: 'bg-purple-500' },
                { id: 'image', label: 'Image AI', icon: Image, count: providers.filter(p => p.category === 'image').length, color: 'bg-pink-500' },
                { id: 'code', label: 'Code AI', icon: Code, count: providers.filter(p => p.category === 'code').length, color: 'bg-green-500' },
                { id: 'reasoning', label: 'Reasoning', icon: Brain, count: providers.filter(p => p.category === 'reasoning').length, color: 'bg-orange-500' }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setFilterCategory(category.id)}
                  className={`p-4 rounded-lg font-medium transition-all duration-200 ${
                    filterCategory === category.id
                      ? `${category.color} text-white shadow-md`
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="text-center">
                    <div className={`mx-auto mb-2 p-2 rounded-md ${
                      filterCategory === category.id
                        ? 'bg-white/20'
                        : 'bg-white shadow-sm'
                    }`}>
                      <category.icon className={`h-5 w-5 mx-auto ${
                        filterCategory === category.id ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="text-xs font-medium mb-1">{category.label}</div>
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      filterCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-gray-600 shadow-sm'
                    }`}>
                      {category.count}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tier Filter */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Filter by Tier</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Tiers', color: 'bg-gray-500' },
                { id: 'free', label: 'Free', color: 'bg-green-500' },
                { id: 'premium', label: 'Premium', color: 'bg-blue-500' },
                { id: 'enterprise', label: 'Enterprise', color: 'bg-purple-500' },
                { id: 'ultimate', label: 'Ultimate', color: 'bg-orange-500' }
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setFilterTier(tier.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                    filterTier === tier.id
                      ? `${tier.color} text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Providers Grid */}
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-6 bg-gray-100 rounded-lg mb-4">
                <Brain className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No AI Providers Available</h3>
              <p className="text-gray-500 mb-4">
                {providers.length === 0
                  ? "Configure your AI providers (OpenAI, Anthropic, Google) to start using AI agents"
                  : "No providers match your current filters. Try adjusting your search criteria."
                }
              </p>
              <Button
                onClick={() => setShowProviderModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 transition-colors duration-200 px-6 py-2 rounded-md font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProviders.map((provider, index) => (
                <Card
                  key={provider.id}
                  className="relative p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 bg-white group overflow-hidden rounded-lg hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >

                  <div className="space-y-6">
                    {/* Provider Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${provider.color || 'bg-blue-500'} shadow-sm`}>
                          <span className="text-white text-xl">{provider.icon || '🤖'}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {provider.displayName}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-500 capitalize">{provider.category}</span>
                            <div className={`w-2 h-2 rounded-full ${provider.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                              <Zap className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-blue-700 font-medium">AI Powered</span>
                            </div>
                            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                              <Shield className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">Secure</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-md text-xs font-medium ${
                          provider.tier === 'free' ? 'bg-green-100 text-green-700' :
                          provider.tier === 'premium' ? 'bg-blue-100 text-blue-700' :
                          provider.tier === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {provider.tier?.toUpperCase() || 'FREE'}
                        </div>
                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                          provider.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {provider.isActive ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </div>

                    {/* Provider Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{provider.description}</p>

                    {/* Capabilities */}
                    {provider.capabilities && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          <h4 className="text-sm font-medium text-gray-900">Capabilities</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {provider.capabilities.slice(0, 3).map((capability, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                              {capability}
                            </span>
                          ))}
                          {provider.capabilities.length > 3 && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                              +{provider.capabilities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Performance Metrics */}
                    {provider.performance && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 bg-blue-500 rounded-md">
                            <BarChart3 className="h-4 w-4 text-white" />
                          </div>
                          <h4 className="text-sm font-medium text-gray-900">Performance Metrics</h4>
                          <div className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                            Live
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-white rounded-md p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Zap className="h-3 w-3 text-orange-500" />
                                <span className="text-xs font-medium text-gray-700">Response Time</span>
                              </div>
                              <span className="text-sm font-medium text-orange-600">{provider.performance.latency}ms</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 bg-orange-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(10, 100 - (provider.performance.latency / 10))}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="bg-white rounded-md p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3 text-green-500" />
                                <span className="text-xs font-medium text-gray-700">Reliability</span>
                              </div>
                              <span className="text-sm font-medium text-green-600">{provider.performance.reliability}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 bg-green-500 rounded-full transition-all duration-300"
                                style={{ width: `${provider.performance.reliability}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="bg-white rounded-md p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-blue-500" />
                                <span className="text-xs font-medium text-gray-700">Accuracy</span>
                              </div>
                              <span className="text-sm font-medium text-blue-600">{provider.performance.accuracy}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${provider.performance.accuracy}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* API Key Status */}
                    <div className={`p-3 rounded-lg border ${
                      provider.hasApiKey
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {provider.hasApiKey ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Bell className="h-4 w-4 text-orange-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            provider.hasApiKey ? 'text-green-700' : 'text-orange-700'
                          }`}>
                            {provider.hasApiKey ? 'API Key Configured' : 'API Key Required'}
                          </span>
                        </div>
                        {!provider.hasApiKey && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProvider(provider)
                              setShowProviderConfigModal(true)
                            }}
                            className="border-orange-300 text-orange-700 hover:bg-orange-50 h-8 px-3 text-xs"
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <Button
                          onClick={() => {
                            console.log('🔧 Configuring provider:', provider)
                            console.log('📋 Supported models:', provider.supportedModels)
                            setSelectedProvider(provider)
                            setShowProviderConfigModal(true)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white border-0 transition-colors duration-200 font-medium text-sm py-2 rounded-md"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button
                          onClick={() => deleteProvider(provider.id)}
                          className="bg-red-600 hover:bg-red-700 text-white border-0 transition-colors duration-200 font-medium text-sm py-2 rounded-md"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>

                      <Button
                        onClick={() => toggleProvider(provider.id)}
                        className={`w-full font-medium text-sm py-2 rounded-md transition-colors duration-200 ${
                          provider.isActive
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        <Power className="h-4 w-4 mr-2" />
                        {provider.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Add New Provider Card */}
              <Card
                className="relative p-6 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all duration-300 cursor-pointer bg-blue-50/50 hover:bg-blue-50 group rounded-lg hover:scale-[1.02]"
                onClick={() => setShowProviderModal(true)}
              >

                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="mb-6">
                    <div className="p-6 bg-blue-500 rounded-lg text-white shadow-lg group-hover:scale-105 transition-all duration-300">
                      <Plus className="h-8 w-8" />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Add New Provider
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm max-w-sm">
                    Connect additional AI providers to expand your capabilities
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Multimodal
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Enterprise
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Fast
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        AI Powered
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowProviderModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 transition-colors duration-200 px-6 py-2 rounded-md font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Header */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
                  <p className="text-gray-600">Performance insights and metrics</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">24/7</div>
                  <div className="text-xs text-gray-600">Monitoring</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">99.9%</div>
                  <div className="text-xs text-gray-600">Uptime</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Eye className="h-4 w-4 mr-2" />
                Live View
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Save className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900 mb-2">15,420</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12% from last month</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900 mb-2">96.8%</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+2.1% improvement</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                <p className="text-2xl font-semibold text-gray-900 mb-2">945ms</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingDown className="h-3 w-3" />
                  <span>-50ms faster</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Cost</p>
                <p className="text-2xl font-semibold text-gray-900 mb-2">₹234.56</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingDown className="h-3 w-3" />
                  <span>-8% from budget</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Request Trends (Last 7 Days)
                </h3>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-blue-700 font-medium">Live</span>
                </div>
              </div>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.trendsData.requests.map((value: number, index: number) => (
                  <div key={index} className="flex flex-col items-center gap-2 group">
                    <div className="relative">
                      <div
                        className="bg-blue-500 rounded-t w-8 transition-all hover:bg-blue-600 cursor-pointer"
                        style={{ height: `${(value / 200) * 200}px` }}
                        title={`Day ${index + 1}: ${value} requests`}
                      ></div>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {value}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">Day {index + 1}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">
                    Total Requests: {analytics.trendsData.requests.reduce((sum, val) => sum + val, 0).toLocaleString()}
                  </span>
                  <span className="text-green-600 font-medium">+15.2%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Response Time Analysis
                </h3>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-700 font-medium">Optimized</span>
                </div>
              </div>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.trendsData.responseTime.map((value: number, index: number) => (
                  <div key={index} className="flex flex-col items-center gap-2 group">
                    <div className="relative">
                      <div
                        className="bg-green-500 rounded-t w-8 transition-all hover:bg-green-600 cursor-pointer"
                        style={{ height: `${(value / 1000) * 200}px` }}
                        title={`Day ${index + 1}: ${value}ms`}
                      ></div>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {value}ms
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">Day {index + 1}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">
                    Avg Response: {Math.round(analytics.trendsData.responseTime.reduce((sum, val) => sum + val, 0) / analytics.trendsData.responseTime.length)}ms
                  </span>
                  <span className="text-green-600 font-medium">-8.3%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Agent Performance and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Agent Performance Leaderboard
                </h3>
                <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-purple-700 font-medium">Top Performers</span>
                </div>
              </div>
              <div className="space-y-4">
                {(filteredAgents.length > 0 ? filteredAgents.slice(0, 5) : [
                  { id: '1', name: 'Customer Support Pro', description: 'Advanced customer service AI', stats: { successRate: 98, totalResponses: 1247 } },
                  { id: '2', name: 'Sales Assistant AI', description: 'Lead generation specialist', stats: { successRate: 95, totalResponses: 892 } },
                  { id: '3', name: 'Tech Support Bot', description: 'Technical issue resolver', stats: { successRate: 92, totalResponses: 634 } }
                ]).map((agent, index) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-500' :
                          index === 2 ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Crown className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{agent.name}</h4>
                        <p className="text-sm text-gray-600">{agent.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-gray-600">{agent.stats?.successRate || 95}% Success</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-gray-600">{agent.stats?.totalResponses || 0} responses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-purple-600 mb-1">{agent.stats?.successRate || 95}%</div>
                      <div className="text-xs text-gray-500">Success Rate</div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full mt-2">
                        <div
                          className="h-2 bg-purple-500 rounded-full"
                          style={{ width: `${agent.stats?.successRate || 95}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Real-time Activity Feed */}
            <Card className="p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-600" />
                  Live Activity
                </h3>
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-red-700 font-medium">Live</span>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {[
                  { time: '2 min ago', agent: 'Customer Support Pro', action: 'Resolved customer query', status: 'success', priority: 'high' },
                  { time: '5 min ago', agent: 'Sales Assistant', action: 'Generated product recommendation', status: 'success', priority: 'medium' },
                  { time: '8 min ago', agent: 'Tech Support Bot', action: 'Escalated complex issue', status: 'warning', priority: 'high' },
                  { time: '12 min ago', agent: 'Marketing AI', action: 'Created campaign content', status: 'success', priority: 'low' },
                  { time: '15 min ago', agent: 'Analytics Bot', action: 'Generated performance report', status: 'success', priority: 'medium' },
                  { time: '18 min ago', agent: 'Security AI', action: 'Detected threat pattern', status: 'warning', priority: 'high' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'warning' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      {activity.priority === 'high' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{activity.agent}</p>
                        {activity.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">HIGH</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          {/* Workflows Header */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Workflow className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Workflows</h2>
                  <p className="text-gray-600">Automate AI processes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{workflows.length}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">98%</div>
                  <div className="text-xs text-gray-600">Success</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowWorkflowModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Wand2 className="h-4 w-4 mr-2" />
                Builder
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>

          {/* Ultra-Enhanced Active Workflows */}
          {workflows.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-xl">
                  <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">!</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mt-6 mb-2">No Workflows Found</h3>
              <p className="text-gray-500 mb-6">Create your first AI workflow to automate processes</p>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 py-4 rounded-2xl font-semibold">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Workflow
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {workflows.map((workflow, index) => (
                <Card
                  key={workflow.id}
                  className="relative p-6 hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-indigo-400/50 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 backdrop-blur-sm group overflow-hidden rounded-3xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Enhanced Animated Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl animate-float opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Floating Particles Effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-indigo-400/30 rounded-full animate-float opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          left: `${15 + i * 12}%`,
                          top: `${15 + i * 10}%`,
                          animationDelay: `${i * 0.4}s`,
                          animationDuration: `${2.5 + i * 0.5}s`
                        }}
                      />
                    ))}
                  </div>

                  <div className="relative z-10 space-y-6">
                    {/* Enhanced Workflow Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500 animate-pulse-glow">
                          <Workflow className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900 mb-1">{workflow.name}</h3>
                          <p className="text-sm text-gray-600 font-medium">{workflow.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-indigo-600 font-semibold">Automated Workflow</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`w-4 h-4 rounded-full shadow-lg ${
                          workflow.isActive ? 'bg-green-500 animate-pulse shadow-green-500/50' : 'bg-gray-400'
                        }`}></div>
                        <span className={`text-xs font-bold ${
                          workflow.isActive ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {workflow.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Workflow Triggers */}
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-indigo-600" />
                        <h4 className="text-sm font-bold text-gray-900">Triggers</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(workflow.triggers || ['Message Received', 'Keyword Match']).map((trigger: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded-xl text-xs font-semibold border border-blue-200 hover:scale-105 transition-transform duration-200">
                            {trigger}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Workflow Actions */}
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        <h4 className="text-sm font-bold text-gray-900">Actions</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(workflow.actions || ['AI Response', 'Send Email']).map((action: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl text-xs font-semibold border border-green-200 hover:scale-105 transition-transform duration-200">
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Workflow Stats */}
                    <div className="relative z-10 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                          <div className="text-xs text-gray-600 font-semibold mb-1">Executions</div>
                          <div className="text-lg font-black text-blue-600">{workflow.executions || 247}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-green-100 shadow-sm">
                          <div className="text-xs text-gray-600 font-semibold mb-1">Success Rate</div>
                          <div className="text-lg font-black text-green-600">{workflow.successRate || 98}%</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm">
                          <div className="text-xs text-gray-600 font-semibold mb-1">Avg Time</div>
                          <div className="text-lg font-black text-purple-600">{workflow.avgTime || 2.3}s</div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Workflow Actions */}
                    <div className="relative z-10 flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl"
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Analytics
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => toggleWorkflow(workflow.id)}
                        className={`rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                          workflow.isActive
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg'
                        }`}
                      >
                        <Power className="h-3 w-3 mr-1" />
                        {workflow.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Enhanced Create New Workflow Card */}
              <Card className="relative p-6 border-2 border-dashed border-indigo-300 hover:border-indigo-500 transition-all duration-500 cursor-pointer bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 hover:shadow-2xl group overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl animate-float opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="relative mb-6">
                    <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl text-white shadow-2xl group-hover:scale-110 transition-transform duration-500 animate-pulse-glow">
                      <Wand2 className="h-10 w-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 mb-3">
                    Create New Workflow
                  </h3>
                  <p className="text-gray-600 mb-6 font-semibold">
                    Build automated AI processes with visual workflow builder
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">Visual Builder</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Drag & Drop</span>
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">AI-Powered</span>
                  </div>

                  <Button
                    onClick={() => setShowWorkflowModal(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-4 rounded-2xl font-bold"
                  >
                    <Workflow className="h-5 w-5 mr-2" />
                    Start Building Now
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Workflow Templates */}
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Popular Workflow Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: 'Customer Support Escalation',
                  description: 'Automatically escalate complex issues to human agents',
                  icon: '🎧',
                  category: 'Support'
                },
                {
                  name: 'Lead Qualification',
                  description: 'Score and route leads based on AI analysis',
                  icon: '🎯',
                  category: 'Sales'
                },
                {
                  name: 'Content Moderation',
                  description: 'Automatically moderate and filter user content',
                  icon: '🛡️',
                  category: 'Moderation'
                }
              ].map((template, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <h4 className="font-medium text-black">{template.name}</h4>
                      <span className="text-xs text-gray-500">{template.category}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Settings Header */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                  <p className="text-gray-600">Configure system preferences</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">24/7</div>
                  <div className="text-xs text-gray-600">Auto Sync</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">100%</div>
                  <div className="text-xs text-gray-600">Secure</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={saveSettings}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
              <Button
                onClick={resetSettings}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </Button>
            </div>
          </div>

          {/* Enhanced General Settings */}
          <Card className="relative p-6 bg-gradient-to-br from-white to-gray-50/30 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden rounded-3xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-400/5 rounded-full blur-2xl animate-float"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-500 rounded-xl shadow-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  General Settings
                </h3>
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-2xl border border-gray-200">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-700 font-bold">CONFIGURED</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      Default Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none bg-white text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <option value="hi">🇮🇳 Hindi (हिंदी)</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="both">🌍 Both Languages</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none bg-white text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <option value="Asia/Kolkata">🇮🇳 Asia/Kolkata (IST)</option>
                      <option value="UTC">🌍 UTC</option>
                      <option value="America/New_York">🇺🇸 America/New_York</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Palette className="h-4 w-4 text-purple-500" />
                      Theme Preference
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSetting('theme', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <option value="light">☀️ Light Mode</option>
                      <option value="dark">🌙 Dark Mode</option>
                      <option value="auto">🔄 Auto (System)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Save className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Auto Backup</h4>
                          <p className="text-sm text-gray-600">Automatically backup AI configurations</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('autoBackup', !settings.autoBackup)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
                          settings.autoBackup ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${
                          settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                        }`}></span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-xl">
                          <Bug className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Debug Mode</h4>
                          <p className="text-sm text-gray-600">Enable detailed logging for troubleshooting</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('debugMode', !settings.debugMode)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
                          settings.debugMode ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${
                          settings.debugMode ? 'translate-x-6' : 'translate-x-1'
                        }`}></span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <Bell className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Push Notifications</h4>
                          <p className="text-sm text-gray-600">Receive real-time alerts and updates</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
                          settings.pushNotifications ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${
                          settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced AI Configuration */}
          <Card className="relative p-6 bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden rounded-3xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl animate-float"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  AI Configuration
                </h3>
                <div className="flex items-center gap-2 bg-purple-100 px-3 py-2 rounded-2xl border border-purple-200">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-purple-700 font-bold">AI OPTIMIZED</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-purple-500" />
                      Default AI Provider
                    </label>
                    <select className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300">
                      <option value="openai">🤖 OpenAI (GPT-4)</option>
                      <option value="anthropic">🧠 Anthropic (Claude)</option>
                      <option value="google">💎 Google AI (Gemini)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      Max Retries
                    </label>
                    <input
                      type="number"
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none bg-white text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                      defaultValue="3"
                      min="1"
                      max="10"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none bg-white text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                      defaultValue="30"
                      min="5"
                      max="120"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Fallback Enabled</h4>
                          <p className="text-sm text-gray-600">Use backup providers when primary fails</p>
                        </div>
                      </div>
                      <button className="relative inline-flex h-7 w-12 items-center rounded-full bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-300">
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white transition translate-x-6 shadow-sm"></span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <Zap className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Smart Routing</h4>
                          <p className="text-sm text-gray-600">Automatically route to best performing provider</p>
                        </div>
                      </div>
                      <button className="relative inline-flex h-7 w-12 items-center rounded-full bg-purple-600 shadow-lg hover:shadow-xl transition-all duration-300">
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white transition translate-x-6 shadow-sm"></span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Auto Optimization</h4>
                          <p className="text-sm text-gray-600">Continuously optimize AI performance</p>
                        </div>
                      </div>
                      <button className="relative inline-flex h-7 w-12 items-center rounded-full bg-green-600 shadow-lg hover:shadow-xl transition-all duration-300">
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white transition translate-x-6 shadow-sm"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Security Settings */}
          <Card className="relative p-6 bg-gradient-to-br from-white to-red-50/30 border border-red-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden rounded-3xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/5 rounded-full blur-2xl animate-float"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  Security & Privacy
                </h3>
                <div className="flex items-center gap-2 bg-red-100 px-3 py-2 rounded-2xl border border-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-700 font-bold">ENTERPRISE SECURE</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <Lock className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Data Encryption</h4>
                          <p className="text-sm text-gray-600">Encrypt all AI conversations and data</p>
                        </div>
                      </div>
                      <button className="relative inline-flex h-7 w-12 items-center rounded-full bg-green-600 shadow-lg hover:shadow-xl transition-all duration-300">
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white transition translate-x-6 shadow-sm"></span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Audit Logging</h4>
                          <p className="text-sm text-gray-600">Log all AI interactions for compliance</p>
                        </div>
                      </div>
                      <button className="relative inline-flex h-7 w-12 items-center rounded-full bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-300">
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white transition translate-x-6 shadow-sm"></span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <Eye className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Privacy Mode</h4>
                          <p className="text-sm text-gray-600">Enhanced privacy protection</p>
                        </div>
                      </div>
                      <button className="relative inline-flex h-7 w-12 items-center rounded-full bg-purple-600 shadow-lg hover:shadow-xl transition-all duration-300">
                        <span className="inline-block h-5 w-5 transform rounded-full bg-white transition translate-x-6 shadow-sm"></span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-red-500" />
                      Access Control
                    </label>
                    <select className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:outline-none bg-white text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300">
                      <option value="role_based">🔐 Role-based Access</option>
                      <option value="user_based">👤 User-based Access</option>
                      <option value="open">🌍 Open Access</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none bg-white text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                      defaultValue="60"
                      min="5"
                      max="480"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Key className="h-4 w-4 text-yellow-500" />
                      API Rate Limit (requests/minute)
                    </label>
                    <input
                      type="number"
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-yellow-500 focus:outline-none bg-white text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                      defaultValue="100"
                      min="10"
                      max="1000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-600" />
              Notifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive alerts via email</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">SMS Notifications</h4>
                    <p className="text-sm text-gray-600">Receive critical alerts via SMS</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">Webhook Notifications</h4>
                    <p className="text-sm text-gray-600">Send alerts to external systems</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">Slack Integration</h4>
                    <p className="text-sm text-gray-600">Send notifications to Slack channels</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Settings */}
          <div className="flex justify-end gap-4">
            <Button variant="outline">
              Reset to Defaults
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">
                {editingAgent ? 'Edit Agent' : 'Create Super Agent'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingAgent(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const agentData = {
                name: formData.get('name'),
                description: formData.get('description'),
                personality: formData.get('personality'),
                language: formData.get('language'),
                responseStyle: formData.get('responseStyle'),
                autoReplyEnabled: formData.get('autoReply') === 'on',
                responseDelayMin: parseInt(formData.get('delayMin') as string) || 1,
                responseDelayMax: parseInt(formData.get('delayMax') as string) || 5,
                maxResponseLength: parseInt(formData.get('maxLength') as string) || 500,
                keywords: (formData.get('keywords') as string)?.split(',').map(k => k.trim()) || [],
                systemPrompt: formData.get('systemPrompt'),
                providerId: formData.get('provider'),
                modelName: formData.get('model')
              }

              if (editingAgent) {
                await updateAgent(editingAgent.id, agentData)
                setEditingAgent(null)
              } else {
                await createAgent(agentData)
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Agent Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingAgent?.name || ''}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Customer Support Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Personality</label>
                  <select
                    name="personality"
                    defaultValue={editingAgent?.personality || 'helpful'}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="helpful">Helpful</option>
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="enthusiastic">Enthusiastic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingAgent?.description || ''}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this agent does..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Language</label>
                  <select
                    name="language"
                    defaultValue={editingAgent?.language || 'hi'}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="hi">Hindi</option>
                    <option value="en">English</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Response Style</label>
                  <select
                    name="responseStyle"
                    defaultValue={editingAgent?.responseStyle || 'professional'}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Min Delay (sec)</label>
                  <input
                    name="delayMin"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="1"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Max Delay (sec)</label>
                  <input
                    name="delayMax"
                    type="number"
                    min="1"
                    max="30"
                    defaultValue="5"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Max Response Length</label>
                  <input
                    name="maxLength"
                    type="number"
                    min="100"
                    max="2000"
                    defaultValue="500"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Keywords (comma-separated)</label>
                <input
                  name="keywords"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="support, help, issue, problem"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">System Prompt</label>
                <textarea
                  name="systemPrompt"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="You are a helpful assistant that..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">AI Provider</label>
                  <select name="provider" className="w-full p-3 border border-gray-300 rounded-lg">
                    <option value="">Select Provider</option>
                    {providers.filter(p => p.hasApiKey && p.isActive).map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Model</label>
                  <select name="model" className="w-full p-3 border border-gray-300 rounded-lg">
                    <option value="">Select Model</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  name="autoReply"
                  type="checkbox"
                  id="autoReply"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoReply" className="text-sm font-medium text-black">
                  Enable Auto Reply
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingAgent(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-white"
                  style={{background: 'linear-gradient(to right, #296073, #3596B5)'}}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-black mb-4">Delete Agent</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this agent? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setAgentToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeleteAgent}
              >
                Delete Agent
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session Assignment Modal */}
      {showWhatsAppNumberModal && selectedAgentForWhatsAppNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">
                Assign {selectedAgentForWhatsAppNumber.name} to WhatsApp Numbers
              </h2>
              <button
                onClick={() => {
                  setShowWhatsAppNumberModal(false)
                  setSelectedAgentForWhatsAppNumber(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Select WhatsApp numbers to assign this AI agent to. The agent will automatically respond to messages in these WhatsApp numbers.
              </p>

              {/* Real-time Session Sync Status */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700">Real-time session sync active</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadChatSessions}
                    className="ml-auto text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Available Sessions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-black">Available WhatsApp Numbers:</h3>
                {chatSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No active WhatsApp numbers found</p>
                    <p className="text-sm mt-2">
                      Go to <strong>WhatsApp Numbers</strong> to create WhatsApp numbers first
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadChatSessions}
                      className="mt-3"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check for WhatsApp Numbers
                    </Button>
                  </div>
                ) : (
                  chatSessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            session.status === 'connected' ? 'bg-green-500' :
                            session.status === 'scanning' ? 'bg-yellow-500 animate-pulse' :
                            'bg-red-500'
                          }`} />
                          <div>
                            <h4 className="font-medium text-black">{session.name}</h4>
                            <p className="text-sm text-gray-500">
                              {session.phoneNumber ? `${session.phoneNumber} • ` : ''}
                              {session.messageCount} messages •
                              Status: {session.status}
                            </p>
                            <p className="text-xs text-gray-400">
                              Last activity: {new Date(session.lastActivity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            assignAgentToWhatsAppNumber(selectedAgentForWhatsAppNumber.id, session.id)
                            setShowWhatsAppNumberModal(false)
                            setSelectedAgentForWhatsAppNumber(null)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={session.status !== 'connected'}
                        >
                          {session.status === 'connected' ? 'Assign Agent' : 'Not Available'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Current Assignments */}
              <div className="space-y-3 mt-6">
                <h3 className="font-semibold text-black">Current Assignments:</h3>
                {agentWhatsAppNumbers.filter(as => as.agentId === selectedAgentForWhatsAppNumber.id).length === 0 ? (
                  <p className="text-gray-500 text-sm">No WhatsApp numbers assigned to this agent yet</p>
                ) : (
                  agentWhatsAppNumbers
                    .filter(as => as.agentId === selectedAgentForWhatsAppNumber.id)
                    .map((assignment) => (
                      <div key={assignment.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <h4 className="font-medium text-black">{assignment.whatsappNumberName}</h4>
                              <p className="text-sm text-gray-600">
                                Assigned {new Date(assignment.assignedAt).toLocaleDateString()} •
                                {assignment.messageCount} messages handled
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAgentFromWhatsAppNumber(assignment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowWhatsAppNumberModal(false)
                  setSelectedAgentForWhatsAppNumber(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Configuration Modal */}
      {showProviderConfigModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedProvider.color || 'from-blue-500 to-purple-600'}`}>
                  <span className="text-white text-lg">{selectedProvider.icon || '🤖'}</span>
                </div>
                Configure {selectedProvider.displayName}
              </h2>
              <button
                onClick={() => {
                  setShowProviderConfigModal(false)
                  setSelectedProvider(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    Debug: Models count: {selectedProvider.supportedModels?.length || 0}
                  </p>
                  <p className="text-xs text-yellow-800">
                    Default model: {selectedProvider.defaultModel}
                  </p>
                </div>
              )}

              {/* API Key Configuration */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  API Key Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Enter your API key"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => {
                        // Store API key temporarily for saving
                        (window as any).tempApiKey = e.target.value
                      }}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Your API key will be encrypted and stored securely
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Default Model
                    </label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      {selectedProvider.supportedModels && selectedProvider.supportedModels.length > 0 ? (
                        selectedProvider.supportedModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.displayName || model.name} - {model.description}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value={selectedProvider.defaultModel}>
                            {selectedProvider.defaultModel} (Default)
                          </option>
                          {selectedProvider.id === 'openai' && (
                            <>
                              <option value="gpt-4">GPT-4 - Most capable model</option>
                              <option value="gpt-3.5-turbo">GPT-3.5 Turbo - Fast and efficient</option>
                            </>
                          )}
                          {selectedProvider.id === 'anthropic' && (
                            <>
                              <option value="claude-3-opus">Claude 3 Opus - Most powerful</option>
                              <option value="claude-3-sonnet">Claude 3 Sonnet - Balanced</option>
                            </>
                          )}
                          {selectedProvider.id === 'google' && (
                            <>
                              <option value="gemini-pro">Gemini Pro - Advanced multimodal</option>
                              <option value="gemini-pro-vision">Gemini Pro Vision - Vision capabilities</option>
                            </>
                          )}
                        </>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        defaultValue="1000"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Temperature
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        defaultValue="0.7"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Status */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Provider Status
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-black">Active</span>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={selectedProvider.isActive}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-black">Priority</span>
                    <select className="text-sm border border-gray-300 rounded px-2 py-1">
                      <option value="high">High</option>
                      <option value="medium" selected>Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const apiKey = (window as any).tempApiKey
                      if (!apiKey) {
                        setNotification({
                          type: 'error',
                          message: 'Please enter an API key to test'
                        })
                        return
                      }

                      setNotification({
                        type: 'info',
                        message: 'Testing connection...'
                      })

                      // Simple test - try to make a basic request
                      const testResponse = await fetch('/api/ai-providers/test', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          providerId: selectedProvider.id,
                          apiKey: apiKey
                        }),
                      })

                      if (testResponse.ok) {
                        setNotification({
                          type: 'success',
                          message: 'Connection test successful!'
                        })
                      } else {
                        throw new Error('Connection test failed')
                      }
                    } catch (error) {
                      setNotification({
                        type: 'error',
                        message: 'Connection test failed'
                      })
                    }
                  }}
                  className="px-6"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const apiKey = (window as any).tempApiKey
                      if (!apiKey) {
                        setNotification({
                          type: 'error',
                          message: 'Please enter an API key'
                        })
                        return
                      }

                      const response = await fetch('/api/ai-providers/keys', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          providerId: selectedProvider.id,
                          apiKey: apiKey,
                          userId: 'default'
                        }),
                      })

                      if (response.ok) {
                        // Update provider locally
                        setProviders(prev => prev.map(p =>
                          p.id === selectedProvider.id
                            ? { ...p, hasApiKey: true, isActive: true }
                            : p
                        ))

                        setNotification({
                          type: 'success',
                          message: 'API key saved successfully!'
                        })
                        setShowProviderConfigModal(false)
                        setSelectedProvider(null)

                        // Recalculate dashboard metrics
                        await calculateDashboardMetrics()
                      } else {
                        throw new Error('Failed to save API key')
                      }
                    } catch (error) {
                      setNotification({
                        type: 'error',
                        message: 'Failed to save API key'
                      })
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowProviderConfigModal(false)
                    setSelectedProvider(null)
                  }}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-500">
                  <Plus className="text-white h-5 w-5" />
                </div>
                Add New AI Provider
              </h2>
              <button
                onClick={() => setShowProviderModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provider Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., openai, claude, gemini"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="provider-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., OpenAI GPT, Claude AI"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="provider-display-name"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the AI provider"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    id="provider-description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="provider-category"
                    >
                      <option value="text">Text AI</option>
                      <option value="multimodal">Multimodal</option>
                      <option value="image">Image AI</option>
                      <option value="code">Code AI</option>
                      <option value="reasoning">Reasoning</option>
                      <option value="audio">Audio AI</option>
                      <option value="video">Video AI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tier
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="provider-tier"
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="ultimate">Ultimate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Endpoint
                    </label>
                    <input
                      type="url"
                      placeholder="https://api.example.com/v1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="provider-endpoint"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supported Models (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="model-1, model-2, model-3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="provider-models"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Model
                    </label>
                    <input
                      type="text"
                      placeholder="default-model-name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="provider-default-model"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requires-api-key"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requires-api-key" className="text-sm font-medium text-gray-700">
                      Requires API Key
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowProviderModal(false)}
                    className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const name = (document.getElementById('provider-name') as HTMLInputElement)?.value
                        const displayName = (document.getElementById('provider-display-name') as HTMLInputElement)?.value
                        const description = (document.getElementById('provider-description') as HTMLTextAreaElement)?.value
                        const category = (document.getElementById('provider-category') as HTMLSelectElement)?.value
                        const tier = (document.getElementById('provider-tier') as HTMLSelectElement)?.value
                        const apiEndpoint = (document.getElementById('provider-endpoint') as HTMLInputElement)?.value
                        const modelsText = (document.getElementById('provider-models') as HTMLInputElement)?.value
                        const defaultModel = (document.getElementById('provider-default-model') as HTMLInputElement)?.value
                        const requiresApiKey = (document.getElementById('requires-api-key') as HTMLInputElement)?.checked

                        if (!name || !displayName) {
                          setNotification({
                            type: 'error',
                            message: 'Please fill in required fields'
                          })
                          return
                        }

                        const supportedModels = modelsText.split(',').map(m => m.trim()).filter(m => m)

                        const response = await fetch('/api/ai-providers', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            name,
                            displayName,
                            description,
                            category,
                            tier,
                            apiEndpoint,
                            supportedModels,
                            defaultModel,
                            requiresApiKey
                          }),
                        })

                        if (response.ok) {
                          const result = await response.json()

                          // Add provider locally
                          const newProvider: AIProvider = {
                            id: result.id || `custom_${Date.now()}`,
                            name,
                            displayName,
                            description,
                            category: category as 'text' | 'image' | 'audio' | 'video' | 'multimodal' | 'code' | 'reasoning',
                            tier: tier as 'free' | 'premium' | 'enterprise' | 'ultimate',
                            icon: '🔧',
                            color: 'from-gray-500 to-gray-600',
                            website: '',
                            documentation: '',
                            supportedModels: supportedModels.map(model => ({
                              id: model,
                              name: model,
                              displayName: model,
                              description: `${model} model`,
                              contextLength: 4096,
                              maxTokens: 2048,
                              capabilities: ['Text Generation'],
                              pricing: { input: 0.001, output: 0.002 },
                              performance: { speed: 80, quality: 80, reasoning: 75 },
                              isRecommended: false,
                              isNew: true,
                              isBeta: false
                            })),
                            defaultModel: defaultModel || supportedModels[0] || 'default',
                            hasApiKey: false,
                            isActive: false,
                            capabilities: ['Text Generation'],
                            pricing: { inputTokens: 0.001, outputTokens: 0.002, currency: 'USD' },
                            limits: { requestsPerMinute: 100, tokensPerRequest: 4096, dailyLimit: 10000 },
                            features: {
                              streaming: false,
                              functionCalling: false,
                              vision: false,
                              audio: false,
                              codeGeneration: false,
                              reasoning: false,
                              multimodal: false
                            },
                            performance: { latency: 1000, reliability: 90, accuracy: 85 }
                          }

                          setProviders(prev => [...prev, newProvider])

                          setNotification({
                            type: 'success',
                            message: 'Provider added successfully!'
                          })
                          setShowProviderModal(false)

                          // Recalculate dashboard metrics
                          await calculateDashboardMetrics()
                        } else {
                          throw new Error('Failed to add provider')
                        }
                      } catch (error) {
                        setNotification({
                          type: 'error',
                          message: 'Failed to add provider'
                        })
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Workflow Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Create New Workflow</h2>
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const workflowData = {
                name: formData.get('name'),
                description: formData.get('description'),
                triggers: (formData.get('triggers') as string)?.split(',').map(t => t.trim()) || [],
                actions: (formData.get('actions') as string)?.split(',').map(a => a.trim()) || []
              }
              await createWorkflow(workflowData)
            }} className="space-y-6">

              <div>
                <label className="block text-sm font-medium text-black mb-2">Workflow Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Customer Support Flow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe what this workflow does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Triggers (comma-separated)</label>
                <input
                  name="triggers"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., New Message, Keyword Match, Time Based"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Actions (comma-separated)</label>
                <input
                  name="actions"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Send Response, Create Ticket, Notify Admin"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWorkflowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Display */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  )
}

export default UltimateAIManagement
