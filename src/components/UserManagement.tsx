'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authServiceInstance, User } from '@/lib/auth'
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Crown,
  Star,
  User as UserIcon,
  Settings,
  AlertTriangle
} from 'lucide-react'
import { LocalStorage, LocalUser } from '@/lib/local-storage'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal, { ModalHeader, ModalBody, ModalFooter } from './ui/Modal'
import { useTheme } from '@/contexts/ThemeContext'
import { cn, formatDate, getTimeAgo } from '@/lib/utils'

const getRoleColors = (colors: any) => ({
  admin: { backgroundColor: '#EF444420', color: '#EF4444' },
  manager: { backgroundColor: `${colors.primary}20`, color: colors.primary },
  agent: { backgroundColor: `${colors.secondary}20`, color: colors.secondary },
  viewer: { backgroundColor: `${colors.accent}20`, color: colors.accent }
})

const roleIcons = {
  admin: Crown,
  manager: Star,
  agent: UserIcon,
  viewer: Eye
}

interface UserFormData {
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  department: string
  permissions: string[]
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
  isActive: boolean
}

export default function UserManagement() {
  // Theme hook
  const { colors, isDark } = useTheme()

  const [users, setUsers] = useState<LocalUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<LocalUser[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'agent',
    department: '',
    permissions: []
  })

  // Dynamic roles for filter dropdown
  const filterRoles = [
    { value: 'all', label: 'All Roles' },
    ...availableRoles.map(role => ({
      value: role.id,
      label: role.name
    }))
  ]

  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'Customer Service', label: 'Customer Service' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'IT', label: 'IT' },
    { value: 'Management', label: 'Management' }
  ]

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadUsers()
      loadRoles()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadRoles = () => {
    try {
      const savedRoles = localStorage.getItem('app_roles')
      if (savedRoles) {
        const roles = JSON.parse(savedRoles)
        setAvailableRoles(roles.filter((role: Role) => role.isActive))
      } else {
        // Default roles if none exist
        setAvailableRoles([
          { id: 'admin', name: 'Administrator', description: 'Full access', permissions: ['*'], color: '#DC2626', isActive: true },
          { id: 'manager', name: 'Manager', description: 'Management access', permissions: [], color: '#2563EB', isActive: true },
          { id: 'agent', name: 'Agent', description: 'Basic access', permissions: [], color: '#059669', isActive: true },
          { id: 'viewer', name: 'Viewer', description: 'Read-only access', permissions: [], color: '#6B7280', isActive: true }
        ])
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, selectedRole, selectedDepartment])

  const loadUsers = async () => {
    try {
      setLoading(true)

      // Load from localStorage first
      const savedUsers = localStorage.getItem('app_users')
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers)
        setUsers(parsedUsers)

        // Also sync with authService
        const usersMap = (authServiceInstance as any).users
        usersMap.clear()
        parsedUsers.forEach((user: any) => {
          usersMap.set(user.id, user)
        })
      } else {
        // Fallback to authService
        const userList = await authServiceInstance.getUsers()
        setUsers(userList)
        saveUsersToStorage(userList)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveUsersToStorage = (usersToSave: any[]) => {
    try {
      localStorage.setItem('app_users', JSON.stringify(usersToSave))
      console.log('Users saved to localStorage:', usersToSave)
    } catch (error) {
      console.error('Error saving users to localStorage:', error)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole)
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(user => user.department === selectedDepartment)
    }

    setFilteredUsers(filtered)
  }

  const handleCreateUser = async () => {
    try {
      // Generate username from email
      const username = formData.email.split('@')[0]

      // Create user with proper username and password
      const newUser = {
        id: `user-${Date.now()}`,
        username: username,
        email: formData.email,
        password: formData.password, // Include password field
        name: formData.name,
        role: formData.role,
        department: formData.department,
        permissions: getDefaultPermissions(formData.role),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Add to current users list
      const updatedUsers = [...users, newUser]
      setUsers(updatedUsers)

      // Save to localStorage
      saveUsersToStorage(updatedUsers)

      // Also add to auth service
      const usersMap = (authServiceInstance as any).users
      usersMap.set(newUser.id, newUser)

      console.log('User created and saved:', newUser)

      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['*']
      case 'manager':
        return ['users.read', 'messages.read', 'messages.send', 'analytics.read']
      case 'agent':
        return ['messages.read', 'messages.send']
      case 'viewer':
        return ['messages.read', 'analytics.read']
      default:
        return ['messages.read']
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const updatedUser = {
        ...selectedUser,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        permissions: formData.permissions,
        updatedAt: new Date().toISOString()
      }

      // Update password if provided
      if (formData.password && formData.password.trim() !== '') {
        updatedUser.password = formData.password
      }

      // Update in users list
      const updatedUsers = users.map(user =>
        user.id === selectedUser.id ? updatedUser : user
      )
      setUsers(updatedUsers)

      // Save to localStorage
      saveUsersToStorage(updatedUsers)

      // Also update in auth service
      await authServiceInstance.updateUser(selectedUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        permissions: formData.permissions
      })

      console.log('User updated and saved:', updatedUser)

      setShowEditModal(false)
      setSelectedUser(null)
      resetForm()
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Remove from users list
        const updatedUsers = users.filter(user => user.id !== userId)
        setUsers(updatedUsers)

        // Save to localStorage
        saveUsersToStorage(updatedUsers)

        // Also remove from auth service
        await authServiceInstance.deleteUser(userId)

        console.log('User deleted:', userId)
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    try {
      const updatedUser = {
        ...user,
        isActive: !user.isActive,
        updatedAt: new Date().toISOString()
      }

      // Update in users list
      const updatedUsers = users.map(u =>
        u.id === user.id ? updatedUser : u
      )
      setUsers(updatedUsers)

      // Save to localStorage
      saveUsersToStorage(updatedUsers)

      // Also update in auth service
      await authServiceInstance.updateUser(user.id, {
        isActive: !user.isActive
      })

      console.log('User status toggled:', updatedUser)
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Empty for security, user can enter new password if needed
      role: user.role,
      department: user.department || '',
      permissions: user.permissions
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    const defaultRole = availableRoles.length > 0 ? availableRoles[0].id : 'agent'
    setFormData({
      name: '',
      email: '',
      password: '',
      role: defaultRole,
      department: '',
      permissions: []
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-48 rounded-xl"></div>
            ))}
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
            Manage users, roles, and permissions for your organization
          </p>
        </div>
        
        <Button
          onClick={() => {
            loadRoles() // Refresh roles before opening modal
            setShowCreateModal(true)
          }}
          icon={<UserPlus size={16} />}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Administrators</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Agents</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.role === 'agent').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="elevated">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filterRoles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
            
            <Button variant="outline" icon={<Filter size={16} />}>
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredUsers.map((user, index) => {
            const RoleIcon = roleIcons[user.role]
            
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="elevated" hover className="relative">
                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user)}
                          className="p-1"
                        >
                          {user.isActive ? (
                            <Eye size={16} className="text-green-600" />
                          ) : (
                            <EyeOff size={16} className="text-gray-400" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          className="p-1"
                        >
                          <Edit size={16} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Role:</span>
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
                            roleColors[user.role]
                          )}>
                            <RoleIcon size={12} />
                            <span>{user.role}</span>
                          </span>
                        </div>
                      </div>
                      
                      {user.department && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Department:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {user.department}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          user.isActive 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        )}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Permissions:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {user.permissions.length}
                        </span>
                      </div>
                      
                      {user.lastLogin && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Last Login:</span>
                          <span className="text-sm text-gray-900">
                            {getTimeAgo(user.lastLogin)}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          Created {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            {searchQuery || selectedRole !== 'all' || selectedDepartment !== 'all' 
              ? 'No users found matching your filters' 
              : 'No users found'
            }
          </p>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="lg"
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
            />
            
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Enter department"
            />
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
            onClick={handleCreateUser}
            disabled={!formData.name || !formData.email || !formData.password}
          >
            Create User
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="lg"
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
            />
            
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />

            <Input
              label="Password (Leave blank to keep current)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter new password"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Enter department"
            />
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
            onClick={handleEditUser}
            disabled={!formData.name || !formData.email}
          >
            Update User
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
