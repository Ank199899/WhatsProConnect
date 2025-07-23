'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Shield, 
  Crown, 
  User, 
  Key,
  Save,
  X,
  Check,
  AlertCircle,
  UserPlus,
  Settings,
  Lock,
  Unlock,
  Mail,
  Phone,
  Building
} from 'lucide-react'
import { authServiceInstance } from '@/lib/auth'
import Card, { CardHeader, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES, getRoleByName, canUserManageRole, getManageableRoles } from '@/lib/permissions'
import UserCreationWizard from './UserCreationWizard'

interface User {
  id: string
  username: string
  email: string
  password: string
  name: string
  role: string
  department: string
  permissions: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

interface Role {
  id: string
  name: string
  displayName: string
  description: string
  permissions: string[]
  color: string
  icon: string
}

// Use roles from permissions system
const availableRoles = ROLES

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { user: currentUser } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'agent',
    department: '',
    isActive: true
  })

  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersMap = (authServiceInstance as any).users
      const usersList = Array.from(usersMap.values())
      setUsers(usersList)
    } catch (err) {
      setError('Failed to load users')
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (!formData.name.trim()) {
      errors.name = 'Full name is required'
    }
    
    if (!formData.department.trim()) {
      errors.department = 'Department is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateUser = async (userData?: any) => {
    // If userData is provided (from wizard), use it; otherwise use form data
    const dataToUse = userData || {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      name: formData.name,
      role: formData.role,
      department: formData.department,
      isActive: formData.isActive
    }

    // Validate form only if using form data (not wizard)
    if (!userData && !validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const selectedRole = getRoleByName(dataToUse.role)

      const newUser = {
        username: dataToUse.username,
        email: dataToUse.email,
        password: dataToUse.password,
        name: dataToUse.name,
        role: dataToUse.role,
        department: dataToUse.department,
        permissions: selectedRole?.permissions || [],
        isActive: dataToUse.isActive
      }

      const result = await authServiceInstance.register(newUser)

      setSuccess(`User ${dataToUse.name} created successfully!`)

      if (!userData) {
        setShowCreateModal(false)
        resetForm()
      }

      loadUsers()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser || !validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const selectedRole = getRoleByName(formData.role)
      
      const updatedUser = {
        ...selectedUser,
        username: formData.username,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        department: formData.department,
        permissions: selectedRole?.permissions || [],
        isActive: formData.isActive,
        updatedAt: new Date().toISOString()
      }

      // Update password only if provided
      if (formData.password.trim()) {
        updatedUser.password = formData.password
      }

      // Update user in auth service
      const usersMap = (authServiceInstance as any).users
      usersMap.set(selectedUser.id, updatedUser)
      // Save to localStorage
      ;(authServiceInstance as any).saveUsersToStorage()

      setSuccess(`User ${formData.name} updated successfully!`)
      setShowEditModal(false)
      setSelectedUser(null)
      resetForm()
      loadUsers()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update user')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      setLoading(true)
      setError(null)

      const usersMap = (authServiceInstance as any).users
      const user = usersMap.get(userId)
      
      if (user) {
        usersMap.delete(userId)
        // Save to localStorage
        ;(authServiceInstance as any).saveUsersToStorage()
        setSuccess(`User ${user.name} deleted successfully!`)
        loadUsers()
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const usersMap = (authServiceInstance as any).users
      const user = usersMap.get(userId)
      
      if (user) {
        user.isActive = !user.isActive
        user.updatedAt = new Date().toISOString()
        usersMap.set(userId, user)
        // Save to localStorage
        ;(authServiceInstance as any).saveUsersToStorage()

        setSuccess(`User ${user.name} ${user.isActive ? 'activated' : 'deactivated'} successfully!`)
        loadUsers()
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update user status')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      role: 'agent',
      department: '',
      isActive: true
    })
    setFormErrors({})
    setShowPassword(false)
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't pre-fill password for security
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive
    })
    setShowEditModal(true)
  }

  const getRoleInfo = (roleName: string) => {
    return getRoleByName(roleName) || ROLES.find(r => r.name === 'agent') // Default to agent
  }

  const getRoleIcon = (roleName: string) => {
    const roleInfo = getRoleInfo(roleName)
    switch (roleInfo.icon) {
      case 'Crown': return <Crown className="w-4 h-4" />
      case 'Shield': return <Shield className="w-4 h-4" />
      case 'User': return <User className="w-4 h-4" />
      case 'Eye': return <Eye className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">Only administrators can access user management</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage user accounts with role-based permissions
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowCreateWizard(true)}
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create User (Wizard)
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="outline"
            icon={<UserPlus className="w-4 h-4" />}
          >
            Quick Create
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center"
          >
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800">{success}</span>
          </motion.div>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center"
          >
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            const roleInfo = getRoleInfo(user.role)
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${roleInfo.color} rounded-full flex items-center justify-center text-white`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={`p-1 rounded ${user.isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                          title={user.isActive ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.isActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        {canUserManageRole(currentUser?.role || 'viewer', user.role) && (
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {user.id !== currentUser.id && canUserManageRole(currentUser?.role || 'viewer', user.role) && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{user.department}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color} text-white`}>
                        {roleInfo.displayName}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {user.lastLogin && (
                      <div className="text-xs text-gray-500">
                        Last login: {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <UserPlus className="w-6 h-6 mr-3 text-blue-600" />
                    Create New User
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Full Name *"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      error={formErrors.name}
                      placeholder="Enter full name"
                      leftIcon={<User className="w-4 h-4" />}
                    />
                  </div>

                  <div>
                    <Input
                      label="Username *"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      error={formErrors.username}
                      placeholder="Enter username"
                      leftIcon={<User className="w-4 h-4" />}
                    />
                  </div>

                  <div>
                    <Input
                      label="Email Address *"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      error={formErrors.email}
                      placeholder="Enter email address"
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                  </div>

                  <div>
                    <Input
                      label="Department *"
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      error={formErrors.department}
                      placeholder="Enter department"
                      leftIcon={<Building className="w-4 h-4" />}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Input
                    label="Password *"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    error={formErrors.password}
                    placeholder="Enter password"
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Role & Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getManageableRoles(currentUser?.role || 'viewer').map((role) => (
                      <div
                        key={role.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.role === role.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData({...formData, role: role.name})}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${role.color} rounded-full flex items-center justify-center text-white`}>
                            {getRoleIcon(role.name)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{role.displayName}</h4>
                            <p className="text-xs text-gray-500">{role.description}</p>
                          </div>
                          {formData.role === role.name && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Activate user account immediately
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  loading={loading}
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                >
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Edit className="w-6 h-6 mr-3 text-blue-600" />
                    Edit User: {selectedUser.name}
                  </h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Full Name *"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      error={formErrors.name}
                      placeholder="Enter full name"
                      leftIcon={<User className="w-4 h-4" />}
                    />
                  </div>

                  <div>
                    <Input
                      label="Username *"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      error={formErrors.username}
                      placeholder="Enter username"
                      leftIcon={<User className="w-4 h-4" />}
                    />
                  </div>

                  <div>
                    <Input
                      label="Email Address *"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      error={formErrors.email}
                      placeholder="Enter email address"
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                  </div>

                  <div>
                    <Input
                      label="Department *"
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      error={formErrors.department}
                      placeholder="Enter department"
                      leftIcon={<Building className="w-4 h-4" />}
                    />
                  </div>
                </div>

                {/* Password (optional for edit) */}
                <div>
                  <Input
                    label="New Password (leave blank to keep current)"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Enter new password (optional)"
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Role & Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getManageableRoles(currentUser?.role || 'viewer').map((role) => (
                      <div
                        key={role.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.role === role.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData({...formData, role: role.name})}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${role.color} rounded-full flex items-center justify-center text-white`}>
                            {getRoleIcon(role.name)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{role.displayName}</h4>
                            <p className="text-xs text-gray-500">{role.description}</p>
                          </div>
                          {formData.role === role.name && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActiveEdit" className="text-sm font-medium text-gray-700">
                    User account is active
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditUser}
                  loading={loading}
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                >
                  {loading ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Creation Wizard */}
      <UserCreationWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onSubmit={handleCreateUser}
        currentUserRole={currentUser?.role || 'viewer'}
      />
    </div>
  )
}
