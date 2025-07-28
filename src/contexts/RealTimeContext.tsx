'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface RealTimeData {
  sessions: any[]
  contacts: any[]
  messages: any[]
  analytics: any
  campaigns: any[]
  templates: any[]
  users: any[]
  roles: any[]
  lastUpdated: Record<string, number>
}

interface RealTimeContextType {
  data: RealTimeData
  socket: Socket | null
  isConnected: boolean
  subscribe: (channel: string, callback: (data: any) => void) => void
  unsubscribe: (channel: string) => void
  emit: (event: string, data: any) => void
  updateData: (section: keyof RealTimeData, newData: any) => void
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined)

interface RealTimeProviderProps {
  children: ReactNode
}

export function RealTimeProvider({ children }: RealTimeProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [data, setData] = useState<RealTimeData>({
    sessions: [],
    contacts: [],
    messages: [],
    analytics: {},
    campaigns: [],
    templates: [],
    users: [],
    roles: [],
    lastUpdated: {}
  })

  const [subscribers, setSubscribers] = useState<Record<string, ((data: any) => void)[]>>({})

  useEffect(() => {
    // Centralized port configuration - NO MORE PORT CHANGES!
    const getSocketUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        const protocol = window.location.protocol

        // Always use port 3006 for backend - FIXED!
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:3006'
        } else {
          return `${protocol}//${hostname}:3006`
        }
      }
      return 'http://localhost:3006'
    }

    const socketUrl = getSocketUrl()
    console.log('🔌 Connecting to socket:', socketUrl)

    // Initialize socket connection
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 10
    })

    // Throttling variables to prevent spam
    let lastRequestTime = 0
    const REQUEST_THROTTLE = 3000 // 3 seconds

    newSocket.on('connect', () => {
      console.log('🔌 Real-time connection established')
      setIsConnected(true)

      // Throttled initial data request
      const now = Date.now()
      if (now - lastRequestTime > REQUEST_THROTTLE) {
        lastRequestTime = now
        newSocket.emit('get_sessions')
        // Don't spam all endpoints at once
        setTimeout(() => newSocket.emit('get_contacts'), 1000)
        setTimeout(() => newSocket.emit('get_messages'), 2000)
        setTimeout(() => newSocket.emit('get_analytics'), 3000)
      }
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Real-time connection lost')
      setIsConnected(false)
    })

    newSocket.on('reconnect', () => {
      console.log('🔄 Real-time connection restored')
      setIsConnected(true)

      // Throttled reconnect data request
      const now = Date.now()
      if (now - lastRequestTime > REQUEST_THROTTLE) {
        lastRequestTime = now
        newSocket.emit('get_sessions')
      }
    })

    // Real-time data listeners with throttling
    let lastUpdateTime: Record<string, number> = {}
    const UPDATE_THROTTLE = 1000 // 1 second

    const createThrottledListener = (eventName: string, dataKey: keyof RealTimeData) => {
      return (data: any) => {
        const now = Date.now()
        if (lastUpdateTime[dataKey] && now - lastUpdateTime[dataKey] < UPDATE_THROTTLE) {
          return // Ignore rapid updates
        }
        lastUpdateTime[dataKey] = now

        updateData(dataKey, data)
        notifySubscribers(dataKey as string, data)
      }
    }

    newSocket.on('sessions_updated', createThrottledListener('sessions_updated', 'sessions'))
    newSocket.on('contacts_updated', createThrottledListener('contacts_updated', 'contacts'))
    newSocket.on('messages_updated', createThrottledListener('messages_updated', 'messages'))
    newSocket.on('analytics_updated', createThrottledListener('analytics_updated', 'analytics'))
    newSocket.on('campaigns_updated', createThrottledListener('campaigns_updated', 'campaigns'))
    newSocket.on('templates_updated', createThrottledListener('templates_updated', 'templates'))
    newSocket.on('users_updated', createThrottledListener('users_updated', 'users'))
    newSocket.on('roles_updated', createThrottledListener('roles_updated', 'roles'))

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const updateData = (section: keyof RealTimeData, newData: any) => {
    console.log(`🔄 RealTimeContext: Updating ${section} with data:`, newData)
    setData(prev => {
      const updated = {
        ...prev,
        [section]: newData,
        lastUpdated: {
          ...prev.lastUpdated,
          [section]: Date.now()
        }
      }
      console.log(`✅ RealTimeContext: Updated ${section}, new data:`, updated[section])
      return updated
    })
  }

  const subscribe = (channel: string, callback: (data: any) => void) => {
    setSubscribers(prev => ({
      ...prev,
      [channel]: [...(prev[channel] || []), callback]
    }))
  }

  const unsubscribe = (channel: string, callback?: (data: any) => void) => {
    setSubscribers(prev => {
      if (!callback) {
        // If no callback provided, clear all subscribers for the channel
        return {
          ...prev,
          [channel]: []
        }
      }

      // Remove specific callback
      return {
        ...prev,
        [channel]: (prev[channel] || []).filter(cb => cb !== callback)
      }
    })
  }

  const notifySubscribers = (channel: string, data: any) => {
    const channelSubscribers = subscribers[channel] || []
    channelSubscribers.forEach(callback => callback(data))
  }

  // Throttled emit to prevent spam
  let lastEmitTime: Record<string, number> = {}
  const EMIT_THROTTLE = 2000 // 2 seconds

  const emit = (event: string, data: any) => {
    if (socket) {
      const now = Date.now()
      if (lastEmitTime[event] && now - lastEmitTime[event] < EMIT_THROTTLE) {
        console.log(`⏳ Emit throttled for event: ${event}`)
        return
      }
      lastEmitTime[event] = now
      socket.emit(event, data)
    }
  }

  const value: RealTimeContextType = {
    data,
    socket,
    isConnected,
    subscribe,
    unsubscribe,
    emit,
    updateData
  }

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  )
}

export function useRealTime() {
  const context = useContext(RealTimeContext)
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider')
  }
  return context
}

export function useRealTimeData<T>(section: keyof RealTimeData): T {
  const { data } = useRealTime()
  return data[section] as T
}

export function useRealTimeSubscription(channel: string, callback: (data: any) => void) {
  const { subscribe, unsubscribe } = useRealTime()

  // Use useCallback to memoize the callback
  const memoizedCallback = useCallback(callback, [])

  useEffect(() => {
    subscribe(channel, memoizedCallback)
    return () => unsubscribe(channel)
  }, [channel, memoizedCallback, subscribe, unsubscribe])
}
