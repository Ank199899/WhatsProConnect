'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, hasAnyPermission } from '@/lib/permissions'
import { Lock, AlertTriangle } from 'lucide-react'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showError?: boolean
}

export default function PermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  showError = true
}: PermissionGuardProps) {
  const { user } = useAuth()

  if (!user) {
    return showError ? (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access this feature</p>
        </div>
      </div>
    ) : null
  }

  const userPermissions = user?.permissions || []
  
  // Check single permission
  if (permission) {
    const hasAccess = hasPermission(userPermissions, permission)
    if (!hasAccess) {
      return fallback || (showError ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access this feature</p>
            <p className="text-sm text-gray-500 mt-2">Required: {permission}</p>
          </div>
        </div>
      ) : null)
    }
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasAccess = requireAll 
      ? permissions.every(p => hasPermission(userPermissions, p))
      : hasAnyPermission(userPermissions, permissions)
      
    if (!hasAccess) {
      return fallback || (showError ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access this feature</p>
            <div className="text-sm text-gray-500 mt-2">
              <p>Required {requireAll ? 'all' : 'any'} of:</p>
              <ul className="list-disc list-inside mt-1">
                {permissions.map(p => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null)
    }
  }

  return <>{children}</>
}

// Hook for checking permissions in components
export function usePermissions() {
  const { user } = useAuth()
  const userPermissions = user?.permissions || []

  return {
    hasPermission: (permission: string) => hasPermission(userPermissions, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(userPermissions, permissions),
    hasAllPermissions: (permissions: string[]) => permissions.every(p => hasPermission(userPermissions, p)),
    userPermissions,
    isAdmin: hasPermission(userPermissions, '*')
  }
}

// Component for conditional rendering based on permissions
interface ConditionalRenderProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ConditionalRender({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback = null
}: ConditionalRenderProps) {
  const { hasPermission: checkPermission, hasAnyPermission: checkAnyPermission, hasAllPermissions } = usePermissions()

  let hasAccess = true

  if (permission) {
    hasAccess = checkPermission(permission)
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : checkAnyPermission(permissions)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Button component with permission check
interface PermissionButtonProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  [key: string]: any
}

export function PermissionButton({
  permission,
  permissions = [],
  requireAll = false,
  children,
  onClick,
  className = '',
  disabled = false,
  ...props
}: PermissionButtonProps) {
  const { hasPermission: checkPermission, hasAnyPermission: checkAnyPermission, hasAllPermissions } = usePermissions()

  let hasAccess = true

  if (permission) {
    hasAccess = checkPermission(permission)
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : checkAnyPermission(permissions)
  }

  if (!hasAccess) {
    return null
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}
