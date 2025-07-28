'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, User, Phone, Mail, MapPin, Tag, Building, Globe, Briefcase, Flag } from 'lucide-react'
import Button from '@/components/ui/Button'

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

interface ContactModalsProps {
  showCreateModal: boolean
  setShowCreateModal: (show: boolean) => void
  showCreateGroupModal: boolean
  setShowCreateGroupModal: (show: boolean) => void
  showEditModal: boolean
  setShowEditModal: (show: boolean) => void
  selectedContact: Contact | null
  formData: any
  setFormData: (data: any) => void
  groupFormData: any
  setGroupFormData: (data: any) => void
  groups: ContactGroup[]
  contactTags: string[]
  handleCreateContact: (e?: React.FormEvent) => void
  handleCreateGroup: (e?: React.FormEvent) => void
  handleUpdateContact: (e?: React.FormEvent) => void
  loading: boolean
  resetForm: () => void
}

const groupColors = [
  'bg-blue-500', 'bg-slate-600', 'bg-yellow-500', 'bg-purple-500',
  'bg-indigo-500', 'bg-pink-500', 'bg-red-500', 'bg-orange-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-lime-500', 'bg-blue-600'
]

const groupIcons = [
  'Folder', 'Users', 'UserCheck', 'TrendingUp', 'Star', 'Building', 
  'Heart', 'Shield', 'Globe', 'Briefcase', 'Flag', 'Tag'
]

export default function ContactModals({
  showCreateModal,
  setShowCreateModal,
  showCreateGroupModal,
  setShowCreateGroupModal,
  showEditModal,
  setShowEditModal,
  selectedContact,
  formData,
  setFormData,
  groupFormData,
  setGroupFormData,
  groups,
  contactTags,
  handleCreateContact,
  handleCreateGroup,
  handleUpdateContact,
  loading,
  resetForm
}: ContactModalsProps) {

  const handleTagToggle = (tag: string) => {
    const currentTags = formData.tags || []
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter((t: string) => t !== tag) })
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] })
    }
  }

  return (
    <>
      {/* Create Contact Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Add New Contact</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateContact} className="p-4 space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>

                {/* Group Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Group
                  </label>
                  <select
                    value={formData.groupId}
                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a group...</option>
                    {groups.filter(g => !g.isDefault).map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    icon={<Save size={16} />}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Creating...' : 'Create Contact'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateGroupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
                  <button
                    onClick={() => setShowCreateGroupModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter group name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={groupFormData.description}
                    onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Group description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {groupColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setGroupFormData({ ...groupFormData, color })}
                        className={`w-8 h-8 rounded-full ${color} ${
                          groupFormData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {groupIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setGroupFormData({ ...groupFormData, icon })}
                        className={`p-2 rounded-lg border ${
                          groupFormData.icon === icon
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateGroupModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    icon={<Save size={16} />}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Contact Modal */}
      <AnimatePresence>
        {showEditModal && selectedContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Contact</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateContact} className="p-6 space-y-6">
                {/* Same form fields as create modal but with update handler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Company name"
                    />
                  </div>
                </div>

                {/* Group Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group
                  </label>
                  <select
                    value={formData.groupId}
                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a group...</option>
                    {groups.filter(g => !g.isDefault).map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-2" />
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {contactTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.tags?.includes(tag)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about this contact"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    icon={<Save size={16} />}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Updating...' : 'Update Contact'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
