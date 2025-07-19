'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  Users,
  Lock,
  Unlock,
  Eye,
  Settings,
  Search,
  Filter,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Key
} from 'lucide-react'
import Button from './ui/Button'
import { useRealTime, useRealTimeData } from '@/contexts/RealTimeContext'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  level: 'read' | 'write' | 'admin'
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  color: string
  priority: number
}

const permissionCategories = [
  'Dashboard',
  'WhatsApp Numbers',
  'Inbox',
  'Contacts',
  'Bulk Messaging',
  'Analytics',
  'Templates',
  'User Management',
  'Settings',
  'API & Webhooks'
]

const defaultPermissions: Permission[] = [
  // Dashboard
  { id: 'dashboard.view', name: 'View Dashboard', description: 'Access to main dashboard', category: 'Dashboard', level: 'read' },
  { id: 'dashboard.analytics', name: 'View Analytics', description: 'Access to dashboard analytics', category: 'Dashboard', level: 'read' },
  
  // WhatsApp Numbers
  { id: 'sessions.view', name: 'View Sessions', description: 'View WhatsApp sessions', category: 'WhatsApp Numbers', level: 'read' },
  { id: 'sessions.create', name: 'Create Sessions', description: 'Create new WhatsApp sessions', category: 'WhatsApp Numbers', level: 'write' },
  { id: 'sessions.edit', name: 'Edit Sessions', description: 'Modify existing sessions', category: 'WhatsApp Numbers', level: 'write' },
  { id: 'sessions.delete', name: 'Delete Sessions', description: 'Remove WhatsApp sessions', category: 'WhatsApp Numbers', level: 'admin' },
  
  // Inbox
  { id: 'inbox.view', name: 'View Messages', description: 'Access to inbox messages', category: 'Inbox', level: 'read' },
  { id: 'inbox.send', name: 'Send Messages', description: 'Send individual messages', category: 'Inbox', level: 'write' },
  { id: 'inbox.delete', name: 'Delete Messages', description: 'Delete messages', category: 'Inbox', level: 'admin' },
  
  // Contacts
  { id: 'contacts.view', name: 'View Contacts', description: 'Access to contacts list', category: 'Contacts', level: 'read' },
  { id: 'contacts.create', name: 'Create Contacts', description: 'Add new contacts', category: 'Contacts', level: 'write' },
  { id: 'contacts.edit', name: 'Edit Contacts', description: 'Modify contact information', category: 'Contacts', level: 'write' },
  { id: 'contacts.delete', name: 'Delete Contacts', description: 'Remove contacts', category: 'Contacts', level: 'admin' },
  { id: 'contacts.import', name: 'Import Contacts', description: 'Import contacts from files', category: 'Contacts', level: 'write' },
  { id: 'contacts.export', name: 'Export Contacts', description: 'Export contacts to files', category: 'Contacts', level: 'read' },
  
  // Bulk Messaging
  { id: 'bulk.view', name: 'View Campaigns', description: 'Access to bulk campaigns', category: 'Bulk Messaging', level: 'read' },
  { id: 'bulk.create', name: 'Create Campaigns', description: 'Create new campaigns', category: 'Bulk Messaging', level: 'write' },
  { id: 'bulk.send', name: 'Send Campaigns', description: 'Execute bulk campaigns', category: 'Bulk Messaging', level: 'write' },
  { id: 'bulk.delete', name: 'Delete Campaigns', description: 'Remove campaigns', category: 'Bulk Messaging', level: 'admin' },
  
  // Analytics
  { id: 'analytics.view', name: 'View Analytics', description: 'Access to analytics dashboard', category: 'Analytics', level: 'read' },
  { id: 'analytics.export', name: 'Export Reports', description: 'Export analytics reports', category: 'Analytics', level: 'read' },
  
  // Templates
  { id: 'templates.view', name: 'View Templates', description: 'Access to message templates', category: 'Templates', level: 'read' },
  { id: 'templates.create', name: 'Create Templates', description: 'Create new templates', category: 'Templates', level: 'write' },
  { id: 'templates.edit', name: 'Edit Templates', description: 'Modify existing templates', category: 'Templates', level: 'write' },
  { id: 'templates.delete', name: 'Delete Templates', description: 'Remove templates', category: 'Templates', level: 'admin' },
  
  // User Management
  { id: 'users.view', name: 'View Users', description: 'Access to user list', category: 'User Management', level: 'read' },
  { id: 'users.create', name: 'Create Users', description: 'Add new users', category: 'User Management', level: 'admin' },
  { id: 'users.edit', name: 'Edit Users', description: 'Modify user information', category: 'User Management', level: 'admin' },
  { id: 'users.delete', name: 'Delete Users', description: 'Remove users', category: 'User Management', level: 'admin' },
  { id: 'roles.manage', name: 'Manage Roles', description: 'Create and modify roles', category: 'User Management', level: 'admin' },
  
  // Settings
  { id: 'settings.view', name: 'View Settings', description: 'Access to application settings', category: 'Settings', level: 'read' },
  { id: 'settings.edit', name: 'Edit Settings', description: 'Modify application settings', category: 'Settings', level: 'admin' },
  
  // API & Webhooks
  { id: 'api.view', name: 'View API Keys', description: 'Access to API configuration', category: 'API & Webhooks', level: 'read' },
  { id: 'api.manage', name: 'Manage API Keys', description: 'Create and manage API keys', category: 'API & Webhooks', level: 'admin' },
  { id: 'webhooks.manage', name: 'Manage Webhooks', description: 'Configure webhooks', category: 'API & Webhooks', level: 'admin' }
]

