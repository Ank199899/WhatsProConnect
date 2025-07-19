'use client'

import { useState, useEffect } from 'react'
import { 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Users, 
  MessageSquare, 
  Activity,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Clock,
  Target,
  Brain,
  Sparkles,
  TrendingUp,
  Eye,
  ToggleLeft,
  ToggleRight,
  Cpu,
  Database,
  Shield,
  Star,
  ArrowRight,
  Filter,
  Search,
  MoreVertical,
  Link,
  Unlink,
  RefreshCw,
  Power,
  Key
} from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'

interface AIAgent {
  id: string
  name: string
  description: string
  personality: string
  language: string
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
  providers?: AgentProvider[]
  stats?: AgentStats
}

interface AgentProvider {
  id: string
  providerId: string
  providerName: string
  modelName: string
  priority: number
  isActive: boolean
  fallbackEnabled: boolean
}

interface AgentStats {
  totalResponses: number
  avgResponseTime: number
  avgConfidence: number
  successRate: number
  lastUsed: string
}

interface AIProvider {
  id: string
  name: string
  displayName: string
  supportedModels: string[]
  defaultModel: string
  hasApiKey: boolean
  isActive: boolean
  description: string
}

interface Session {
  id: string
  name: string
  phoneNumber: string
  status: string
  isActive: boolean
}

interface AgentSession {
  id: string
  agentId: string
  sessionId: string
  isEnabled: boolean
  priority: number
  agentName: string
  sessionName: string
}

