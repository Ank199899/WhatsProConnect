'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Users,
  Phone,
  RefreshCw,
  TrendingUp,
  Database,
  Activity
} from 'lucide-react'
import '../styles/animations.css'

export default function NewDashboard() {
  const [data, setData] = useState({
    sessions: [],
    contacts: [],
    messages: [],
    loading: false,
    lastUpdated: ''
  })

  const fetchData = async () => {
    setData(prev => ({ ...prev, loading: true }))

    try {
      console.log('🔄 Fetching real-time dashboard data...')

      // Fetch real WhatsApp sessions first
      const sessionsRes = await fetch('/api/whatsapp/sessions')
      const sessionsData = await sessionsRes.json()
      const sessions = sessionsData.success ? sessionsData.sessions : []

      // Get backend URL for direct API calls
      const backendUrl = process.env.NEXT_PUBLIC_WHATSAPP_BACKEND_URL || 'http://localhost:3006'
      console.log('🔧 Using backend URL:', backendUrl)

      // Fetch real chats and contacts from backend server
      const [contactsRes, chatsRes] = await Promise.all([
        fetch(`${backendUrl}/api/contacts`),
        // If we have sessions, get real chats for the first session
        sessions.length > 0
          ? fetch(`${backendUrl}/api/sessions/${sessions[0].id}/chats`)
          : Promise.resolve({ json: () => ({ success: true, chats: [] }) })
      ])

      const contactsData = await contactsRes.json()
      const chatsData = await chatsRes.json()

      // Extract data from API responses
      const contacts = contactsData.success ? contactsData.contacts : []
      const chats = chatsData.success ? chatsData.chats : []

      // Convert chats to messages format for dashboard display
      const messages = chats.map(chat => ({
        id: chat.lastMessage?.id || chat.id,
        from: chat.name,
        body: chat.lastMessage?.body || 'No messages',
        timestamp: chat.lastMessage?.timestamp || Date.now(),
        fromMe: chat.lastMessage?.fromMe || false,
        unreadCount: chat.unreadCount || 0,
        chatId: chat.id
      }))

      console.log('📊 Real-time data fetched:', {
        sessions: sessions.length,
        contacts: contacts.length,
        chats: chats.length,
        messages: messages.length,
        sessionsSource: sessionsData.source,
        chatsSource: chatsData.isRealData ? 'WhatsApp Client' : 'Database',
        backendUrl
      })

      setData({
        sessions: sessions || [],
        contacts: contacts || [],
        messages: messages || [],
        loading: false,
        lastUpdated: new Date().toLocaleTimeString()
      })
    } catch (error) {
      console.error('❌ Error fetching real-time data:', error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  const syncMessages = async (sessionId) => {
    try {
      console.log('🔄 Syncing messages for session:', sessionId)
      
      const response = await fetch('/api/sync-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Messages synced:', result)
        await fetchData() // Refresh data
        alert('Messages synced successfully!')
      }
    } catch (error) {
      console.error('❌ Sync error:', error)
      alert('Failed to sync messages')
    }
  }

  useEffect(() => {
    fetchData()
    // Auto refresh every 5 seconds for real-time data
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-6 min-h-screen relative overflow-hidden">
      {/* Simple Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100"></div>
      </div>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2B4C8C] via-[#4A6FA5] to-[#1E40AF] rounded-xl shadow-lg p-6 backdrop-blur-sm transform transition-all duration-300 relative overflow-hidden group">
        {/* Fast Single Line Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-0 left-0 h-[2px] w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{
              x: ['-96px', 'calc(100% + 96px)']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-white">WhatsPro Connect Dashboard</h1>
            <p className="text-white/90 mt-1">
              Real-time data • Auto-refresh every 5 seconds • Last updated: {data.lastUpdated || 'Never'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-300">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
            {data.loading ? 'Updating...' : 'Auto-sync Active'}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#2B4C8C] rounded-lg shadow-lg p-6 text-white transform hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Active Sessions</p>
              <p className="text-2xl font-bold text-white">{data.sessions.length}</p>
              <p className="text-xs text-white/70 mt-1">
                {data.loading ? 'Updating...' : 'Real-time'}
              </p>
            </div>
            <Phone className="w-8 h-8 text-white/70 group-hover:text-white transition-all duration-300" />
          </div>
        </div>

        <div className="bg-[#4A6FA5] rounded-lg shadow-lg p-6 text-white transform hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Total Contacts</p>
              <p className="text-2xl font-bold text-white">{data.contacts.length}</p>
              <p className="text-xs text-white/70 mt-1">
                {data.loading ? 'Syncing...' : 'Synced'}
              </p>
            </div>
            <Users className="w-8 h-8 text-white/70 group-hover:text-white transition-all duration-300" />
          </div>
        </div>

        <div className="bg-[#1E40AF] rounded-lg shadow-lg p-6 text-white transform hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Total Messages</p>
              <p className="text-2xl font-bold text-white">{data.messages.length}</p>
              <p className="text-xs text-white/70 mt-1">
                {data.loading ? 'Loading...' : 'Live count'}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-white/70 group-hover:text-white transition-all duration-300" />
          </div>
        </div>

        <div className="bg-[#4A6FA5] rounded-lg shadow-lg p-6 text-white transform hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">System Status</p>
              <p className="text-2xl font-bold text-white">
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
                  Live
                </span>
              </p>
              <p className="text-xs text-white/70 mt-1">
                Auto-refresh: 5s
              </p>
            </div>
            <Activity className="w-8 h-8 text-white/70 group-hover:text-white transition-all duration-300" />
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 transform hover:shadow-xl transition-all duration-300 relative border-2 border-[#2B4C8C]/20 hover:border-[#2B4C8C]/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#2B4C8C]">WhatsApp Sessions</h2>
          <div className="flex items-center text-sm text-[#4A6FA5]">
            <span className="w-2 h-2 bg-[#4A6FA5] rounded-full mr-2 animate-pulse"></span>
            Real-time
          </div>
        </div>
        {data.sessions.length > 0 ? (
          <div className="space-y-4">
            {data.sessions.map((session, index) => (
              <div key={session.id || index} className={`group flex items-center justify-between p-6 transform hover:shadow-md transition-all duration-300 glass bg-white/50 rounded-lg relative overflow-hidden`}>
                {/* Moving Border Line */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                  <motion.div
                    className="absolute w-6 h-[2px] bg-[#1a365d] rounded-full"
                    initial={{ x: 0, y: 0 }}
                    animate={{
                      x: [0, "calc(100% - 24px)", "calc(100% - 24px)", 0, 0],
                      y: [0, 0, "calc(100% - 2px)", "calc(100% - 2px)", 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium text-gray-900">{session.name || 'Unknown Session'}</h3>
                    <p className="text-sm text-gray-600">{session.phoneNumber || 'No phone number'}</p>
                    <span className={`inline-block px-3 py-1 text-xs rounded-full transition-all duration-300 ${
                      session.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status || 'unknown'}
                    </span>
                  </div>
                  <button
                    onClick={() => syncMessages(session.id)}
                    className="px-4 py-2 bg-[#2B4C8C] text-white text-sm rounded-lg hover:bg-[#4A6FA5] transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Sync Messages
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Phone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No sessions found</p>
          </div>
        )}
      </div>

      {/* Contacts */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 transform hover:shadow-xl transition-all duration-300 relative border-2 border-[#4A6FA5]/20 hover:border-[#4A6FA5]/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#4A6FA5]">Recent Contacts</h2>
          <div className="flex items-center text-sm text-[#2B4C8C]">
            <span className="w-2 h-2 bg-[#2B4C8C] rounded-full mr-2 animate-pulse"></span>
            Live sync
          </div>
        </div>
        {data.contacts.length > 0 ? (
          <div className="space-y-4">
            {data.contacts.slice(0, 5).map((contact, index) => (
              <div key={contact.id || index} className={`group flex items-center justify-between p-6 transform hover:shadow-md transition-all duration-300 glass bg-white/50 rounded-lg relative overflow-hidden`}>
                {/* Moving Border Line */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                  <motion.div
                    className="absolute w-6 h-[2px] bg-[#2d4a6b] rounded-full"
                    initial={{ x: 0, y: 0 }}
                    animate={{
                      x: [0, "calc(100% - 24px)", "calc(100% - 24px)", 0, 0],
                      y: [0, 0, "calc(100% - 2px)", "calc(100% - 2px)", 0]
                    }}
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
                <div className="relative z-10 flex items-center space-x-4 w-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2B4C8C] to-[#4A6FA5] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(contact.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{contact.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600">{contact.phone_number}</p>
                    <p className="text-xs text-gray-500">
                      {contact.is_group ? 'Group' : 'Individual'} • {new Date(contact.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No contacts found</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 transform hover:shadow-xl transition-all duration-300 relative border-2 border-[#1E40AF]/20 hover:border-[#1E40AF]/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1E40AF]">Recent Messages</h2>
          <div className="flex items-center text-sm text-[#2B4C8C]">
            <span className="w-2 h-2 bg-[#2B4C8C] rounded-full mr-2 animate-pulse"></span>
            Live feed
          </div>
        </div>
        {data.messages.length > 0 ? (
          <div className="space-y-4">
            {data.messages.slice(0, 5).map((message, index) => (
              <div key={message.id || index} className={`group p-6 hover:bg-gray-50/50 transform hover:shadow-md transition-all duration-300 glass bg-white/50 rounded-lg relative overflow-hidden`}>
                {/* Moving Border Line */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                  <motion.div
                    className="absolute w-6 h-[2px] bg-[#0f2a44] rounded-full"
                    initial={{ x: 0, y: 0 }}
                    animate={{
                      x: [0, "calc(100% - 24px)", "calc(100% - 24px)", 0, 0],
                      y: [0, 0, "calc(100% - 2px)", "calc(100% - 2px)", 0]
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
                <div className="relative z-10 flex items-start justify-between w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#4A6FA5] to-[#1E40AF] rounded-full flex items-center justify-center text-white font-bold">
                        {(message.from || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{message.from}</span>
                          {message.unreadCount > 0 && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full animate-pulse">
                              {message.unreadCount} unread
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs rounded-full transition-all duration-300 ${
                            message.fromMe ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {message.fromMe ? 'Sent' : 'Received'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {message.timestamp ? new Date(message.timestamp * 1000).toLocaleString() : 'Unknown time'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-900 leading-relaxed">{message.body || 'No content'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No messages found</p>
            <p className="text-sm">Use "Sync Messages" to create sample data</p>
          </div>
        )}
      </div>


    </div>
  )
}