const systemRoles = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: defaultPermissions.map(p => p.id),
    userCount: 1,
    isSystem: true,
    isActive: true,
    color: '#DC2626',
    priority: 1
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Administrative access with most permissions',
    permissions: defaultPermissions.filter(p => p.level !== 'admin' || p.category !== 'User Management').map(p => p.id),
    userCount: 2,
    isSystem: true,
    isActive: true,
    color: '#EA580C',
    priority: 2
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Management access for campaigns and analytics',
    permissions: defaultPermissions.filter(p => 
      p.level === 'read' || 
      (p.level === 'write' && ['Bulk Messaging', 'Templates', 'Contacts'].includes(p.category))
    ).map(p => p.id),
    userCount: 5,
    isSystem: true,
    isActive: true,
    color: '#D97706',
    priority: 3
  },
  {
    id: 'operator',
    name: 'Operator',
    description: 'Basic operational access for messaging',
    permissions: defaultPermissions.filter(p => 
      p.level === 'read' || 
      (p.level === 'write' && ['Inbox', 'Contacts'].includes(p.category))
    ).map(p => p.id),
    userCount: 10,
    isSystem: true,
    isActive: true,
    color: '#059669',
    priority: 4
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to most features',
    permissions: defaultPermissions.filter(p => p.level === 'read').map(p => p.id),
    userCount: 15,
    isSystem: true,
    isActive: true,
    color: '#0284C7',
    priority: 5
  }
]

export default function RoleManagement() {
  const { emit, isConnected } = useRealTime()
  const roles = useRealTimeData<Role[]>('roles')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    color: '#3B82F6',
    isActive: true
  })

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    setLoading(true)
    try {
      // Initialize with system roles if no roles exist
      const response = await fetch('/api/roles')
      const data = await response.json()
      
      if (data.success) {
        const allRoles = data.roles.length > 0 ? data.roles : systemRoles
        emit('roles_updated', allRoles)
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      // Fallback to system roles
      emit('roles_updated', systemRoles)
    } finally {
      setLoading(false)
    }
  }

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const handleCreateRole = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          priority: roles.length + 1
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        resetForm()
        loadRoles()
      }
    } catch (error) {
      console.error('Error creating role:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditRole = async () => {
    if (!selectedRole) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      if (data.success) {
        setShowEditModal(false)
        setSelectedRole(null)
        resetForm()
        loadRoles()
      }
    } catch (error) {
      console.error('Error updating role:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (role?.isSystem) {
      alert('System roles cannot be deleted')
      return
    }
    
    if (!confirm('Are you sure you want to delete this role? Users with this role will lose their permissions.')) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        loadRoles()
      }
    } catch (error) {
      console.error('Error deleting role:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRoleStatus = async (role: Role) => {
    if (role.isSystem && role.id === 'super-admin') {
      alert('Super Admin role cannot be deactivated')
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...role,
          isActive: !role.isActive
        })
      })
      
      const data = await response.json()
      if (data.success) {
        loadRoles()
      }
    } catch (error) {
      console.error('Error updating role status:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      color: '#3B82F6',
      isActive: true
    })
  }

  const openEditModal = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      color: role.color,
      isActive: role.isActive
    })
    setShowEditModal(true)
  }

  const getPermissionsByCategory = (category: string) => {
    return defaultPermissions.filter(p => p.category === category)
  }

  const getRoleIcon = (role: Role) => {
    if (role.id === 'super-admin') return Crown
    if (role.id === 'admin') return Shield
    if (role.id === 'manager') return UserCheck
    if (role.id === 'operator') return Settings
    return Users
  }

  const getLevelColor = (level: Permission['level']) => {
    switch (level) {
      case 'read': return 'bg-blue-100 text-blue-800'
      case 'write': return 'bg-yellow-100 text-yellow-800'
      case 'admin': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            Role Management
          </h1>
          <p className="text-gray-600 mt-1">
            Define roles and permissions for your team members
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowPermissionsModal(true)}
            variant="outline"
            icon={<Eye size={16} />}
          >
            View Permissions
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Role
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Roles</p>
              <p className="text-2xl font-bold text-green-600">
                {roles.filter(r => r.isActive).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Roles</p>
              <p className="text-2xl font-bold text-purple-600">
                {roles.filter(r => r.isSystem).length}
              </p>
            </div>
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-orange-600">
                {roles.reduce((sum, r) => sum + r.userCount, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredRoles.map((role) => {
            const RoleIcon = getRoleIcon(role)
            
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${role.color}20` }}
                      >
                        <RoleIcon 
                          className="w-6 h-6" 
                          style={{ color: role.color }}
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                          {role.isSystem && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              System
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            role.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{role.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{role.userCount} users</span>
                          <span>{role.permissions.length} permissions</span>
                          <span>Priority: {role.priority}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role)
                          setShowPermissionsModal(true)
                        }}
                        icon={<Eye size={14} />}
                      />
                      
                      {!role.isSystem && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(role)}
                            icon={<Edit3 size={14} />}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                            icon={<Trash2 size={14} />}
                            className="text-red-600 hover:text-red-700"
                          />
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRoleStatus(role)}
                        icon={role.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                        disabled={role.isSystem && role.id === 'super-admin'}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredRoles.length === 0 && !loading && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first custom role to get started'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={16} />}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Role
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