export default function AdvancedAIAgentManagement() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [agentSessions, setAgentSessions] = useState<AgentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    personality: 'helpful',
    language: 'hi',
    responseStyle: 'professional',
    autoReplyEnabled: true,
    responseDelayMin: 1,
    responseDelayMax: 5,
    maxResponseLength: 500,
    keywords: '',
    systemPrompt: '',
    providerId: '',
    modelName: ''
  })

  const [assignmentForm, setAssignmentForm] = useState({
    sessionIds: [] as string[],
    priority: 1,
    isEnabled: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load AI Agents with stats
      const agentsResponse = await fetch('/api/ai-agents?include_stats=true')
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        setAgents(agentsData.agents || [])
      }

      // Load Sessions
      const sessionsResponse = await fetch('/api/sessions')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData.sessions || [])
      }

      // Load AI Providers
      const providersResponse = await fetch('/api/ai-providers')
      if (providersResponse.ok) {
        const providersData = await providersResponse.json()
        setProviders(providersData.providers || [])
      }

      // Load Agent-Session assignments
      const assignmentsResponse = await fetch('/api/ai-agents/assignments')
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAgentSessions(assignmentsData.assignments || [])
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async () => {
    try {
      const response = await fetch('/api/ai-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        })
      })

      if (response.ok) {
        await loadData()
        setShowCreateModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating agent:', error)
    }
  }

  const handleUpdateAgent = async () => {
    if (!editingAgent) return

    try {
      const response = await fetch(`/api/ai-agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        })
      })

      if (response.ok) {
        await loadData()
        setShowCreateModal(false)
        setEditingAgent(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error updating agent:', error)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      const response = await fetch(`/api/ai-agents/${agentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error deleting agent:', error)
    }
  }

  const handleToggleAgent = async (agentId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/ai-agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error toggling agent:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      personality: 'helpful',
      language: 'hi',
      responseStyle: 'professional',
      autoReplyEnabled: true,
      responseDelayMin: 1,
      responseDelayMax: 5,
      maxResponseLength: 500,
      keywords: '',
      systemPrompt: '',
      providerId: '',
      modelName: ''
    })
  }

  const openEditModal = (agent: AIAgent) => {
    setEditingAgent(agent)
    setFormData({
      name: agent.name,
      description: agent.description,
      personality: agent.personality,
      language: agent.language,
      responseStyle: agent.responseStyle,
      autoReplyEnabled: agent.autoReplyEnabled,
      responseDelayMin: agent.responseDelayMin,
      responseDelayMax: agent.responseDelayMax,
      maxResponseLength: agent.maxResponseLength,
      keywords: agent.keywords.join(', '),
      systemPrompt: agent.systemPrompt,
      providerId: agent.providers?.[0]?.providerId || '',
      modelName: agent.providers?.[0]?.modelName || ''
    })
    setShowCreateModal(true)
  }

  const openProviderModal = (agent: AIAgent) => {
    setSelectedAgent(agent)
    setShowProviderModal(true)
  }

  const openAssignModal = (agent: AIAgent) => {
    setSelectedAgent(agent)
    const agentAssignments = agentSessions.filter(as => as.agentId === agent.id)
    setAssignmentForm({
      sessionIds: agentAssignments.map(as => as.sessionId),
      priority: agentAssignments[0]?.priority || 1,
      isEnabled: agentAssignments[0]?.isEnabled || true
    })
    setShowAssignModal(true)
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && agent.isActive) ||
                         (filterStatus === 'inactive' && !agent.isActive)
    return matchesSearch && matchesFilter
  })

  const getAgentStatusColor = (agent: AIAgent) => {
    if (!agent.isActive) return 'text-gray-500'
    const hasProvider = agent.providers && agent.providers.length > 0
    const hasApiKey = hasProvider && providers.find(p => p.id === agent.providers![0].providerId)?.hasApiKey
    
    if (hasProvider && hasApiKey) return 'text-green-600'
    if (hasProvider && !hasApiKey) return 'text-orange-600'
    return 'text-red-600'
  }

  const getAgentStatusText = (agent: AIAgent) => {
    if (!agent.isActive) return 'Inactive'
    const hasProvider = agent.providers && agent.providers.length > 0
    const hasApiKey = hasProvider && providers.find(p => p.id === agent.providers![0].providerId)?.hasApiKey
    
    if (hasProvider && hasApiKey) return 'Ready'
    if (hasProvider && !hasApiKey) return 'No API Key'
    return 'No Provider'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            AI Agent Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage AI agents with multiple provider support
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{agents.length}</p>
            </div>
            <Bot className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Agents</p>
              <p className="text-2xl font-bold text-green-600">
                {agents.filter(a => a.isActive).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configured Providers</p>
              <p className="text-2xl font-bold text-purple-600">
                {providers.filter(p => p.hasApiKey).length}
              </p>
            </div>
            <Brain className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-orange-600">
                {new Set(agentSessions.filter(as => as.isEnabled).map(as => as.sessionId)).size}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAgents.length} of {agents.length} agents
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => {
          const assignedSessions = agentSessions.filter(as => as.agentId === agent.id && as.isEnabled)
          const statusColor = getAgentStatusColor(agent)
          const statusText = getAgentStatusText(agent)

          return (
            <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Agent Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${agent.isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} bg-opacity-10`}>
                    {statusText}
                  </span>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Agent Stats */}
              {agent.stats && (
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {agent.stats.totalResponses}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Responses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {agent.stats.avgResponseTime}ms
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Avg Time</p>
                  </div>
                </div>
              )}

              {/* Provider Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    AI Provider
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openProviderModal(agent)}
                    className="text-xs"
                  >
                    Configure
                  </Button>
                </div>

                {agent.providers && agent.providers.length > 0 ? (
                  <div className="space-y-1">
                    {agent.providers.map((provider, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {provider.providerName}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {provider.modelName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-orange-600">No provider assigned</p>
                )}
              </div>

              {/* Session Assignments */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Sessions ({assignedSessions.length})
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAssignModal(agent)}
                    className="text-xs"
                  >
                    Manage
                  </Button>
                </div>

                {assignedSessions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {assignedSessions.slice(0, 3).map((assignment) => (
                      <span key={assignment.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {assignment.sessionName}
                      </span>
                    ))}
                    {assignedSessions.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{assignedSessions.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No sessions assigned</p>
                )}
              </div>

              {/* Agent Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(agent)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleToggleAgent(agent.id, agent.isActive)}
                  className={`flex items-center gap-1 ${
                    agent.isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {agent.isActive ? (
                    <>
                      <Power className="h-3 w-3" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Power className="h-3 w-3" />
                      Enable
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )
        })}

        {filteredAgents.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No agents found' : 'No AI agents yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first AI agent to get started'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Agent
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Agent Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingAgent(null)
          resetForm()
        }}
        title={editingAgent ? 'Edit AI Agent' : 'Create New AI Agent'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Agent Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter agent name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="hi">Hindi</option>
                <option value="en">English</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the agent's purpose"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Personality
              </label>
              <select
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="helpful">Helpful</option>
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="empathetic">Empathetic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Response Style
              </label>
              <select
                value={formData.responseStyle}
                onChange={(e) => setFormData({ ...formData, responseStyle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>
          </div>

          {/* AI Provider Selection */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                AI Provider *
              </label>
              <select
                value={formData.providerId}
                onChange={(e) => {
                  const provider = providers.find(p => p.id === e.target.value)
                  setFormData({
                    ...formData,
                    providerId: e.target.value,
                    modelName: provider?.defaultModel || ''
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Provider</option>
                {providers.filter(p => p.hasApiKey && p.isActive).map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.displayName}
                  </option>
                ))}
              </select>
              {providers.filter(p => p.hasApiKey && p.isActive).length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  No providers configured. Configure providers first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model *
              </label>
              <select
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={!formData.providerId}
              >
                <option value="">Select Model</option>
                {formData.providerId && providers.find(p => p.id === formData.providerId)?.supportedModels.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Keywords (comma-separated)
            </label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="help, support, question, issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              System Prompt
            </label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              placeholder="Enter system prompt for the AI agent..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Delay (sec)
              </label>
              <Input
                type="number"
                value={formData.responseDelayMin}
                onChange={(e) => setFormData({ ...formData, responseDelayMin: parseInt(e.target.value) || 1 })}
                min="1"
                max="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Delay (sec)
              </label>
              <Input
                type="number"
                value={formData.responseDelayMax}
                onChange={(e) => setFormData({ ...formData, responseDelayMax: parseInt(e.target.value) || 5 })}
                min="1"
                max="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Length
              </label>
              <Input
                type="number"
                value={formData.maxResponseLength}
                onChange={(e) => setFormData({ ...formData, maxResponseLength: parseInt(e.target.value) || 500 })}
                min="100"
                max="2000"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoReply"
              checked={formData.autoReplyEnabled}
              onChange={(e) => setFormData({ ...formData, autoReplyEnabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoReply" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Auto Reply
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setEditingAgent(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingAgent ? handleUpdateAgent : handleCreateAgent}
              disabled={!formData.name || !formData.providerId || !formData.modelName}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingAgent ? 'Update Agent' : 'Create Agent'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


