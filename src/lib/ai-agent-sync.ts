'use client'

// Real-time sync service for AI Agent management
export class AIAgentSyncService {
  private static instance: AIAgentSyncService
  private listeners: Map<string, Set<Function>> = new Map()
  private eventSource: EventSource | null = null

  private constructor() {
    this.initializeEventSource()
  }

  static getInstance(): AIAgentSyncService {
    if (!AIAgentSyncService.instance) {
      AIAgentSyncService.instance = new AIAgentSyncService()
    }
    return AIAgentSyncService.instance
  }

  private initializeEventSource() {
    // Initialize Server-Sent Events for real-time updates
    if (typeof window !== 'undefined') {
      this.eventSource = new EventSource('/api/ai-agents/events')
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.notifyListeners(data.type, data.payload)
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        // Reconnect after 5 seconds
        setTimeout(() => {
          this.initializeEventSource()
        }, 5000)
      }
    }
  }

  // Subscribe to specific events
  subscribe(eventType: string, callback: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(eventType)
        }
      }
    }
  }

  // Notify all listeners of an event
  private notifyListeners(eventType: string, payload: any) {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(payload)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      })
    }
  }

  // Emit events (for manual triggering)
  emit(eventType: string, payload: any) {
    this.notifyListeners(eventType, payload)
  }

  // Broadcast agent updates
  broadcastAgentUpdate(agentId: string, action: 'created' | 'updated' | 'deleted', data?: any) {
    this.emit('agent_update', { agentId, action, data })
  }

  // Broadcast session assignment updates
  broadcastSessionAssignment(sessionId: string, agentId: string, action: 'assigned' | 'unassigned' | 'toggled', data?: any) {
    this.emit('session_assignment', { sessionId, agentId, action, data })
  }

  // Broadcast chat-level agent updates
  broadcastChatAgentUpdate(sessionId: string, contactNumber: string, action: 'enabled' | 'disabled' | 'assigned', data?: any) {
    this.emit('chat_agent_update', { sessionId, contactNumber, action, data })
  }

  // Cleanup
  destroy() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.listeners.clear()
  }
}

// React hook for using AI Agent sync
import { useEffect, useCallback } from 'react'

export function useAIAgentSync() {
  const syncService = AIAgentSyncService.getInstance()

  const subscribeToAgentUpdates = useCallback((callback: (data: any) => void) => {
    return syncService.subscribe('agent_update', callback)
  }, [syncService])

  const subscribeToSessionAssignments = useCallback((callback: (data: any) => void) => {
    return syncService.subscribe('session_assignment', callback)
  }, [syncService])

  const subscribeToChatAgentUpdates = useCallback((callback: (data: any) => void) => {
    return syncService.subscribe('chat_agent_update', callback)
  }, [syncService])

  const broadcastAgentUpdate = useCallback((agentId: string, action: 'created' | 'updated' | 'deleted', data?: any) => {
    syncService.broadcastAgentUpdate(agentId, action, data)
  }, [syncService])

  const broadcastSessionAssignment = useCallback((sessionId: string, agentId: string, action: 'assigned' | 'unassigned' | 'toggled', data?: any) => {
    syncService.broadcastSessionAssignment(sessionId, agentId, action, data)
  }, [syncService])

  const broadcastChatAgentUpdate = useCallback((sessionId: string, contactNumber: string, action: 'enabled' | 'disabled' | 'assigned', data?: any) => {
    syncService.broadcastChatAgentUpdate(sessionId, contactNumber, action, data)
  }, [syncService])

  useEffect(() => {
    return () => {
      // Cleanup is handled by the singleton service
    }
  }, [])

  return {
    subscribeToAgentUpdates,
    subscribeToSessionAssignments,
    subscribeToChatAgentUpdates,
    broadcastAgentUpdate,
    broadcastSessionAssignment,
    broadcastChatAgentUpdate
  }
}

// Utility functions for common sync operations
export const AIAgentSyncUtils = {
  // Sync agent data across components
  syncAgentData: async (agentId: string) => {
    try {
      const response = await fetch(`/api/ai-agents/${agentId}`)
      if (response.ok) {
        const data = await response.json()
        AIAgentSyncService.getInstance().broadcastAgentUpdate(agentId, 'updated', data.agent)
        return data.agent
      }
    } catch (error) {
      console.error('Error syncing agent data:', error)
    }
    return null
  },

  // Sync session assignments
  syncSessionAssignments: async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai-agents/assignments?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        AIAgentSyncService.getInstance().emit('session_assignments_updated', { sessionId, assignments: data.assignments })
        return data.assignments
      }
    } catch (error) {
      console.error('Error syncing session assignments:', error)
    }
    return []
  },

  // Sync chat agent settings
  syncChatAgentSettings: async (sessionId: string, contactNumber: string) => {
    try {
      const response = await fetch(`/api/ai-agents/chat-settings?session_id=${sessionId}&contact_number=${contactNumber}`)
      if (response.ok) {
        const data = await response.json()
        AIAgentSyncService.getInstance().broadcastChatAgentUpdate(sessionId, contactNumber, 'assigned', data.settings)
        return data.settings
      }
    } catch (error) {
      console.error('Error syncing chat agent settings:', error)
    }
    return null
  }
}
