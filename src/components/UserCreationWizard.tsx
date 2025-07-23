'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Mail, 
  Lock, 
  Building, 
  Shield, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { ROLES, getRoleByName } from '@/lib/permissions'

interface UserCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: any) => Promise<void>
  currentUserRole: string
}

interface FormData {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
  department: string
  role: string
  isActive: boolean
}

const steps = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Enter user\'s personal details',
    icon: User
  },
  {
    id: 2,
    title: 'Account Details',
    description: 'Set up login credentials',
    icon: Lock
  },
  {
    id: 3,
    title: 'Role & Permissions',
    description: 'Assign role and access level',
    icon: Shield
  },
  {
    id: 4,
    title: 'Review & Create',
    description: 'Confirm details and create user',
    icon: Check
  }
]

export default function UserCreationWizard({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currentUserRole 
}: UserCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'agent',
    isActive: true
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {}

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Full name is required'
        if (!formData.department.trim()) newErrors.department = 'Department is required'
        break
      
      case 2:
        if (!formData.username.trim()) {
          newErrors.username = 'Username is required'
        } else if (formData.username.length < 3) {
          newErrors.username = 'Username must be at least 3 characters'
        }
        
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid'
        }
        
        if (!formData.password.trim()) {
          newErrors.password = 'Password is required'
        } else if (formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters'
        }
        
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match'
        }
        break
      
      case 3:
        if (!formData.role) newErrors.role = 'Role selection is required'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    try {
      setLoading(true)
      const selectedRole = getRoleByName(formData.role)
      
      const userData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        department: formData.department,
        role: formData.role,
        permissions: selectedRole?.permissions || [],
        isActive: formData.isActive
      }

      await onSubmit(userData)
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        role: 'agent',
        isActive: true
      })
      setCurrentStep(1)
      setErrors({})
    } catch (error) {
      console.error('Error creating user:', error)
    } finally {
      setLoading(false)
    }
  }

  const getManageableRoles = () => {
    if (currentUserRole === 'admin') {
      return ROLES.filter(role => role.name !== 'admin')
    }
    
    const userRole = getRoleByName(currentUserRole)
    if (!userRole) return []
    
    return ROLES.filter(role => role.level < userRole.level)
  }

  const getRoleIcon = (roleName: string) => {
    const roleInfo = getRoleByName(roleName)
    switch (roleInfo?.icon) {
      case 'Crown': return <Shield className="w-4 h-4" />
      case 'Shield': return <Shield className="w-4 h-4" />
      case 'User': return <User className="w-4 h-4" />
      case 'Eye': return <Eye className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <UserPlus className="w-6 h-6 mr-3 text-blue-600" />
                  Create New User
                </h2>
                <p className="text-gray-600 mt-1">Step {currentStep} of {steps.length}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Progress Steps */}
            <div className="mt-6 flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 transition-all ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
                      <p className="text-gray-600">Enter the user's personal details</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Full Name *"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        error={errors.name}
                        placeholder="Enter full name"
                        leftIcon={<User className="w-4 h-4" />}
                      />
                      
                      <Input
                        label="Department *"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        error={errors.department}
                        placeholder="Enter department"
                        leftIcon={<Building className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Account Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Account Details</h3>
                      <p className="text-gray-600">Set up login credentials</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Username *"
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          error={errors.username}
                          placeholder="Enter username"
                          leftIcon={<User className="w-4 h-4" />}
                        />
                        
                        <Input
                          label="Email Address *"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          error={errors.email}
                          placeholder="Enter email address"
                          leftIcon={<Mail className="w-4 h-4" />}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Password *"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          error={errors.password}
                          placeholder="Enter password"
                          leftIcon={<Lock className="w-4 h-4" />}
                        />
                        
                        <Input
                          label="Confirm Password *"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          error={errors.confirmPassword}
                          placeholder="Confirm password"
                          leftIcon={<Lock className="w-4 h-4" />}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Role Selection */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Role & Permissions</h3>
                      <p className="text-gray-600">Assign role and access level</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getManageableRoles().map((role) => (
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
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
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
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Review & Create</h3>
                      <p className="text-gray-600">Confirm details and create user</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Full Name</label>
                          <p className="text-gray-900">{formData.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Department</label>
                          <p className="text-gray-900">{formData.department}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Username</label>
                          <p className="text-gray-900">{formData.username}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-gray-900">{formData.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Role</label>
                          <p className="text-gray-900">{getRoleByName(formData.role)?.displayName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <p className={`${formData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onClose : handlePrevious}
              icon={currentStep === 1 ? undefined : <ChevronLeft className="w-4 h-4" />}
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>
            
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                variant="primary"
                icon={<ChevronRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={loading}
                variant="primary"
                icon={<UserPlus className="w-4 h-4" />}
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
