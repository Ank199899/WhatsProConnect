'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Settings
} from 'lucide-react'
import { LocalStorage, LocalUser } from '@/lib/local-storage'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal, { ModalHeader, ModalBody, ModalFooter } from './ui/Modal'
import { cn, formatDate, getTimeAgo } from '@/lib/utils'

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  agent: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800'
}

const roleIcons = {
  admin: Crown,
  manager: Star,
  agent: UserIcon,
  viewer: Eye
}

interface UserFormData {
  name: string
  email: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  department: string
  permissions: string[]
}

export default function UserManagement() {
  const [users, setUsers] = useState<LocalUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<LocalUser[]>([])
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
    role: 'agent',
    department: '',
    permissions: []
  })

  const roles = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'agent', label: 'Agent' },
    { value: 'viewer', label: 'Viewer' }
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
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, selectedRole, selectedDepartment])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const userList = await authService.getUsers()
      setUsers(userList)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
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
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: 'defaultPassword123', // In real app, generate or ask for password
        role: formData.role,
        department: formData.department
      })
      
      setShowCreateModal(false)
      resetForm()
      loadUsers()
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      await authService.updateUser(selectedUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        permissions: formData.permissions
      })
      
      setShowEditModal(false)
      setSelectedUser(null)
      resetForm()
      loadUsers()
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await authService.deleteUser(userId)
        loadUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    try {
      await authService.updateUser(user.id, {
        isActive: !user.isActive
      })
      loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      permissions: user.permissions
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'agent',
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
          onClick={() => setShowCreateModal(true)}
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
              {roles.map(role => (
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
                <option value="viewer">Viewer</option>
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
            disabled={!formData.name || !formData.email}
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
                <option value="viewer">Viewer</option>
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
