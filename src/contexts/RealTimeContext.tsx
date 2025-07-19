'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
    // Auto-detect environment and set appropriate URL
    const getSocketUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        const protocol = window.location.protocol

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://192.168.1.230:3001'
        } else {
          return `${protocol}//${hostname}:3001`
        }
      }
      return 'http://192.168.1.230:3001'
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

    newSocket.on('connect', () => {
      console.log('🔌 Real-time connection established')
      setIsConnected(true)

      // Request all current data on connect
      newSocket.emit('get_sessions')
      newSocket.emit('get_contacts')
      newSocket.emit('get_messages')
      newSocket.emit('get_templates')
      newSocket.emit('get_campaigns')
      newSocket.emit('get_analytics')
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Real-time connection lost')
      setIsConnected(false)
    })

    newSocket.on('reconnect', () => {
      console.log('🔄 Real-time connection restored')
      setIsConnected(true)

      // Request current sessions on reconnect
      newSocket.emit('get_sessions')
    })

    // Real-time data listeners
    newSocket.on('sessions_updated', (sessions) => {
      updateData('sessions', sessions)
      notifySubscribers('sessions', sessions)
    })

    newSocket.on('contacts_updated', (contacts) => {
      updateData('contacts', contacts)
      notifySubscribers('contacts', contacts)
    })

    newSocket.on('messages_updated', (messages) => {
      updateData('messages', messages)
      notifySubscribers('messages', messages)
    })

    newSocket.on('analytics_updated', (analytics) => {
      updateData('analytics', analytics)
      notifySubscribers('analytics', analytics)
    })

    newSocket.on('campaigns_updated', (campaigns) => {
      updateData('campaigns', campaigns)
      notifySubscribers('campaigns', campaigns)
    })

    newSocket.on('templates_updated', (templates) => {
      updateData('templates', templates)
      notifySubscribers('templates', templates)
    })

    newSocket.on('users_updated', (users) => {
      updateData('users', users)
      notifySubscribers('users', users)
    })

    newSocket.on('roles_updated', (roles) => {
      updateData('roles', roles)
      notifySubscribers('roles', roles)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const updateData = (section: keyof RealTimeData, newData: any) => {
    setData(prev => ({
      ...prev,
      [section]: newData,
      lastUpdated: {
        ...prev.lastUpdated,
        [section]: Date.now()
      }
    }))
  }

  const subscribe = (channel: string, callback: (data: any) => void) => {
    setSubscribers(prev => ({
      ...prev,
      [channel]: [...(prev[channel] || []), callback]
    }))
  }

  const unsubscribe = (channel: string) => {
    setSubscribers(prev => ({
      ...prev,
      [channel]: []
    }))
  }

  const notifySubscribers = (channel: string, data: any) => {
    const channelSubscribers = subscribers[channel] || []
    channelSubscribers.forEach(callback => callback(data))
  }

  const emit = (event: string, data: any) => {
    if (socket) {
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
  
  useEffect(() => {
    subscribe(channel, callback)
    return () => unsubscribe(channel)
  }, [channel, callback, subscribe, unsubscribe])
}
