'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  MessageCircle, 
  Star, 
  Grid3X3, 
  List, 
  Tag,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MoreVertical,
  UserPlus,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  FolderPlus,
  Folder,
  UserCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Share2,
  Copy,
  Archive,
  Bookmark,
  Shield,
  Globe,
  Building,
  Briefcase,
  Heart,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import Button from '@/components/ui/Button'
import { useRealTime, useRealTimeData, useRealTimeSubscription } from '@/contexts/RealTimeContext'
import ContactModals from '@/components/ContactModals'
import { useSharedSessions } from '@/hooks/useSharedSessions'

interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  tags: string[]
  notes?: string
  lastMessageAt?: string
  messageCount: number
  isBlocked: boolean
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  sessionId?: string
  profilePicture?: string
  status: 'active' | 'inactive' | 'blocked'
  customFields: Record<string, any>
  groupId?: string
  isOnline?: boolean
  lastSeen?: string
  country?: string
  city?: string
  company?: string
  jobTitle?: string
  website?: string
  socialMedia?: {
    linkedin?: string
    twitter?: string
    instagram?: string
  }
}

interface ContactGroup {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  contactCount: number
  createdAt: string
  updatedAt: string
  isDefault?: boolean
}

const defaultGroups: ContactGroup[] = [
  { id: 'all', name: 'All Contacts', description: 'All your contacts', color: 'bg-blue-500', icon: 'Users', contactCount: 0, createdAt: '', updatedAt: '', isDefault: true }
]

const contactTags = [
  'Customer', 'Lead', 'VIP', 'Support', 'Partner', 'Vendor', 'Friend', 'Family', 'Business', 'Personal',
  'Hot Lead', 'Cold Lead', 'Prospect', 'Client', 'Supplier', 'Investor', 'Media', 'Government', 'NGO'
]

