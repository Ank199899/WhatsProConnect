'use client'

import { useEffect, useState } from 'react'
import { useRealTime } from '@/contexts/RealTimeContext'

interface UseRealTimeSyncOptions {
  section: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useRealTimeSync<T>(options: UseRealTimeSyncOptions) {
  const { data, socket, isConnected, subscribe, unsubscribe, emit } = useRealTime()
  const [localData, setLocalData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { section, autoRefresh = true, refreshInterval = 30000 } = options

  // Subscribe to real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return

    console.log(`🔄 Subscribing to ${section} updates`)

    const handleUpdate = (newData: T[]) => {
      console.log(`📡 Received ${section} update:`, newData)
      setLocalData(newData)
      setLoading(false)
      setError(null)
    }

    const handleError = (error: any) => {
      console.error(`❌ Error in ${section}:`, error)
      setError(error.message || 'Unknown error')
      setLoading(false)
    }

    // Subscribe to updates
    subscribe(`${section}_updated`, handleUpdate)
    subscribe(`${section}_error`, handleError)

    // Request initial data
    emit(`get_${section}`, {})

    return () => {
      unsubscribe(`${section}_updated`)
      unsubscribe(`${section}_error`)
    }
  }, [socket, isConnected, section, subscribe, unsubscribe, emit])

  // Auto-refresh mechanism
  useEffect(() => {
    if (!autoRefresh || !socket || !isConnected) return

    const interval = setInterval(() => {
      console.log(`🔄 Auto-refreshing ${section} data`)
      emit(`get_${section}`, {})
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, socket, isConnected, section, emit])

  // Manual refresh function
  const refresh = () => {
    if (socket && isConnected) {
      console.log(`🔄 Manual refresh of ${section} data`)
      setLoading(true)
      emit(`get_${section}`, {})
    }
  }

  // Sync with context data
  useEffect(() => {
    const contextData = data[section as keyof typeof data] as T[]
    if (contextData && contextData.length > 0) {
      setLocalData(contextData)
      setLoading(false)
    }
  }, [data, section])

  return {
    data: localData,
    loading,
    error,
    refresh,
    isConnected
  }
}

// Specific hooks for different data types
export function useRealTimeSessions() {
  return useRealTimeSync<any>({ section: 'sessions' })
}

export function useRealTimeContacts() {
  return useRealTimeSync<any>({ section: 'contacts' })
}

export function useRealTimeMessages() {
  return useRealTimeSync<any>({ section: 'messages' })
}

export function useRealTimeTemplates() {
  return useRealTimeSync<any>({ section: 'templates' })
}

export function useRealTimeCampaigns() {
  return useRealTimeSync<any>({ section: 'campaigns' })
}

export function useRealTimeAnalytics() {
  return useRealTimeSync<any>({ section: 'analytics' })
}
