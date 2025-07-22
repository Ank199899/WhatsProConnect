'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Plus, Edit3, Trash2, Users, Save, X, Crown, Key, Eye, Settings,
  Search, CheckCircle, AlertTriangle, Lock, Unlock
} from 'lucide-react'
import Button from './ui/Button'
import Card, { CardHeader, CardContent } from './ui/Card'
import Input from './ui/Input'
import Modal, { ModalHeader, ModalBody, ModalFooter } from './ui/Modal'
import { 
  AVAILABLE_PERMISSIONS, 
  PERMISSION_CATEGORIES, 
  DEFAULT_ROLE_PERMISSIONS,
  getPermissionsByCategory,
  Permission
} from '@/lib/permissions'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  userCount?: number
}

interface RoleFormData {
  name: string
  description: string
  permissions: string[]
  color: string
  isActive: boolean
}

export default function AdvancedRoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
    color: '#3B82F6',
    isActive: true
  })

  useEffect(() => {
    loadRoles()
  }, [refreshKey])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadRoles()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const loadRoles = () => {
    try {
      console.log('Loading roles from localStorage...')
      const savedRoles = localStorage.getItem('app_roles')
      console.log('Raw saved roles:', savedRoles)

      if (savedRoles) {
        const parsedRoles = JSON.parse(savedRoles)
        console.log('Parsed roles:', parsedRoles)
        setRoles(parsedRoles)
      } else {
        console.log('No saved roles found, creating defaults')
        createDefaultRoles()
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      createDefaultRoles()
    }
  }

  const saveRoles = (rolesToSave: Role[]) => {
    try {
      console.log('Saving roles:', rolesToSave)
      localStorage.setItem('app_roles', JSON.stringify(rolesToSave))
      setRoles(rolesToSave)
      console.log('Roles saved successfully')

      // Force refresh after save
      setTimeout(() => {
        forceRefresh()
      }, 100)
    } catch (error) {
      console.error('Error saving roles:', error)
    }
  }

  const createDefaultRoles = () => {
    const defaultRoles: Role[] = [
      {
        id: 'role-admin',
        name: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: ['*'],
        color: '#DC2626',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 1
      },
      {
        id: 'role-manager',
        name: 'Manager',
        description: 'Management access with user and analytics permissions',
        permissions: DEFAULT_ROLE_PERMISSIONS.manager,
        color: '#2563EB',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 0
      },
      {
        id: 'role-agent',
        name: 'Agent',
        description: 'Basic agent access for messaging',
        permissions: DEFAULT_ROLE_PERMISSIONS.agent,
        color: '#059669',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 0
      },
      {
        id: 'role-viewer',
        name: 'Viewer',
        description: 'Read-only access for viewing data',
        permissions: DEFAULT_ROLE_PERMISSIONS.viewer,
        color: '#6B7280',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 0
      }
    ]
    
    saveRoles(defaultRoles)
  }

  const handleCreateRole = () => {
    if (!formData.name.trim()) return

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      color: formData.color,
      isActive: formData.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userCount: 0
    }

    const updatedRoles = [...roles, newRole]
    saveRoles(updatedRoles)
    setShowCreateModal(false)
    resetForm()
  }

  const handleEditRole = () => {
    if (!selectedRole || !formData.name.trim()) return

    console.log('Editing role:', selectedRole.id)
    console.log('Form data:', formData)

    const updatedRole: Role = {
      ...selectedRole,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      color: formData.color,
      isActive: formData.isActive,
      updatedAt: new Date().toISOString()
    }

    console.log('Updated role:', updatedRole)

    const updatedRoles = roles.map(role =>
      role.id === selectedRole.id ? updatedRole : role
    )

    console.log('All updated roles:', updatedRoles)

    saveRoles(updatedRoles)
    setShowEditModal(false)
    setSelectedRole(null)
    resetForm()
  }

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      console.log('Deleting role:', roleId)
      console.log('Current roles before delete:', roles)

      const updatedRoles = roles.filter(role => role.id !== roleId)
      console.log('Updated roles after filter:', updatedRoles)

      saveRoles(updatedRoles)
    }
  }

  const handleToggleRoleStatus = (role: Role) => {
    console.log('Toggling role status:', role.id, 'from', role.isActive, 'to', !role.isActive)

    const updatedRole = { ...role, isActive: !role.isActive, updatedAt: new Date().toISOString() }
    const updatedRoles = roles.map(r => r.id === role.id ? updatedRole : r)

    console.log('Updated roles after toggle:', updatedRoles)
    saveRoles(updatedRoles)
  }

  const openEditModal = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      color: role.color,
      isActive: role.isActive
    })
    setShowEditModal(true)
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

  const togglePermission = (permissionId: string) => {
    const currentPermissions = [...formData.permissions]
    const index = currentPermissions.indexOf(permissionId)
    
    if (index > -1) {
      currentPermissions.splice(index, 1)
    } else {
      currentPermissions.push(permissionId)
    }
    
    setFormData({ ...formData, permissions: currentPermissions })
  }

  const toggleCategoryPermissions = (category: string) => {
    const categoryPermissions = getPermissionsByCategory(category).map(p => p.id)
    const currentPermissions = [...formData.permissions]
    
    const allSelected = categoryPermissions.every(p => currentPermissions.includes(p))
    
    if (allSelected) {
      // Remove all category permissions
      const filtered = currentPermissions.filter(p => !categoryPermissions.includes(p))
      setFormData({ ...formData, permissions: filtered })
    } else {
      // Add all category permissions
      const combined = [...new Set([...currentPermissions, ...categoryPermissions])]
      setFormData({ ...formData, permissions: combined })
    }
  }

  const selectAllPermissions = () => {
    const allPermissions = AVAILABLE_PERMISSIONS.map(p => p.id)
    setFormData({ ...formData, permissions: allPermissions })
  }

  const clearAllPermissions = () => {
    setFormData({ ...formData, permissions: [] })
  }

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getRoleIcon = (role: Role) => {
    if (role.permissions.includes('*')) return <Crown className="w-5 h-5" />
    if (role.permissions.some(p => p.includes('users.'))) return <Key className="w-5 h-5" />
    if (role.permissions.some(p => p.includes('messages.'))) return <Users className="w-5 h-5" />
    return <Eye className="w-5 h-5" />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            Advanced Role Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage roles with granular permissions
          </p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus size={16} />}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Create Role
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: role.color }}
                  >
                    {getRoleIcon(role)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-600">{role.userCount || 0} users</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleRoleStatus(role)}
                    className={`p-1 rounded ${role.isActive ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {role.isActive ? <Unlock size={16} /> : <Lock size={16} />}
                  </button>
                  
                  <button
                    onClick={() => openEditModal(role)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <Edit3 size={16} />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-600 text-sm mb-3">{role.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Permissions:</span>
                  <span className="font-medium">
                    {role.permissions.includes('*') ? 'All' : role.permissions.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    role.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Roles Found</h3>
          <p className="text-gray-600 mb-4">Create your first role to get started</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Role
          </Button>
        </div>
      )}

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
        size="xl"
      >
        <ModalBody>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Role Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter role name"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter role description"
            />

            {/* Permission Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllPermissions}
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAllPermissions}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {PERMISSION_CATEGORIES.map((category) => {
                  const categoryPermissions = getPermissionsByCategory(category.id)
                  const selectedCount = categoryPermissions.filter(p =>
                    formData.permissions.includes(p.id)
                  ).length
                  const allSelected = selectedCount === categoryPermissions.length

                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{category.icon}</span>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <span className="text-sm text-gray-500">
                            ({selectedCount}/{categoryPermissions.length})
                          </span>
                        </div>
                        <button
                          onClick={() => toggleCategoryPermissions(category.id)}
                          className={`px-3 py-1 rounded text-sm ${
                            allSelected
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryPermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {permission.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {permission.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRole}
            disabled={!formData.name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Role
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Role"
        size="xl"
      >
        <ModalBody>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Role Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter role name"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter role description"
            />

            {/* Permission Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllPermissions}
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAllPermissions}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {PERMISSION_CATEGORIES.map((category) => {
                  const categoryPermissions = getPermissionsByCategory(category.id)
                  const selectedCount = categoryPermissions.filter(p =>
                    formData.permissions.includes(p.id)
                  ).length
                  const allSelected = selectedCount === categoryPermissions.length

                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{category.icon}</span>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <span className="text-sm text-gray-500">
                            ({selectedCount}/{categoryPermissions.length})
                          </span>
                        </div>
                        <button
                          onClick={() => toggleCategoryPermissions(category.id)}
                          className={`px-3 py-1 rounded text-sm ${
                            allSelected
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryPermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {permission.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {permission.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowEditModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditRole}
            disabled={!formData.name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Update Role
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