export default function ContactsManagement() {
  // Theme hook
  const { colors, isDark } = useTheme()

  // Session management
  const { sessions, loading: sessionsLoading } = useSharedSessions()

  // Real-time context with fallbacks
  let emit: any = () => {}
  let isConnected = false
  let realtimeContacts: Contact[] = []

  try {
    const realTimeContext = useRealTime()
    emit = realTimeContext?.emit || (() => {})
    isConnected = realTimeContext?.isConnected || false
    realtimeContacts = useRealTimeData<Contact[]>('contacts') || []
  } catch (error) {
    console.log('RealTime context not available, using fallbacks')
  }

  // Get current active session
  const getCurrentSessionId = () => {
    const activeSessions = sessions.filter(s => s.status === 'connected' && s.isReady)
    if (activeSessions.length > 0) {
      return activeSessions[0].id
    }
    // Fallback to any ready session
    const readySessions = sessions.filter(s => s.isReady)
    if (readySessions.length > 0) {
      return readySessions[0].id
    }
    return null
  }

  // State management - NO LOCAL STORAGE, only database server
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [bulkAction, setBulkAction] = useState('')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tags: [] as string[],
    notes: '',
    customFields: {} as Record<string, any>,
    groupId: '',
    company: '',
    jobTitle: '',
    website: '',
    country: '',
    city: '',
    sessionId: ''
  })

  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500',
    icon: 'Folder'
  })

  // Real-time subscription for contacts updates
  try {
    useRealTimeSubscription('contacts', (updatedContacts) => {
      console.log('📞 Contacts updated in real-time:', updatedContacts.length)
      setContacts(updatedContacts)
      setTimeout(() => updateGroupCounts(updatedContacts), 0)
    })
  } catch (error) {
    console.log('RealTime subscription not available')
  }

  // Auto-sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        syncContacts()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isConnected])

  // Sync with real-time data
  useEffect(() => {
    if (realtimeContacts && Array.isArray(realtimeContacts) && realtimeContacts.length > 0) {
      console.log('📞 Syncing real-time contacts:', realtimeContacts.length)
      setContacts(realtimeContacts)
      setTimeout(() => updateGroupCounts(realtimeContacts), 0)
    }
  }, [realtimeContacts])

  // NO LOCAL STORAGE - All data saved to database server only

  useEffect(() => {
    loadContacts()
    loadGroups()
  }, [])

  // Update group contact counts
  const updateGroupCounts = (contactsList: Contact[]) => {
    if (!contactsList || !Array.isArray(contactsList)) {
      console.warn('updateGroupCounts called with invalid contactsList:', contactsList)
      return
    }

    setGroups(prevGroups => {
      if (!prevGroups || !Array.isArray(prevGroups)) {
        console.warn('prevGroups is not an array:', prevGroups)
        return prevGroups
      }

      return prevGroups.map(group => {
        if (group.id === 'all') {
          return { ...group, contactCount: contactsList.length }
        }
        const count = contactsList.filter(contact =>
          contact && (
            contact.groupId === group.id ||
            (contact.tags && Array.isArray(contact.tags) && contact.tags.some(tag => tag.toLowerCase() === group.name.toLowerCase()))
          )
        ).length
        return { ...group, contactCount: count }
      })
    })
  }

  const loadContacts = async () => {
    setLoading(true)
    setSyncStatus('syncing')
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()
      console.log('📞 Loaded contacts from API:', data)
      if (data.success && data.contacts) {
        const contactsArray = Array.isArray(data.contacts) ? data.contacts : []
        console.log('📋 Setting contacts:', contactsArray.length)
        setContacts(contactsArray)
        // Update group counts after setting contacts
        setTimeout(() => updateGroupCounts(contactsArray), 0)
        emit('contacts_updated', contactsArray)
        setSyncStatus('success')
        setLastSyncTime(new Date())
      } else {
        console.warn('No contacts data received or invalid format')
        setContacts([])
        setSyncStatus('success')
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
      setSyncStatus('error')
      setContacts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      const data = await response.json()

      if (data.success && data.groups.length > 0) {
        console.log('📁 Loaded groups from database:', data.groups)
        // Convert database format to frontend format
        const frontendGroups = data.groups.map((group: any) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          color: group.color,
          icon: group.icon,
          contactCount: group.contact_count,
          createdAt: group.created_at,
          updatedAt: group.updated_at,
          isDefault: group.is_default
        }))
        setGroups(frontendGroups)
      } else {
        // If no groups in database, use default groups and save them
        console.log('📁 No groups found in database, saving defaults')
        setGroups(defaultGroups)
        // Save default groups to database
        for (const group of defaultGroups) {
          await fetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(group)
          })
        }
      }
    } catch (error) {
      console.error('Error loading groups:', error)
      setGroups(defaultGroups)
    }
  }

  const syncContacts = async () => {
    setSyncStatus('syncing')
    try {
      // Get active WhatsApp sessions
      const sessionsResponse = await fetch('/api/sessions')
      const sessionsData = await sessionsResponse.json()

      if (sessionsData.success && sessionsData.sessions.length > 0) {
        const activeSessions = sessionsData.sessions.filter((s: any) => s.status === 'ready')

        if (activeSessions.length > 0) {
          // Sync contacts from first active session
          const sessionId = activeSessions[0].id

          const syncResponse = await fetch('/api/contacts/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, force: true })
          })

          const syncData = await syncResponse.json()

          if (syncData.success) {
            console.log(`✅ Synced ${syncData.stats?.synced || 0} contacts`)

            // Update local contacts
            const syncedContacts = Array.isArray(syncData.contacts) ? syncData.contacts : []
            setContacts(syncedContacts)
            // Update group counts after setting contacts
            setTimeout(() => updateGroupCounts(syncedContacts), 0)

            // Emit real-time update
            emit('contacts_updated', syncedContacts)

            setSyncStatus('success')
            setLastSyncTime(new Date())
          } else {
            throw new Error(syncData.error)
          }
        } else {
          throw new Error('No active WhatsApp sessions found')
        }
      } else {
        throw new Error('Failed to get WhatsApp sessions')
      }
    } catch (error) {
      console.error('Error syncing contacts:', error)
      setSyncStatus('error')
    }
  }

  const filteredContacts = (contacts || []).filter(contact => {
    if (!contact) return false

    const matchesSearch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone?.includes(searchTerm) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTag = selectedTag === 'all' || (contact.tags && contact.tags.includes(selectedTag))
    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus
    const matchesGroup = selectedGroup === 'all' ||
                        contact.groupId === selectedGroup ||
                        (contact.tags && contact.tags.some(tag => tag.toLowerCase() === selectedGroup.toLowerCase()))

    return matchesSearch && matchesTag && matchesStatus && matchesGroup
  })

  const handleCreateContact = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Validate required fields
    if (!formData.name || !formData.phone) {
      alert('Name and phone number are required!')
      return
    }

    // Check if sessions are still loading
    if (sessionsLoading) {
      alert('Loading WhatsApp sessions... Please wait.')
      return
    }

    // Get current session ID
    const currentSessionId = getCurrentSessionId()
    if (!currentSessionId) {
      alert('No active WhatsApp session found! Please connect a WhatsApp session first.')
      return
    }

    // Add sessionId to form data
    const contactDataWithSession = {
      ...formData,
      sessionId: currentSessionId
    }

    console.log('📝 Form data being sent:', contactDataWithSession)

    try {
      setLoading(true)
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactDataWithSession)
      })

      const data = await response.json()
      console.log('📞 API Response:', data)

      if (data.success) {
        console.log('✅ Contact created successfully:', data.contact)

        // Update local state immediately
        const newContacts = [...(contacts || []), data.contact]
        setContacts(newContacts)
        // Update group counts after setting contacts
        setTimeout(() => updateGroupCounts(newContacts), 0)

        setShowCreateModal(false)
        resetForm()

        // Also emit for real-time updates
        emit('contacts_updated', newContacts)

        // Show success message
        alert('Contact created successfully!')
      } else {
        console.error('❌ Failed to create contact:', data.error)
        alert(`Failed to create contact: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Failed to create contact. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const newGroup: ContactGroup = {
      id: `group_${Date.now()}`,
      name: groupFormData.name,
      description: groupFormData.description,
      color: groupFormData.color,
      icon: groupFormData.icon,
      contactCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      // Save to API
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      })

      const data = await response.json()
      if (data.success) {
        setGroups([...(groups || []), data.group])
        setShowCreateGroupModal(false)
        setGroupFormData({ name: '', description: '', color: 'bg-blue-500', icon: 'Folder' })
        console.log('✅ Group created successfully:', data.group.name)
      } else {
        alert('Failed to create group: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group. Please try again.')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    console.log('🗑️ Delete group called with ID:', groupId)

    // Don't allow deleting default groups
    const groupToDelete = groups.find(g => g.id === groupId)
    console.log('📋 Group to delete:', groupToDelete)

    if (groupToDelete?.isDefault) {
      alert('Default groups cannot be deleted!')
      return
    }

    if (confirm(`Are you sure you want to delete the group "${groupToDelete?.name}"? This action cannot be undone.`)) {
      try {
        // Delete from API
        const response = await fetch(`/api/groups?id=${groupId}`, {
          method: 'DELETE'
        })

        const data = await response.json()
        if (data.success) {
          // Remove group from state
          const updatedGroups = (groups || []).filter(g => g && g.id !== groupId)
          setGroups(updatedGroups)

          // If the deleted group was selected, switch to 'all'
          if (selectedGroup === groupId) {
            setSelectedGroup('all')
          }

          // Update contacts that were in this group to remove group assignment
          const updatedContacts = (contacts || []).map(contact =>
            contact && contact.groupId === groupId
              ? { ...contact, groupId: undefined }
              : contact
          )
          setContacts(updatedContacts)
          // Update group counts after setting contacts
          setTimeout(() => updateGroupCounts(updatedContacts), 0)

          console.log('✅ Group deleted successfully:', groupToDelete?.name)
        } else {
          alert('Failed to delete group: ' + data.error)
        }
      } catch (error) {
        console.error('❌ Error deleting group:', error)
        alert('Failed to delete group. Please try again.')
      }
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedContacts.length === 0 || !contacts) return

    try {
      setLoading(true)

      switch (bulkAction) {
        case 'delete':
          // Delete selected contacts
          const remainingContacts = contacts.filter(c => c && !selectedContacts.includes(c.id))
          setContacts(remainingContacts)
          setTimeout(() => updateGroupCounts(remainingContacts), 0)
          break

        case 'addToGroup':
          // Add to selected group
          const updatedContacts = contacts.map(contact =>
            contact && selectedContacts.includes(contact.id)
              ? { ...contact, groupId: selectedGroup }
              : contact
          )
          setContacts(updatedContacts)
          setTimeout(() => updateGroupCounts(updatedContacts), 0)
          break

        case 'addTag':
          // Add tag to selected contacts
          // Implementation for adding tags
          break

        case 'export':
          // Export selected contacts
          exportContacts(contacts.filter(c => c && selectedContacts.includes(c.id)))
          break
      }

      setSelectedContacts([])
      setBulkAction('')
    } catch (error) {
      console.error('Error performing bulk action:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportContacts = (contactsToExport: Contact[]) => {
    if (!contactsToExport || !Array.isArray(contactsToExport)) {
      console.warn('Invalid contacts data for export')
      return
    }

    const csvContent = [
      ['Name', 'Phone', 'Email', 'Company', 'Tags', 'Status'],
      ...contactsToExport.filter(contact => contact).map(contact => [
        contact.name || '',
        contact.phone || '',
        contact.email || '',
        contact.company || '',
        (contact.tags && Array.isArray(contact.tags) ? contact.tags.join(';') : ''),
        contact.status || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const selectAllContacts = () => {
    const filtered = filteredContacts || []
    if (selectedContacts.length === filtered.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filtered.map(c => c?.id).filter(Boolean))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      tags: [],
      notes: '',
      customFields: {},
      groupId: '',
      company: '',
      jobTitle: '',
      website: '',
      country: '',
      city: '',
      sessionId: ''
    })
  }

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Wifi className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="h-full bg-transparent">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Contacts</h1>
              <p className="text-gray-600">Manage your contacts with groups and real-time sync</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Real-time status */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border">
                {getSyncStatusIcon()}
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
                {lastSyncTime && (
                  <span className="text-xs text-gray-400">
                    {lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Sync button */}
              <Button
                onClick={syncContacts}
                disabled={syncStatus === 'syncing'}
                icon={<RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sync
              </Button>

              {/* Create group button */}
              <Button
                onClick={() => setShowCreateGroupModal(true)}
                icon={<FolderPlus size={16} />}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                New Group
              </Button>

              {/* Create contact button */}
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={16} />}
                className="bg-green-600 hover:bg-green-700"
              >
                Add Contact
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{contacts?.length || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Contacts</p>
                  <p className="text-2xl font-bold text-green-600">
                    {contacts?.filter(c => c?.status === 'active').length || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Online Now</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {contacts?.filter(c => c?.isOnline).length || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Wifi className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Groups</p>
                  <p className="text-2xl font-bold text-purple-600">{(groups?.length || 1) - 1}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Folder className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Groups Sidebar */}
          <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Groups</h2>
              <Button
                onClick={() => setShowCreateGroupModal(true)}
                size="sm"
                icon={<Plus size={14} />}
                className="bg-green-600 hover:bg-green-700"
              >
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {(groups || []).map((group) => (
                <motion.div
                  key={group.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg transition-all ${
                    selectedGroup === group.id
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-3 flex-1"
                      onClick={() => setSelectedGroup(group.id)}
                    >
                      <div className={`w-8 h-8 rounded-lg ${group.color} flex items-center justify-center`}>
                        {group.icon === 'Users' && <Users className="w-4 h-4 text-white" />}
                        {group.icon === 'UserCheck' && <UserCheck className="w-4 h-4 text-white" />}
                        {group.icon === 'TrendingUp' && <TrendingUp className="w-4 h-4 text-white" />}
                        {group.icon === 'Star' && <Star className="w-4 h-4 text-white" />}
                        {group.icon === 'Building' && <Building className="w-4 h-4 text-white" />}
                        {group.icon === 'Heart' && <Heart className="w-4 h-4 text-white" />}
                        {group.icon === 'Folder' && <Folder className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{group.name}</p>
                        {group.description && (
                          <p className="text-xs text-gray-500">{group.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        {group.contactCount}
                      </span>
                      {!group.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteGroup(group.id)
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Filters and Search */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search contacts by name, phone, email, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Tags</option>
                    {contactTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedContacts.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedContacts.length} contact(s) selected
                      </span>
                      <select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                        className="px-3 py-2 border border-blue-300 rounded-lg text-sm"
                      >
                        <option value="">Choose action...</option>
                        <option value="addToGroup">Add to Group</option>
                        <option value="addTag">Add Tag</option>
                        <option value="export">Export</option>
                        <option value="delete">Delete</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleBulkAction}
                        disabled={!bulkAction}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Apply
                      </Button>
                      <Button
                        onClick={() => setSelectedContacts([])}
                        size="sm"
                        variant="outline"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contacts Display */}
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading contacts...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {/* Select All Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={selectAllContacts}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        {selectedContacts.length === (filteredContacts?.length || 0) && (filteredContacts?.length || 0) > 0 ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        <span>Select All ({filteredContacts?.length || 0})</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => exportContacts(filteredContacts || [])}
                        size="sm"
                        variant="outline"
                        icon={<Download size={14} />}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Contacts Grid/List */}
                <div className="p-6">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {(filteredContacts || []).map((contact) => (
                        <motion.div
                          key={contact.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 p-6"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedContacts.includes(contact.id)}
                                onChange={() => toggleContactSelection(contact.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                  {contact.name.charAt(0).toUpperCase()}
                                </div>
                                {contact.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {contact.isFavorite && (
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                                {contact.status}
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h3 className="font-semibold text-gray-900 mb-1">{contact.name}</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Phone className="w-3 h-3" />
                                <span>{contact.phone}</span>
                              </div>
                              {contact.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{contact.email}</span>
                                </div>
                              )}
                              {contact.company && (
                                <div className="flex items-center space-x-2">
                                  <Building className="w-3 h-3" />
                                  <span className="truncate">{contact.company}</span>
                                </div>
                              )}
                              {contact.lastSeen && (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-xs">Last seen: {new Date(contact.lastSeen).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Tags */}
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-1">
                                {(contact.tags || []).slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {contact.tags && contact.tags.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{contact.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedContact(contact)
                                setFormData({
                                  name: contact.name,
                                  phone: contact.phone,
                                  email: contact.email || '',
                                  address: contact.address || '',
                                  tags: contact.tags,
                                  notes: contact.notes || '',
                                  customFields: contact.customFields,
                                  groupId: contact.groupId || '',
                                  company: contact.company || '',
                                  jobTitle: contact.jobTitle || '',
                                  website: contact.website || '',
                                  country: contact.country || '',
                                  city: contact.city || '',
                                  sessionId: contact.sessionId || ''
                                })
                                setShowEditModal(true)
                              }}
                              icon={<Edit3 size={14} />}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.location.href = `/inbox?phone=${encodeURIComponent(contact.phone)}&name=${encodeURIComponent(contact.name)}`
                              }}
                              icon={<MessageCircle size={14} />}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              Chat
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this contact?')) {
                                  const updatedContacts = (contacts || []).filter(c => c && c.id !== contact.id)
                                  setContacts(updatedContacts)
                                  setTimeout(() => updateGroupCounts(updatedContacts), 0)
                                }
                              }}
                              icon={<Trash2 size={14} />}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    // List View
                    <div className="space-y-2">
                      {(filteredContacts || []).map((contact) => (
                        <motion.div
                          key={contact.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact.id)}
                              onChange={() => toggleContactSelection(contact.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {contact.name.charAt(0).toUpperCase()}
                              </div>
                              {contact.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                                {contact.isFavorite && (
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                )}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                                  {contact.status}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{contact.phone}</span>
                                </span>
                                {contact.email && (
                                  <span className="flex items-center space-x-1">
                                    <Mail className="w-3 h-3" />
                                    <span>{contact.email}</span>
                                  </span>
                                )}
                                {contact.company && (
                                  <span className="flex items-center space-x-1">
                                    <Building className="w-3 h-3" />
                                    <span>{contact.company}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedContact(contact)
                                setFormData({
                                  name: contact.name,
                                  phone: contact.phone,
                                  email: contact.email || '',
                                  address: contact.address || '',
                                  tags: contact.tags,
                                  notes: contact.notes || '',
                                  customFields: contact.customFields,
                                  groupId: contact.groupId || '',
                                  company: contact.company || '',
                                  jobTitle: contact.jobTitle || '',
                                  website: contact.website || '',
                                  country: contact.country || '',
                                  city: contact.city || '',
                                  sessionId: contact.sessionId || ''
                                })
                                setShowEditModal(true)
                              }}
                              icon={<Edit3 size={14} />}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                window.location.href = `/inbox?phone=${encodeURIComponent(contact.phone)}&name=${encodeURIComponent(contact.name)}`
                              }}
                              icon={<MessageCircle size={14} />}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this contact?')) {
                                  const updatedContacts = (contacts || []).filter(c => c && c.id !== contact.id)
                                  setContacts(updatedContacts)
                                  setTimeout(() => updateGroupCounts(updatedContacts), 0)
                                }
                              }}
                              icon={<Trash2 size={14} />}
                              className="text-red-600 hover:text-red-700"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {(!filteredContacts || filteredContacts.length === 0) && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                      <p className="text-gray-500 mb-6">
                        {searchTerm || selectedTag !== 'all' || selectedStatus !== 'all' || selectedGroup !== 'all'
                          ? 'Try adjusting your filters or search terms'
                          : 'Add your first contact to get started'
                        }
                      </p>
                      {!searchTerm && selectedTag === 'all' && selectedStatus === 'all' && selectedGroup === 'all' && (
                        <Button
                          onClick={() => setShowCreateModal(true)}
                          icon={<Plus size={16} />}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Add Contact
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContactModals
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        showCreateGroupModal={showCreateGroupModal}
        setShowCreateGroupModal={setShowCreateGroupModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        selectedContact={selectedContact}
        formData={formData}
        setFormData={setFormData}
        groupFormData={groupFormData}
        setGroupFormData={setGroupFormData}
        groups={groups}
        contactTags={contactTags}
        handleCreateContact={handleCreateContact}
        handleCreateGroup={handleCreateGroup}
        handleUpdateContact={async (e?: React.FormEvent) => {
          if (e) e.preventDefault()
          if (!selectedContact) return

          try {
            setLoading(true)
            const response = await fetch(`/api/contacts/${selectedContact.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
            })

            const data = await response.json()
            if (data.success) {
              const updatedContacts = contacts.map(c =>
                c.id === selectedContact.id ? { ...c, ...formData } : c
              )
              setContacts(updatedContacts)
              updateGroupCounts(updatedContacts)
              setShowEditModal(false)
              setSelectedContact(null)
              resetForm()
              emit('contacts_updated', updatedContacts)
            }
          } catch (error) {
            console.error('Error updating contact:', error)
          } finally {
            setLoading(false)
          }
        }}
        loading={loading}
        resetForm={resetForm}
      />
    </div>
  )
}
