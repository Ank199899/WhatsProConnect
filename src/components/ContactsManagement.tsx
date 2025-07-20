'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Star,
  MessageCircle,
  MoreVertical,
  UserPlus,
  FileText,
  BarChart3,
  Eye,
  Copy
} from 'lucide-react'
import Button from './ui/Button'
import { useRealTime, useRealTimeData, useRealTimeSubscription } from '@/contexts/RealTimeContext'

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
}

const contactTags = [
  'Customer',
  'Lead',
  'VIP',
  'Support',
  'Partner',
  'Vendor',
  'Friend',
  'Family',
  'Business',
  'Personal'
]

export default function ContactsManagement() {
  const { emit, isConnected } = useRealTime()
  const realtimeContacts = useRealTimeData<Contact[]>('contacts')

  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tags: [] as string[],
    notes: '',
    customFields: {} as Record<string, any>
  })

  // Real-time subscription for contacts updates
  useRealTimeSubscription('contacts', (updatedContacts) => {
    console.log('📞 Contacts updated in real-time:', updatedContacts.length)
    setContacts(updatedContacts)
  })

  // Sync with real-time data
  useEffect(() => {
    if (realtimeContacts && realtimeContacts.length > 0) {
      setContacts(realtimeContacts)
    }
  }, [realtimeContacts])

  // Get unique tags from contacts
  const contactTags = Array.from(new Set(contacts.flatMap(contact => contact.tags)))

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()
      console.log('📞 Loaded contacts from API:', data)
      if (data.success) {
        console.log('📋 Setting contacts:', data.contacts)
        setContacts(data.contacts)
        emit('contacts_updated', data.contacts)
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTag = selectedTag === 'all' || contact.tags.includes(selectedTag)
    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus
    
    return matchesSearch && matchesTag && matchesStatus
  })

  const handleCreateContact = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    console.log('📝 Form data being sent:', formData)

    try {
      setLoading(true)
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      console.log('📞 API Response:', data)

      if (data.success) {
        console.log('✅ Contact created successfully:', data.contact)
        console.log('📱 Contact phone:', data.contact.phone)

        // Update local state immediately
        const newContacts = [...contacts, data.contact]
        setContacts(newContacts)

        setShowCreateModal(false)
        resetForm()

        // Also emit for real-time updates
        emit('contacts_updated', newContacts)
      } else {
        console.error('❌ Failed to create contact:', data.error)
      }
    } catch (error) {
      console.error('Error creating contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateContact = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedContact) return

    console.log('📝 Updating contact:', selectedContact.id, 'with data:', formData)

    try {
      setLoading(true)
      const response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone_number: formData.phone, // Map phone to phone_number for database
          email: formData.email,
          notes: formData.notes
        })
      })

      const data = await response.json()
      console.log('📞 Update API Response:', data)

      if (data.success) {
        console.log('✅ Contact updated successfully:', data.contact)
        setShowEditModal(false)
        resetForm()
        setSelectedContact(null)
        loadContacts() // Reload contacts to get updated data
        emit('contacts_updated', contacts.map(c => c.id === selectedContact.id ? data.contact : c))
      } else {
        console.error('❌ Failed to update contact:', data.error)
      }
    } catch (error) {
      console.error('Error updating contact:', error)
    } finally {
      setLoading(false)
    }
  }



  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) return

    try {
      setLoading(true)
      const response = await fetch(`/api/contacts?id=${contactId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        // Update local state immediately
        const updatedContacts = contacts.filter(c => c.id !== contactId)
        setContacts(updatedContacts)

        // Also emit for real-time updates
        emit('contacts_updated', updatedContacts)

        console.log('✅ Contact deleted successfully:', contactId)
      } else {
        console.error('❌ Failed to delete contact:', data.error)
        alert('Failed to delete contact. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Error deleting contact. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) return

    try {
      setLoading(true)
      const response = await fetch('/api/contacts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedContacts })
      })

      const data = await response.json()
      if (data.success) {
        setSelectedContacts([])
        loadContacts()
      }
    } catch (error) {
      console.error('Error bulk deleting contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditContact = (contact: any) => {
    setSelectedContact(contact)
    setFormData({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      tags: contact.tags || [],
      notes: contact.notes || '',
      customFields: contact.customFields || {}
    })
    setShowEditModal(true)
  }

  const handleChatContact = (contact: any) => {
    console.log('💬 Opening chat with contact:', contact)
    // Navigate to inbox with contact phone number
    window.location.href = `/inbox?phone=${encodeURIComponent(contact.phone)}&name=${encodeURIComponent(contact.name)}`
  }

  const handleToggleFavorite = async (contact: Contact) => {
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contact,
          isFavorite: !contact.isFavorite
        })
      })
      
      const data = await response.json()
      if (data.success) {
        loadContacts()
      }
    } catch (error) {
      console.error('Error updating favorite status:', error)
    }
  }

  const handleExportContacts = () => {
    const csvContent = [
      ['Name', 'Phone', 'Email', 'Tags', 'Status', 'Created At'].join(','),
      ...filteredContacts.map(contact => [
        contact.name,
        contact.phone,
        contact.email || '',
        contact.tags.join(';'),
        contact.status,
        new Date(contact.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }



  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      tags: [],
      notes: '',
      customFields: {}
    })
  }

  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact)
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      address: contact.address || '',
      tags: contact.tags,
      notes: contact.notes || '',
      customFields: contact.customFields
    })
    setShowEditModal(true)
  }

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const selectAllContacts = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Users className="w-6 h-6 mr-3 text-gray-600" />
                Contacts Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your WhatsApp contacts and customer database
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowImportModal(true)}
                icon={<Upload size={16} />}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Import
              </Button>
              <Button
                variant="outline"
                onClick={handleExportContacts}
                icon={<Download size={16} />}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Export
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={16} />}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Contact
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Contacts</p>
                <p className="text-2xl font-bold text-green-600">
                  {contacts.filter(c => c.status === 'active').length}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favorites</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {contacts.filter(c => c.isFavorite).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-purple-600">
                  {contacts.reduce((sum, c) => sum + c.messageCount, 0)}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Professional Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center space-x-4">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Tags</option>
                {contactTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <BarChart3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <FileText size={16} />
                </button>
              </div>
            </div>
          </div>

          {selectedContacts.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedContacts.length} contact(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedContacts([])}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkDelete}
                    icon={<Trash2 size={14} />}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Professional Contacts Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContacts.map((contact) => {
              console.log('🔍 Rendering contact:', contact)
              return (
              <div
                key={contact.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleToggleFavorite(contact)}
                        className={`p-2 rounded-lg hover:bg-gray-100 ${
                          contact.isFavorite ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                        title="Toggle Favorite"
                      >
                        <Star size={16} className={contact.isFavorite ? 'fill-current' : ''} />
                      </button>
                      <button
                        onClick={() => openEditModal(contact)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                        title="Edit Contact"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600"
                        title="Delete Contact"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{contact.phone || 'No phone number'}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                      {contact.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {contact.messageCount} messages
                    </span>
                  </div>

                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {contact.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {contact.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditContact(contact)}
                      icon={<Edit3 size={14} />}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChatContact(contact)}
                      icon={<MessageCircle size={14} />}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}
                      icon={<Trash2 size={14} />}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )
            })}
          </div>
        ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                  onChange={selectAllContacts}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({filteredContacts.length})
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence>
                {filteredContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{contact.phone}</span>
                          {contact.email && <span>{contact.email}</span>}
                          <span>{contact.messageCount} messages</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                      {contact.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      )}
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                          icon={<Edit3 size={14} />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChatContact(contact)}
                          icon={<MessageCircle size={14} />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                          icon={<Trash2 size={14} />}
                          className="text-red-600 hover:text-red-700"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

        {filteredContacts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedTag !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Add your first contact to get started'
              }
            </p>
            {!searchTerm && selectedTag === 'all' && selectedStatus === 'all' && (
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

        {/* Professional Connection Status */}
        <div className="fixed bottom-4 right-4">
          <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
            isConnected
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? '🟢 Real-time Connected' : '🔴 Connection Lost'}
          </div>
        </div>
      </div>

      {/* Create Contact Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg mx-auto transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <UserPlus className="w-6 h-6 mr-3 text-blue-600" />
                    Add New Contact
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Create a new contact in your database</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateContact} className="px-6 pb-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all resize-none"
                  placeholder="Add any additional notes about this contact..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Contact
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditModal && selectedContact && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg mx-auto transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-t-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Edit3 className="w-6 h-6 mr-3 text-purple-600" />
                    Edit Contact
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Update contact information</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateContact} className="px-6 pb-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Edit3 className="w-5 h-5 mr-2" />
                      Update Contact
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Import Contacts</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Handle file upload
                      console.log('File selected:', file.name)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">CSV format should include:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Name (required)</li>
                  <li>Phone (required)</li>
                  <li>Email (optional)</li>
                  <li>Notes (optional)</li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
