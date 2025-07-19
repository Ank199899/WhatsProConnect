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
  const contacts = useRealTimeData<Contact[]>('contacts')
  
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
  })

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()
      if (data.success) {
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

  const handleCreateContact = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        resetForm()
        loadContacts()
        emit('contacts_updated', [...contacts, data.contact])
      }
    } catch (error) {
      console.error('Error creating contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditContact = async () => {
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
        setShowEditModal(false)
        setSelectedContact(null)
        resetForm()
        loadContacts()
      }
    } catch (error) {
      console.error('Error updating contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        loadContacts()
        const updatedContacts = contacts.filter(c => c.id !== contactId)
        emit('contacts_updated', updatedContacts)
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
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
    a.click()
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
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
          >
            Import
          </Button>
          <Button
            variant="outline"
            onClick={handleExportContacts}
            icon={<Download size={16} />}
          >
            Export
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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

      {/* Filters and Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tags</option>
              {contactTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedContacts.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedContacts.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  icon={<Trash2 size={14} />}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            )}
            
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3 py-1"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3 py-1"
              >
                List
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(contact)}
                        icon={<Star size={14} className={contact.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(contact)}
                        icon={<MoreVertical size={14} />}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {contact.phone}
                    </div>
                    {contact.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {contact.email}
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
                  
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(contact)}
                      icon={<Edit3 size={14} />}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<MessageCircle size={14} />}
                      className="flex-1"
                    >
                      Message
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
                          onClick={() => openEditModal(contact)}
                          icon={<Edit3 size={14} />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
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

      {/* Connection Status */}
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
  )
}
