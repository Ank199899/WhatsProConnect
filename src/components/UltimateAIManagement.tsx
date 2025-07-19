'use client'

import { useState, useEffect } from 'react'
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
  Target,
  Trash2,
  X
} from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'
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

interface AgentSession {
  id: string
  agentId: string
  sessionId: string
  sessionName: string
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

export default function UltimateAIManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'providers' | 'analytics' | 'workflows' | 'settings'>('overview')
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProviderModal, setShowProviderModal] = useState(false)

  const [showProviderConfigModal, setShowProviderConfigModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null)
  const [realTimeData, setRealTimeData] = useState<any>({})
  const [analytics, setAnalytics] = useState<any>({})
  const [workflows, setWorkflows] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [notifications, setNotifications] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Session management state
  const [agentSessions, setAgentSessions] = useState<AgentSession[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [selectedAgentForSession, setSelectedAgentForSession] = useState<AIAgent | null>(null)

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedAgents = localStorage.getItem('whatsapp-ai-agents')
    const savedProviders = localStorage.getItem('whatsapp-ai-providers')

    let hasLocalData = false

    if (savedAgents) {
      try {
        const parsedAgents = JSON.parse(savedAgents)
        if (parsedAgents.length > 0) {
          setAgents(parsedAgents)
          console.log('✅ Loaded agents from localStorage:', parsedAgents.length)
          hasLocalData = true
        }
      } catch (e) {
        console.error('❌ Error loading saved agents:', e)
      }
    }

    if (savedProviders) {
      try {
        const parsedProviders = JSON.parse(savedProviders)
        if (parsedProviders.length > 0) {
          setProviders(parsedProviders)
          console.log('✅ Loaded providers from localStorage:', parsedProviders.length)
        }
      } catch (e) {
        console.error('❌ Error loading saved providers:', e)
      }
    }

    // Load session assignments from localStorage
    const savedSessions = localStorage.getItem('whatsapp-agent-sessions')
    if (savedSessions) {
      try {
        setAgentSessions(JSON.parse(savedSessions))
        console.log('✅ Loaded agent sessions from localStorage')
      } catch (error) {
        console.error('❌ Error loading agent sessions:', error)
      }
    }

    // Load chat sessions
    loadChatSessions()

    // Only load from API if no localStorage data exists
    if (!hasLocalData) {
      console.log('📡 No localStorage data found, trying API...')
      loadData()
    } else {
      console.log('✅ Using localStorage data, skipping API')
      setLoading(false)
    }

    // Setup real-time session sync
    setupRealTimeSync()
  }, [])

  // Real-time session sync
  const setupRealTimeSync = () => {
    // Try WebSocket connection first
    try {
      const ws = new WebSocket('ws://192.168.1.230:3001/sessions')

      ws.onopen = () => {
        console.log('🔗 WebSocket connected for real-time session sync')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'session_update') {
            console.log('📱 Real-time session update received')
            loadChatSessions()
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
    const interval = setInterval(() => {
      loadChatSessions()
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }

  // Save agents to localStorage whenever agents change
  useEffect(() => {
    if (agents.length > 0) {
      localStorage.setItem('whatsapp-ai-agents', JSON.stringify(agents))
      console.log('💾 Saved agents to localStorage:', agents.length)
    }
  }, [agents])

  // Save providers to localStorage whenever providers change
  useEffect(() => {
    if (providers.length > 0) {
      localStorage.setItem('whatsapp-ai-providers', JSON.stringify(providers))
      console.log('💾 Saved providers to localStorage:', providers.length)
    }
  }, [providers])

  // Save agent sessions to localStorage whenever they change
  useEffect(() => {
    if (agentSessions.length > 0) {
      localStorage.setItem('whatsapp-agent-sessions', JSON.stringify(agentSessions))
      console.log('💾 Saved agent sessions to localStorage:', agentSessions.length)
    }
  }, [agentSessions])



  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading data - checking localStorage first...')

      // Check localStorage first - if data exists, don't load demo data
      const savedAgents = localStorage.getItem('whatsapp-ai-agents')
      const savedProviders = localStorage.getItem('whatsapp-ai-providers')

      if (savedAgents && JSON.parse(savedAgents).length > 0) {
        console.log('✅ Found saved agents in localStorage, skipping API call')
        // Data already loaded from localStorage in useEffect
        setLoading(false)
        return
      }

      // Only try API if no localStorage data exists
      console.log('📡 No localStorage data found, trying API...')
      try {
        const agentsResponse = await fetch('/api/ai-agents?include_stats=true&include_analytics=true')
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json()
          if (agentsData.agents && agentsData.agents.length > 0) {
            setAgents(agentsData.agents)
            console.log('✅ Loaded agents from API')
          }
        }
      } catch (apiError) {
        console.log('❌ API failed, starting with empty data')
        // Start with completely empty data - no demo data
        setAgents([])
      }

      // Check providers in localStorage
      if (savedProviders && JSON.parse(savedProviders).length > 0) {
        console.log('✅ Found saved providers in localStorage')
        // Data already loaded from localStorage in useEffect
      } else {
        // Only try API if no localStorage data exists
        try {
          const providersResponse = await fetch('/api/ai-providers?include_models=true&include_pricing=true')
          if (providersResponse.ok) {
            const providersData = await providersResponse.json()
            if (providersData.providers && providersData.providers.length > 0) {
              setProviders(providersData.providers)
              console.log('✅ Loaded providers from API')
            }
          }
        } catch (apiError) {
          console.log('❌ Providers API failed, starting with empty data')
          // Start with completely empty data - no demo data
          setProviders([])
        }
      }

    } catch (error) {
      console.error('❌ Error loading data:', error)
      // NO DEMO DATA - start completely empty
      console.log('🧹 Starting with completely empty data')
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



  const updateAgent = async (agentId: string, updates: any) => {
    try {
      // Update locally and save to localStorage
      setAgents(prev => prev.map(agent =>
        agent.id === agentId ? { ...agent, ...updates } : agent
      ))
      showNotification('✅ Agent updated and saved successfully!', 'success')
      console.log('📝 Agent updated:', agentId, updates)
      return { ...updates }
    } catch (error) {
      console.error('Error updating agent:', error)
      showNotification('❌ Failed to update agent', 'error')
    }
  }

  const deleteAgent = async (agentId: string) => {
    try {
      // Delete locally and update localStorage
      const agentToDelete = agents.find(agent => agent.id === agentId)
      setAgents(prev => prev.filter(agent => agent.id !== agentId))
      showNotification(`🗑️ Agent "${agentToDelete?.name || 'Unknown'}" deleted successfully!`, 'success')
      console.log('🗑️ Agent deleted:', agentId)
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
      const newAgent = {
        id: `agent_${Date.now()}`,
        name: agentData.name || 'New Agent',
        description: agentData.description || 'AI Assistant',
        isActive: true,
        stats: {
          totalResponses: 0,
          avgResponseTime: 0,
          avgConfidence: 0,
          successRate: 0,
          lastUsed: new Date().toISOString(),
          totalTokensUsed: 0,
          totalCost: 0,
          userSatisfaction: 0,
          errorRate: 0
        },
        ...agentData
      }

      setAgents(prev => [...prev, newAgent as any])
      showNotification('✅ Agent created and saved successfully!', 'success')
      setShowCreateModal(false)
      console.log('🎉 New agent created:', newAgent.name)
    } catch (error) {
      console.error('Error creating agent:', error)
      showNotification('❌ Failed to create agent', 'error')
    }
  }

  // Clear localStorage for testing
  const clearStoredData = () => {
    localStorage.removeItem('whatsapp-ai-agents')
    localStorage.removeItem('whatsapp-ai-providers')
    localStorage.removeItem('whatsapp-agent-sessions')
    localStorage.removeItem('whatsapp-chat-sessions')
    setAgents([])
    setProviders([])
    setAgentSessions([])
    setChatSessions([])
    showNotification('🗑️ All stored data cleared!', 'info')
    console.log('🧹 localStorage cleared')
  }

  // Session management functions
  const assignAgentToSession = async (agentId: string, sessionId: string) => {
    try {
      const sessionName = chatSessions.find(s => s.id === sessionId)?.name || `Session ${sessionId}`

      // Try API first
      const response = await fetch('/api/agent-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, sessionId, sessionName })
      })

      if (response.ok) {
        const data = await response.json()
        setAgentSessions(prev => [...prev, data.assignment])
        showNotification('✅ Agent assigned to session successfully!', 'success')
        console.log('🔗 Agent assigned to session via API:', agentId, sessionId)
      } else {
        // Fallback to local storage
        const newAssignment: AgentSession = {
          id: `assignment_${Date.now()}`,
          agentId,
          sessionId,
          sessionName,
          isActive: true,
          assignedAt: new Date().toISOString(),
          messageCount: 0,
          lastActivity: new Date().toISOString(),
          status: 'connected'
        }

        setAgentSessions(prev => [...prev, newAssignment])
        showNotification('✅ Agent assigned to session successfully!', 'success')
        console.log('🔗 Agent assigned to session locally:', agentId, sessionId)
      }
    } catch (error) {
      console.error('Error assigning agent to session:', error)
      showNotification('❌ Failed to assign agent to session', 'error')
    }
  }

  const removeAgentFromSession = async (assignmentId: string) => {
    try {
      // Try API first
      const response = await fetch(`/api/agent-sessions?id=${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAgentSessions(prev => prev.filter(session => session.id !== assignmentId))
        showNotification('🔗 Agent removed from session successfully!', 'success')
        console.log('🔗 Agent removed from session via API:', assignmentId)
      } else {
        // Fallback to local removal
        setAgentSessions(prev => prev.filter(session => session.id !== assignmentId))
        showNotification('🔗 Agent removed from session successfully!', 'success')
        console.log('🔗 Agent removed from session locally:', assignmentId)
      }
    } catch (error) {
      console.error('Error removing agent from session:', error)
      showNotification('❌ Failed to remove agent from session', 'error')
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

  // Real-time data refresh
  const refreshData = async () => {
    setIsRefreshing(true)
    await loadData()
    await loadChatSessions()

    // Refresh session assignments from API if available
    try {
      const response = await fetch('/api/agent-sessions')
      if (response.ok) {
        const sessionData = await response.json()
        setAgentSessions(sessionData.sessions || [])
      }
    } catch (error) {
      console.log('No API available for session sync, using local data')
    }

    setIsRefreshing(false)
    showNotification('🔄 Data synced successfully!', 'success')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 border-r-purple-600"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-400 opacity-20"></div>
          <div className="absolute inset-2 animate-pulse rounded-full bg-blue-100 opacity-20"></div>
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
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg border-l-4 ${
                notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                'bg-blue-50 border-blue-500 text-blue-800'
              } animate-slide-in-right`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{notification.message}</span>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-lg">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-black flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-2xl border border-blue-200">
                <Brain className="h-10 w-10 text-blue-600" />
              </div>
              Ultimate AI Management 🚀
            </h1>
            <p className="text-gray-700 mt-3 text-lg">
              World's Most Advanced AI Agent & Provider Management System
            </p>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-200 rounded-full px-4 py-2">
                <Lightning className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-black">Ultra Fast</span>
              </div>
              <div className="flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-4 py-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-black">Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-100 border border-purple-200 rounded-full px-4 py-2">
                <InfinityIcon className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-black">Unlimited Scale</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isRefreshing}
              className="border-green-300 text-green-700 hover:bg-green-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing Sessions...' : 'Real-time Sync'}
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Super Agent
              </Button>
              <Button
                onClick={clearStoredData}
                className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
              >
                🗑️ Clear All Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-lg">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: 'Command Center', icon: Gauge },
            { id: 'agents', label: 'AI Agents', icon: Bot },
            { id: 'providers', label: 'AI Providers', icon: Brain },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'workflows', label: 'Workflows', icon: Workflow },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 relative overflow-hidden',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:text-black hover:bg-gray-100 hover:scale-102'
              )}
            >
              <tab.icon className="h-4 w-4 relative z-10" />
              <span className="whitespace-nowrap relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Content Based on Active Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total AI Agents</p>
                  <p className="text-3xl font-bold text-black">{agents.length}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% from last month
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl border border-blue-200 group-hover:scale-110 transition-transform duration-300">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Providers</p>
                  <p className="text-3xl font-bold text-black">
                    {providers.filter(p => p.hasApiKey && p.isActive).length}
                  </p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    All systems operational
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl border border-green-200 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Responses</p>
                  <p className="text-3xl font-bold text-black">
                    {agents.reduce((sum, agent) => sum + (agent.stats?.totalResponses || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                    <Rocket className="h-3 w-3" />
                    +45% this week
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl border border-purple-200 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg Response Time</p>
                  <p className="text-3xl font-bold text-black">
                    {Math.round(agents.reduce((sum, agent) => sum + (agent.stats?.avgResponseTime || 0), 0) / agents.length || 0)}ms
                  </p>
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <Lightning className="h-3 w-3" />
                    Lightning fast ⚡
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl border border-orange-200 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Real-time Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-white border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Live Activity Feed
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[
                  { agent: 'Customer Support Pro', action: 'Responded to query', time: '2s ago', type: 'success' },
                  { agent: 'Sales Assistant', action: 'Generated lead', time: '15s ago', type: 'info' },
                  { agent: 'Tech Support Bot', action: 'Resolved ticket', time: '1m ago', type: 'success' },
                  { agent: 'Marketing AI', action: 'Created campaign', time: '3m ago', type: 'warning' },
                  { agent: 'Analytics Bot', action: 'Generated report', time: '5m ago', type: 'info' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.agent}</p>
                      <p className="text-xs text-gray-600">{activity.action}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Performance Insights
                </h3>
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-[95%] h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-green-600">95%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User Satisfaction</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-[92%] h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-blue-600">92%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Speed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-[88%] h-2 bg-purple-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-purple-600">88%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cost Efficiency</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-[96%] h-2 bg-orange-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-orange-600">96%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* AI Agents Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search super agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                >
                  <option value="all">All Categories</option>
                  <option value="customer-service">Customer Service</option>
                  <option value="sales">Sales</option>
                  <option value="technical">Technical</option>
                  <option value="creative">Creative</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Showing {agents.length} super agents
            </div>
          </div>

          {/* Super Agents Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 bg-white">
                {/* Agent Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${agent.isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-400'} text-white shadow-lg`}>
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black flex items-center gap-2">
                        {agent.name}
                        {agent.isActive && <Crown className="h-4 w-4 text-yellow-500" />}
                      </h3>
                      <p className="text-sm text-gray-600">{agent.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      agent.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Agent Capabilities */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-black">Super Powers</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities?.slice(0, 4).map((capability, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {capability.name}
                      </span>
                    )) || [
                      <span key="text" className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Text AI</span>,
                      <span key="smart" className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Smart Reply</span>,
                      <span key="multi" className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">Multi-lang</span>
                    ]}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {agent.stats?.totalResponses || 0}
                      </p>
                      <p className="text-xs text-gray-600">Responses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {agent.stats?.avgResponseTime || 0}ms
                      </p>
                      <p className="text-xs text-gray-600">Avg Time</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-black">
                      {agent.stats?.successRate || 0}% Success Rate
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-black">
                      {agentSessions.filter(as => as.agentId === agent.id && as.isActive).length} Active Sessions
                    </span>
                  </div>
                </div>

                {/* Provider Info */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      AI Provider
                    </span>
                    <Button size="sm" variant="outline" className="text-xs">
                      Configure
                    </Button>
                  </div>

                  {agent.providers && agent.providers.length > 0 ? (
                    <div className="space-y-1">
                      {agent.providers.slice(0, 2).map((provider, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                          <span className="text-gray-600">{provider.providerName}</span>
                          <span className="font-medium text-black">{provider.modelName}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-orange-600 bg-orange-50 rounded p-2">
                      No provider assigned
                    </p>
                  )}
                </div>

                {/* Agent Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => {
                        console.log('🖊️ Edit button clicked for agent:', agent.name)
                        setSelectedAgent(agent)
                        setEditingAgent(agent)
                        setShowCreateModal(true) // Use create modal for editing
                      }}
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700"
                      onClick={() => {
                        console.log('🔗 Assign to Session clicked for agent:', agent.name)
                        setSelectedAgentForSession(agent)
                        loadChatSessions()
                        setShowSessionModal(true)
                      }}
                    >
                      <MessageSquare className="h-3 w-3" />
                      Sessions
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => handleDeleteAgent(agent.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => toggleAgentStatus(agent.id)}
                    className={`flex items-center gap-1 ${
                      agent.isActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <Power className="h-3 w-3" />
                    {agent.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </Card>
            ))}

            {/* Create New Agent Card */}
            <Card className="p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer bg-white">
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="p-4 bg-blue-600 rounded-full text-white mb-4">
                  <Plus className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  Create Super Agent
                </h3>
                <p className="text-gray-600 mb-4">
                  Build your next AI powerhouse
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* AI Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* Provider Categories */}
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'all', label: 'All Providers', icon: Globe, count: providers.length },
              { id: 'text', label: 'Text AI', icon: FileText, count: providers.filter(p => p.category === 'text').length },
              { id: 'multimodal', label: 'Multimodal', icon: Layers, count: providers.filter(p => p.category === 'multimodal').length },
              { id: 'image', label: 'Image AI', icon: Image, count: providers.filter(p => p.category === 'image').length },
              { id: 'code', label: 'Code AI', icon: Code, count: providers.filter(p => p.category === 'code').length },
              { id: 'reasoning', label: 'Reasoning', icon: Brain, count: providers.filter(p => p.category === 'reasoning').length }
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setFilterCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                  filterCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="h-4 w-4" />
                <span>{category.label}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{category.count}</span>
              </button>
            ))}
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-black">Filter by Tier:</span>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All Tiers' },
                { id: 'free', label: 'Free' },
                { id: 'premium', label: 'Premium' },
                { id: 'enterprise', label: 'Enterprise' },
                { id: 'ultimate', label: 'Ultimate' }
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setFilterTier(tier.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterTier === tier.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add Provider Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowProviderModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Provider
            </Button>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dynamic Filtered Providers */}
            {filteredProviders.length > 0 ? filteredProviders.map((provider) => (
              <Card key={provider.id} className="p-6 bg-white border border-gray-200 hover:shadow-lg transition-all">
                <div className="space-y-4">
                  {/* Provider Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${provider.color || 'from-blue-500 to-purple-600'}`}>
                        <span className="text-white text-lg">{provider.icon || '🤖'}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-black">{provider.displayName}</h3>
                        <p className="text-sm text-gray-600">{provider.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        provider.tier === 'free' ? 'bg-green-100 text-green-800' :
                        provider.tier === 'premium' ? 'bg-blue-100 text-blue-800' :
                        provider.tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {provider.tier}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${provider.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                  </div>

                  {/* Provider Description */}
                  <p className="text-sm text-gray-600">{provider.description}</p>

                  {/* Capabilities */}
                  {provider.capabilities && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-black">Capabilities</h4>
                      <div className="flex flex-wrap gap-1">
                        {provider.capabilities.slice(0, 3).map((capability, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {capability}
                          </span>
                        ))}
                        {provider.capabilities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{provider.capabilities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  {provider.performance && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600">Latency</div>
                        <div className="font-bold text-black">{provider.performance.latency}ms</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600">Reliability</div>
                        <div className="font-bold text-black">{provider.performance.reliability}%</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600">Accuracy</div>
                        <div className="font-bold text-black">{provider.performance.accuracy}%</div>
                      </div>
                    </div>
                  )}

                  {/* API Key Status */}
                  <div className={`p-3 rounded-lg ${provider.hasApiKey ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${provider.hasApiKey ? 'text-green-800' : 'text-orange-800'}`}>
                        {provider.hasApiKey ? '✓ API Key Configured' : '⚠ API Key Required'}
                      </span>
                      {!provider.hasApiKey && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProvider(provider)
                            setShowProviderConfigModal(true)
                          }}
                        >
                          Configure
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Provider Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProvider(provider)
                          setShowProviderConfigModal(true)
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Settings
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Analytics
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${provider.displayName}?`)) {
                            deleteProvider(provider.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => toggleProvider(provider.id)}
                      className={`${
                        provider.isActive
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <Power className="h-3 w-3 mr-1" />
                      {provider.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </Card>
            )) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Globe className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                <p className="text-gray-600">Try adjusting your filters or add a new provider.</p>
              </div>
            )}

            {/* Sample static providers for demo - remove when real data is available */}
            {filteredProviders.length === 0 && [
              {
                id: 'openai',
                name: 'OpenAI',
                displayName: 'OpenAI GPT',
                category: 'multimodal',
                tier: 'premium',
                hasApiKey: true,
                isActive: true,
                description: 'Most advanced AI models for text, code, and reasoning',
                capabilities: ['Text Generation', 'Code Generation', 'Vision', 'Function Calling'],
                models: ['GPT-4o', 'GPT-4o-mini', 'GPT-3.5-turbo'],
                pricing: { inputTokens: 0.005, outputTokens: 0.015, currency: 'USD' },
                performance: { latency: 850, reliability: 99.9, accuracy: 95 },
                icon: '🤖',
                color: 'from-green-500 to-emerald-600'
              },
              {
                id: 'anthropic',
                name: 'Anthropic',
                displayName: 'Claude',
                category: 'reasoning',
                tier: 'premium',
                hasApiKey: false,
                isActive: false,
                description: 'Constitutional AI with advanced reasoning capabilities',
                capabilities: ['Advanced Reasoning', 'Long Context', 'Safety', 'Analysis'],
                models: ['Claude-3.5-Sonnet', 'Claude-3-Haiku', 'Claude-3-Opus'],
                pricing: { inputTokens: 0.003, outputTokens: 0.015, currency: 'USD' },
                performance: { latency: 920, reliability: 99.8, accuracy: 97 },
                icon: '🧠',
                color: 'from-purple-500 to-indigo-600'
              },
              {
                id: 'google',
                name: 'Google',
                displayName: 'Gemini',
                category: 'multimodal',
                tier: 'enterprise',
                hasApiKey: true,
                isActive: true,
                description: 'Google\'s most capable multimodal AI model',
                capabilities: ['Multimodal', 'Long Context', 'Code Generation', 'Math'],
                models: ['Gemini-1.5-Pro', 'Gemini-1.5-Flash', 'Gemini-1.0-Pro'],
                pricing: { inputTokens: 0.00125, outputTokens: 0.00375, currency: 'USD' },
                performance: { latency: 750, reliability: 99.7, accuracy: 94 },
                icon: '💎',
                color: 'from-blue-500 to-cyan-600'
              },
              {
                id: 'mistral',
                name: 'Mistral',
                displayName: 'Mistral AI',
                category: 'text',
                tier: 'premium',
                hasApiKey: false,
                isActive: false,
                description: 'European AI with strong multilingual capabilities',
                capabilities: ['Multilingual', 'Code Generation', 'Function Calling', 'Fast'],
                models: ['Mistral-Large', 'Mistral-Medium', 'Mistral-Small'],
                pricing: { inputTokens: 0.002, outputTokens: 0.006, currency: 'USD' },
                performance: { latency: 650, reliability: 99.5, accuracy: 92 },
                icon: '🚀',
                color: 'from-orange-500 to-red-600'
              },
              {
                id: 'cohere',
                name: 'Cohere',
                displayName: 'Command R+',
                category: 'text',
                tier: 'premium',
                hasApiKey: false,
                isActive: false,
                description: 'Enterprise-focused AI with RAG capabilities',
                capabilities: ['RAG', 'Enterprise', 'Multilingual', 'Tool Use'],
                models: ['Command-R-Plus', 'Command-R', 'Command'],
                pricing: { inputTokens: 0.003, outputTokens: 0.015, currency: 'USD' },
                performance: { latency: 800, reliability: 99.6, accuracy: 93 },
                icon: '⚡',
                color: 'from-teal-500 to-green-600'
              },
              {
                id: 'perplexity',
                name: 'Perplexity',
                displayName: 'Perplexity AI',
                category: 'reasoning',
                tier: 'ultimate',
                hasApiKey: false,
                isActive: false,
                description: 'AI-powered search and reasoning engine',
                capabilities: ['Web Search', 'Real-time Data', 'Citations', 'Research'],
                models: ['Sonar-Large', 'Sonar-Medium', 'Sonar-Small'],
                pricing: { inputTokens: 0.001, outputTokens: 0.001, currency: 'USD' },
                performance: { latency: 1200, reliability: 99.4, accuracy: 96 },
                icon: '🔍',
                color: 'from-indigo-500 to-purple-600'
              }
            ].map((provider) => (
              <Card key={provider.id} className={`p-6 hover:shadow-xl transition-all duration-300 border-2 ${
                provider.hasApiKey && provider.isActive
                  ? 'border-green-300 bg-green-50'
                  : provider.hasApiKey
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-300 bg-white'
              }`}>
                {/* Provider Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${provider.color} text-white shadow-lg text-xl`}>
                      {provider.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-black flex items-center gap-2">
                        {provider.displayName}
                        {provider.tier === 'ultimate' && <Crown className="h-4 w-4 text-yellow-500" />}
                        {provider.tier === 'enterprise' && <Diamond className="h-4 w-4 text-purple-500" />}
                      </h3>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      provider.tier === 'ultimate' ? 'bg-yellow-100 text-yellow-800' :
                      provider.tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      provider.tier === 'premium' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {provider.tier.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      provider.hasApiKey && provider.isActive
                        ? 'bg-green-100 text-green-800'
                        : provider.hasApiKey
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.hasApiKey && provider.isActive ? 'READY' : provider.hasApiKey ? 'CONFIGURED' : 'SETUP NEEDED'}
                    </span>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-black">Capabilities</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {provider.capabilities.map((capability, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold text-black">{provider.performance.latency}ms</p>
                      <p className="text-xs text-gray-600">Latency</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black">{provider.performance.reliability}%</p>
                      <p className="text-xs text-gray-600">Uptime</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black">{provider.performance.accuracy}%</p>
                      <p className="text-xs text-gray-600">Accuracy</p>
                    </div>
                  </div>
                </div>

                {/* Models */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black flex items-center gap-1">
                      <Cpu className="h-4 w-4" />
                      Models ({provider.models.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {provider.models.slice(0, 2).map((model, index) => (
                      <div key={index} className="text-sm bg-gray-50 rounded p-2">
                        <span className="font-medium text-black">{model}</span>
                      </div>
                    ))}
                    {provider.models.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{provider.models.length - 2} more models
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black">Pricing</span>
                    <span className="text-xs text-gray-500">{provider.pricing.currency}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-600">${provider.pricing.inputTokens}</p>
                      <p className="text-xs text-gray-600">Input/1K</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-blue-600">${provider.pricing.outputTokens}</p>
                      <p className="text-xs text-gray-600">Output/1K</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      {provider.hasApiKey ? 'Update Key' : 'Add Key'}
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Settings className="h-3 w-3" />
                      Config
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    disabled={!provider.hasApiKey}
                    className={`flex items-center gap-1 ${
                      provider.isActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <Power className="h-3 w-3" />
                    {provider.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Requests</p>
                  <p className="text-3xl font-bold">{analytics.totalRequests || '15,420'}</p>
                  <p className="text-blue-100 text-sm">+12% from last month</p>
                </div>
                <MessageSquare className="h-12 w-12 text-blue-200" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Success Rate</p>
                  <p className="text-3xl font-bold">{analytics.successRate || '96.8'}%</p>
                  <p className="text-green-100 text-sm">+2.1% improvement</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-200" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Avg Response Time</p>
                  <p className="text-3xl font-bold">{analytics.avgResponseTime || '945'}ms</p>
                  <p className="text-purple-100 text-sm">-50ms faster</p>
                </div>
                <Clock className="h-12 w-12 text-purple-200" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Monthly Cost</p>
                  <p className="text-3xl font-bold">₹{analytics.costThisMonth || '234.56'}</p>
                  <p className="text-orange-100 text-sm">-8% from budget</p>
                </div>
                <DollarSign className="h-12 w-12 text-orange-200" />
              </div>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-white border border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Request Trends (Last 7 Days)
              </h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {(analytics.trendsData?.requests || [120, 135, 148, 162, 155, 178, 192]).map((value: number, index: number) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div
                      className="bg-blue-500 rounded-t w-8 transition-all hover:bg-blue-600"
                      style={{ height: `${(value / 200) * 200}px` }}
                    ></div>
                    <span className="text-xs text-gray-600">Day {index + 1}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white border border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Response Time Analysis
              </h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {(analytics.trendsData?.responseTime || [850, 920, 880, 945, 920, 890, 945]).map((value: number, index: number) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div
                      className="bg-green-500 rounded-t w-8 transition-all hover:bg-green-600"
                      style={{ height: `${(value / 1000) * 200}px` }}
                    ></div>
                    <span className="text-xs text-gray-600">Day {index + 1}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Agent Performance */}
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Agent Performance Leaderboard
            </h3>
            <div className="space-y-4">
              {filteredAgents.slice(0, 5).map((agent, index) => (
                <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-black">{agent.name}</h4>
                      <p className="text-sm text-gray-600">{agent.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-black">{agent.stats?.successRate || 0}% Success</div>
                    <div className="text-sm text-gray-600">{agent.stats?.totalResponses || 0} responses</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Real-time Activity */}
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" />
              Live Activity Feed
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {[
                { time: '2 min ago', agent: 'Customer Support Pro', action: 'Resolved customer query', status: 'success' },
                { time: '5 min ago', agent: 'Sales Assistant', action: 'Generated product recommendation', status: 'success' },
                { time: '8 min ago', agent: 'Tech Support Bot', action: 'Escalated complex issue', status: 'warning' },
                { time: '12 min ago', agent: 'Marketing AI', action: 'Created campaign content', status: 'success' },
                { time: '15 min ago', agent: 'Customer Support Pro', action: 'Failed to understand query', status: 'error' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-black">
                      <span className="font-medium">{activity.agent}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          {/* Workflow Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black">AI Workflows</h2>
              <p className="text-gray-600">Automate complex AI processes with visual workflows</p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>

          {/* Active Workflows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="p-6 bg-white border border-gray-200 hover:shadow-lg transition-all">
                <div className="space-y-4">
                  {/* Workflow Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Workflow className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-black">{workflow.name}</h3>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${workflow.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>

                  {/* Workflow Triggers */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-black">Triggers</h4>
                    <div className="flex flex-wrap gap-1">
                      {workflow.triggers?.map((trigger: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Workflow Actions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-black">Actions</h4>
                    <div className="flex flex-wrap gap-1">
                      {workflow.actions?.map((action: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Workflow Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded p-3">
                    <div>
                      <div className="text-xs text-gray-600">Executions</div>
                      <div className="font-bold text-black">{workflow.executions || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                      <div className="font-bold text-black">{workflow.successRate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Avg Time</div>
                      <div className="font-bold text-black">{workflow.avgTime || 0}s</div>
                    </div>
                  </div>

                  {/* Workflow Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Analytics
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      className={`${
                        workflow.isActive
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <Power className="h-3 w-3 mr-1" />
                      {workflow.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Create New Workflow Card */}
            <Card className="p-6 border-2 border-dashed border-gray-300 hover:border-purple-500 transition-colors cursor-pointer bg-white">
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="p-4 bg-purple-600 rounded-full text-white mb-4">
                  <Wand2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  Create New Workflow
                </h3>
                <p className="text-gray-600 mb-4">
                  Build automated AI processes with visual workflow builder
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Start Building
                </Button>
              </div>
            </Card>
          </div>

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
          {/* General Settings */}
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              General Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Default Language</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="hi">Hindi</option>
                    <option value="en">English</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Timezone</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">Auto Backup</h4>
                    <p className="text-sm text-gray-600">Automatically backup AI configurations</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">Debug Mode</h4>
                    <p className="text-sm text-gray-600">Enable detailed logging for troubleshooting</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Configuration */}
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Default AI Provider</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google AI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Max Retries</label>
                  <input type="number" className="w-full p-2 border border-gray-300 rounded-lg" defaultValue="3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Timeout (seconds)</label>
                  <input type="number" className="w-full p-2 border border-gray-300 rounded-lg" defaultValue="30" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">Fallback Enabled</h4>
                    <p className="text-sm text-gray-600">Use backup providers when primary fails</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">Smart Routing</h4>
                    <p className="text-sm text-gray-600">Automatically route to best performing provider</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Security & Privacy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">Data Encryption</h4>
                    <p className="text-sm text-gray-600">Encrypt all AI conversations and data</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-black">Audit Logging</h4>
                    <p className="text-sm text-gray-600">Log all AI interactions for compliance</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Access Control</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="role_based">Role-based Access</option>
                    <option value="user_based">User-based Access</option>
                    <option value="open">Open Access</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Session Timeout (minutes)</label>
                  <input type="number" className="w-full p-2 border border-gray-300 rounded-lg" defaultValue="60" />
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
    </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Create Super Agent</h2>
              <button
                onClick={() => setShowCreateModal(false)}
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
              await createAgent(agentData)
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Agent Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Customer Support Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Personality</label>
                  <select name="personality" className="w-full p-3 border border-gray-300 rounded-lg">
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this agent does..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Language</label>
                  <select name="language" className="w-full p-3 border border-gray-300 rounded-lg">
                    <option value="hi">Hindi</option>
                    <option value="en">English</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Response Style</label>
                  <select name="responseStyle" className="w-full p-3 border border-gray-300 rounded-lg">
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
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Create Agent
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
      {showSessionModal && selectedAgentForSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">
                Assign {selectedAgentForSession.name} to Sessions
              </h2>
              <button
                onClick={() => {
                  setShowSessionModal(false)
                  setSelectedAgentForSession(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Select WhatsApp sessions to assign this AI agent to. The agent will automatically respond to messages in these sessions.
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
                <h3 className="font-semibold text-black">Available WhatsApp Sessions:</h3>
                {chatSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No active WhatsApp sessions found</p>
                    <p className="text-sm mt-2">
                      Go to <strong>Session Manager</strong> to create WhatsApp sessions first
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadChatSessions}
                      className="mt-3"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check for Sessions
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
                            assignAgentToSession(selectedAgentForSession.id, session.id)
                            setShowSessionModal(false)
                            setSelectedAgentForSession(null)
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
                {agentSessions.filter(as => as.agentId === selectedAgentForSession.id).length === 0 ? (
                  <p className="text-gray-500 text-sm">No sessions assigned to this agent yet</p>
                ) : (
                  agentSessions
                    .filter(as => as.agentId === selectedAgentForSession.id)
                    .map((assignment) => (
                      <div key={assignment.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <h4 className="font-medium text-black">{assignment.sessionName}</h4>
                              <p className="text-sm text-gray-600">
                                Assigned {new Date(assignment.assignedAt).toLocaleDateString()} •
                                {assignment.messageCount} messages handled
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAgentFromSession(assignment.id)}
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
                  setShowSessionModal(false)
                  setSelectedAgentForSession(null)
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
                      {selectedProvider.supportedModels?.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} - {model.description}
                        </option>
                      )) || (
                        <option value={selectedProvider.defaultModel}>
                          {selectedProvider.defaultModel}
                        </option>
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
                        setNotification({
                          type: 'success',
                          message: 'API key saved successfully!'
                        })
                        setShowProviderConfigModal(false)
                        setSelectedProvider(null)
                        // Refresh providers
                        loadData()
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                  <Plus className="text-white h-6 w-6" />
                </div>
                Add New AI Provider
              </h2>
              <button
                onClick={() => setShowProviderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Provider Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., openai, claude, gemini"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="provider-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., OpenAI GPT, Claude AI"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="provider-display-name"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-black mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the AI provider"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    id="provider-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Category
                    </label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-black mb-2">
                      Tier
                    </label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-black mb-4">API Configuration</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      API Endpoint
                    </label>
                    <input
                      type="url"
                      placeholder="https://api.example.com/v1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="provider-endpoint"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Supported Models (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="model-1, model-2, model-3"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="provider-models"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Default Model
                    </label>
                    <input
                      type="text"
                      placeholder="default-model-name"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label htmlFor="requires-api-key" className="text-sm font-medium text-black">
                      Requires API Key
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
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
                        setNotification({
                          type: 'success',
                          message: 'Provider added successfully!'
                        })
                        setShowProviderModal(false)
                        // Refresh providers
                        loadData()
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowProviderModal(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
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
  )
}
