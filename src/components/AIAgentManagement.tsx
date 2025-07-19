'use client'

import { useState, useEffect } from 'react'
import { Plus, Bot, Settings, Trash2, Power, Users, MessageSquare, BarChart3, Edit3 } from 'lucide-react'
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
}

interface Session {
  id: string
  name: string
  phoneNumber: string
  status: string
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

interface AIProvider {
  id: string
  name: string
  displayName: string
  supportedModels: string[]
  defaultModel: string
  hasApiKey: boolean
  isActive: boolean
}

export default function AIAgentManagement() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [agentSessions, setAgentSessions] = useState<AgentSession[]>([])
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load AI Agents
      const agentsResponse = await fetch('/api/ai-agents')
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
        setEditingAgent(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error updating agent:', error)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this AI agent?')) return

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
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error toggling agent:', error)
    }
  }

  const handleAssignToSession = async (agentId: string, sessionId: string) => {
    try {
      const response = await fetch('/api/ai-agents/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, sessionId })
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error assigning agent to session:', error)
    }
  }

  const handleUnassignFromSession = async (agentId: string, sessionId: string) => {
    try {
      const response = await fetch('/api/ai-agents/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, sessionId })
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error unassigning agent from session:', error)
    }
  }

  const handleToggleSessionAssignment = async (agentId: string, sessionId: string, isEnabled: boolean) => {
    try {
      const response = await fetch('/api/ai-agents/assignments/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, sessionId, isEnabled })
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error toggling session assignment:', error)
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
      systemPrompt: agent.systemPrompt
    })
  }

  const getAgentSessions = (agentId: string) => {
    return agentSessions.filter(as => as.agentId === agentId)
  }

  const getSessionAgent = (sessionId: string) => {
    return agentSessions.find(as => as.sessionId === sessionId && as.isEnabled)
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
            Create and manage AI agents for automated responses
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
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
              <p className="text-2xl font-bold text-green-600">{agents.filter(a => a.isActive).length}</p>
            </div>
            <Power className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Sessions</p>
              <p className="text-2xl font-bold text-purple-600">{agentSessions.filter(as => as.isEnabled).length}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available Sessions</p>
              <p className="text-2xl font-bold text-orange-600">{sessions.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* AI Agents List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${agent.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(agent)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleAgent(agent.id, !agent.isActive)}
                  className={agent.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                >
                  <Power className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteAgent(agent.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Personality:</span>
                <span className="font-medium capitalize">{agent.personality}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Language:</span>
                <span className="font-medium uppercase">{agent.language}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Response Style:</span>
                <span className="font-medium capitalize">{agent.responseStyle}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Auto Reply:</span>
                <span className={`font-medium ${agent.autoReplyEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {agent.autoReplyEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {agent.keywords.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.keywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Session Assignments */}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Sessions</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedAgent(agent)
                      setShowAssignModal(true)
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                </div>

                <div className="space-y-2">
                  {getAgentSessions(agent.id).map((assignment) => {
                    const session = sessions.find(s => s.id === assignment.sessionId)
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${assignment.isEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-sm font-medium">{session?.name || 'Unknown Session'}</span>
                          <span className="text-xs text-gray-500">{session?.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleSessionAssignment(agent.id, assignment.sessionId, !assignment.isEnabled)}
                            className="text-xs"
                          >
                            {assignment.isEnabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnassignFromSession(agent.id, assignment.sessionId)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  {getAgentSessions(agent.id).length === 0 && (
                    <p className="text-sm text-gray-500 italic">No sessions assigned</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {agents.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No AI Agents</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first AI agent to get started</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Agent Modal */}
      <Modal
        isOpen={showCreateModal || editingAgent !== null}
        onClose={() => {
          setShowCreateModal(false)
          setEditingAgent(null)
          resetForm()
        }}
        title={editingAgent ? 'Edit AI Agent' : 'Create AI Agent'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Agent Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter agent name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter agent description"
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
                <option value="casual">Casual</option>
                <option value="enthusiastic">Enthusiastic</option>
              </select>
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
              Response Style
            </label>
            <select
              value={formData.responseStyle}
              onChange={(e) => setFormData({ ...formData, responseStyle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
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
                min="50"
                max="2000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Keywords (comma separated)
            </label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="help, support, question, problem"
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

          {/* AI Provider Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                AI Provider
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
                  No providers configured. <button
                    type="button"
                    onClick={() => setShowProviderModal(true)}
                    className="underline"
                  >
                    Configure providers
                  </button>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingAgent ? 'Update Agent' : 'Create Agent'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Agent to Session Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false)
          setSelectedAgent(null)
        }}
        title={`Assign ${selectedAgent?.name} to Sessions`}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Select sessions to assign this agent to:
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessions.map((session) => {
              const isAssigned = getAgentSessions(selectedAgent?.id || '').some(as => as.sessionId === session.id)
              const currentAgent = getSessionAgent(session.id)

              return (
                <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${session.status === 'ready' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{session.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{session.phoneNumber}</p>
                      {currentAgent && currentAgent.agentId !== selectedAgent?.id && (
                        <p className="text-xs text-orange-600">Already has agent: {currentAgent.agentName}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isAssigned ? "outline" : "default"}
                    onClick={() => {
                      if (isAssigned) {
                        handleUnassignFromSession(selectedAgent?.id || '', session.id)
                      } else {
                        handleAssignToSession(selectedAgent?.id || '', session.id)
                      }
                    }}
                    className={isAssigned ? 'text-red-600 hover:text-red-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                  >
                    {isAssigned ? 'Unassign' : 'Assign'}
                  </Button>
                </div>
              )
            })}

            {sessions.length === 0 && (
              <p className="text-center text-gray-500 py-8">No sessions available</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignModal(false)
                setSelectedAgent(null)
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Provider Settings Modal */}
      <Modal
        isOpen={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        title="AI Provider Settings"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Configure AI providers to use with your agents:
          </p>

          <div className="space-y-3">
            {providers.map(provider => (
              <div key={provider.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${provider.hasApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{provider.displayName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {provider.hasApiKey ? 'Configured' : 'API Key Required'}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {provider.supportedModels.length} models
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              To configure AI providers and add API keys, go to Settings → AI Provider Settings
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowProviderModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
