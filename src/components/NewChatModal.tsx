import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Phone, User, MessageCircle, Users, Check } from 'lucide-react'
import { cn } from '../lib/utils'

interface Contact {
  id: string
  name: string
  phoneNumber: string
  profilePic?: string
  isOnline?: boolean
  lastSeen?: string
  isBusiness?: boolean
  isVerified?: boolean
}

interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateChat: (phoneNumber: string, name?: string) => Promise<void>
  contacts?: Contact[]
  loading?: boolean
}

export default function NewChatModal({
  isOpen,
  onClose,
  onCreateChat,
  contacts = [],
  loading = false
}: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'contacts' | 'phone'>('contacts')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setPhoneNumber('')
      setSelectedContact(null)
      setActiveTab('contacts')
    }
  }, [isOpen])

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  )

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
  }

  // Handle chat creation
  const handleCreateChat = async () => {
    if (isCreating) return

    let targetPhone = ''
    let targetName = ''

    if (activeTab === 'contacts' && selectedContact) {
      targetPhone = selectedContact.phoneNumber
      targetName = selectedContact.name
    } else if (activeTab === 'phone' && phoneNumber.trim()) {
      targetPhone = phoneNumber.trim()
      targetName = `Contact ${phoneNumber}`
    } else {
      return
    }

    setIsCreating(true)
    try {
      await onCreateChat(targetPhone, targetName)
      onClose()
    } catch (error) {
      console.error('Error creating chat:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    // Remove non-digits and format
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('91')) {
      return `+${cleaned}`
    } else if (cleaned.length === 10) {
      return `+91${cleaned}`
    }
    return `+${cleaned}`
  }

  const handlePhoneChange = (value: string) => {
    // Allow only numbers, +, and spaces
    const cleaned = value.replace(/[^\d+\s]/g, '')
    setPhoneNumber(cleaned)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">New Chat</h2>
                  <p className="text-green-100 text-sm">Start a conversation</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex mt-4 bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('contacts')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'contacts'
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-white/80 hover:text-white"
                )}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Contacts
              </button>
              <button
                onClick={() => setActiveTab('phone')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'phone'
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-white/80 hover:text-white"
                )}
              >
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === 'contacts' ? (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Contacts List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No contacts found</p>
                      <p className="text-sm">Try using phone number tab</p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <motion.div
                        key={contact.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleContactSelect(contact)}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                          selectedContact?.id === contact.id
                            ? "bg-green-50 border-2 border-green-200"
                            : "hover:bg-gray-50 border-2 border-transparent"
                        )}
                      >
                        <div className="relative">
                          {contact.profilePic ? (
                            <img
                              src={contact.profilePic}
                              alt={contact.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {contact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {contact.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                            {contact.isVerified && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                            {contact.isBusiness && (
                              <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                                <span className="text-white text-xs font-bold">B</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{contact.phoneNumber}</p>
                        </div>
                        {selectedContact?.id === contact.id && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter phone number with country code (e.g., +91 for India)
                  </p>
                </div>

                {phoneNumber && (
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-700">
                      <strong>Formatted:</strong> {formatPhoneNumber(phoneNumber)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateChat}
                disabled={
                  isCreating ||
                  (activeTab === 'contacts' && !selectedContact) ||
                  (activeTab === 'phone' && !phoneNumber.trim())
                }
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200",
                  isCreating ||
                  (activeTab === 'contacts' && !selectedContact) ||
                  (activeTab === 'phone' && !phoneNumber.trim())
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                )}
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Start Chat'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
