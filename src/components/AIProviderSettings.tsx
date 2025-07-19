'use client'

import { useState, useEffect } from 'react'
import { Settings, Key, Plus, Trash2, Eye, EyeOff, CheckCircle, AlertTriangle, Bot } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'

interface AIProvider {
  id: string
  name: string
  displayName: string
  description: string
  supportedModels: string[]
  defaultModel: string
  requiresApiKey: boolean
  isActive: boolean
  hasApiKey?: boolean
}

interface APIKey {
  id: string
  providerId: string
  providerName: string
  isActive: boolean
  createdAt: string
}

export default function AIProviderSettings() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({})
  
  // Form states
  const [apiKeyForm, setApiKeyForm] = useState({
    apiKey: '',
    organizationId: '',
    projectId: ''
  })

  useEffect(() => {
    loadProviders()
    loadAPIKeys()
  }, [])

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/ai-providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  const loadAPIKeys = async () => {
    try {
      const response = await fetch('/api/ai-providers/keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys || [])
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAPIKey = async () => {
    if (!selectedProvider || !apiKeyForm.apiKey.trim()) return

    try {
      const response = await fetch('/api/ai-providers/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          apiKey: apiKeyForm.apiKey,
          additionalConfig: {
            organizationId: apiKeyForm.organizationId || undefined,
            projectId: apiKeyForm.projectId || undefined
          }
        })
      })

      if (response.ok) {
        await loadAPIKeys()
        await loadProviders()
        setShowKeyModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving API key:', error)
    }
  }

  const handleDeleteAPIKey = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const response = await fetch(`/api/ai-providers/keys/${providerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadAPIKeys()
        await loadProviders()
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
    }
  }

  const resetForm = () => {
    setApiKeyForm({
      apiKey: '',
      organizationId: '',
      projectId: ''
    })
    setSelectedProvider(null)
  }

  const openKeyModal = (provider: AIProvider) => {
    setSelectedProvider(provider)
    setShowKeyModal(true)
  }

  const toggleKeyVisibility = (keyId: string) => {
    setShowKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

  const getProviderStatus = (provider: AIProvider) => {
    const hasKey = apiKeys.some(key => key.providerId === provider.id && key.isActive)
    return {
      hasKey,
      status: hasKey ? 'configured' : 'needs-key',
      statusText: hasKey ? 'Configured' : 'API Key Required'
    }
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
            <Settings className="h-6 w-6 text-blue-600" />
            AI Provider Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure AI providers and manage API keys
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Providers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{providers.length}</p>
            </div>
            <Bot className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configured</p>
              <p className="text-2xl font-bold text-green-600">
                {providers.filter(p => getProviderStatus(p).hasKey).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Need Setup</p>
              <p className="text-2xl font-bold text-orange-600">
                {providers.filter(p => !getProviderStatus(p).hasKey).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Providers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((provider) => {
          const status = getProviderStatus(provider)
          const providerKey = apiKeys.find(key => key.providerId === provider.id)
          
          return (
            <Card key={provider.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${status.hasKey ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{provider.displayName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{provider.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status.hasKey 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {status.statusText}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Default Model:</span>
                  <span className="font-medium">{provider.defaultModel}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Supported Models:</span>
                  <span className="font-medium">{provider.supportedModels.length}</span>
                </div>

                {/* API Key Section */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Key className="h-4 w-4" />
                      API Key
                    </span>
                    {status.hasKey ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openKeyModal(provider)}
                        >
                          Update
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAPIKey(provider.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openKeyModal(provider)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Key
                      </Button>
                    )}
                  </div>
                  
                  {status.hasKey && providerKey && (
                    <div className="text-xs text-gray-500">
                      Added: {new Date(providerKey.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Supported Models */}
                <div className="border-t pt-3 mt-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Available Models:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {provider.supportedModels.map((model, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
        
        {providers.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No AI Providers</h3>
            <p className="text-gray-600 dark:text-gray-400">AI providers will be loaded automatically</p>
          </div>
        )}
      </div>

      {/* API Key Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => {
          setShowKeyModal(false)
          resetForm()
        }}
        title={`Configure ${selectedProvider?.displayName} API Key`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key *
            </label>
            <div className="relative">
              <Input
                type={showKey[selectedProvider?.id || ''] ? 'text' : 'password'}
                value={apiKeyForm.apiKey}
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, apiKey: e.target.value })}
                placeholder="Enter your API key"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility(selectedProvider?.id || '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showKey[selectedProvider?.id || ''] ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {selectedProvider?.name === 'openai' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization ID (Optional)
              </label>
              <Input
                value={apiKeyForm.organizationId}
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, organizationId: e.target.value })}
                placeholder="org-xxxxxxxxxx"
              />
            </div>
          )}

          {selectedProvider?.name === 'gemini' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project ID (Optional)
              </label>
              <Input
                value={apiKeyForm.projectId}
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, projectId: e.target.value })}
                placeholder="your-project-id"
              />
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              How to get API key:
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {selectedProvider?.name === 'openai' && (
                <p>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI API Keys</a> to create your API key</p>
              )}
              {selectedProvider?.name === 'gemini' && (
                <p>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a> to get your API key</p>
              )}
              {selectedProvider?.name === 'claude' && (
                <p>Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a> to get your API key</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowKeyModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAPIKey}
              disabled={!apiKeyForm.apiKey.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save API Key
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
