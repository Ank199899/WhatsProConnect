// Permission interface
export interface Permission {
  id: string
  name: string
  description: string
  category: string
  section: string
  level?: 'read' | 'write' | 'admin'
}

// Available permissions with detailed feature access
export const AVAILABLE_PERMISSIONS: Permission[] = [
  // Dashboard Access
  { id: 'dashboard.view', name: 'View Dashboard', description: 'Access to main dashboard overview', category: 'dashboard', section: 'Dashboard' },
  { id: 'dashboard.stats', name: 'View Statistics', description: 'View dashboard statistics and metrics', category: 'dashboard', section: 'Dashboard' },
  
  // Inbox & Messaging
  { id: 'inbox.view', name: 'View Inbox', description: 'Access to message inbox', category: 'messaging', section: 'Inbox' },
  { id: 'inbox.ai', name: 'AI Inbox', description: 'Access to AI-powered inbox features', category: 'messaging', section: 'Inbox' },
  { id: 'inbox.live', name: 'Live Inbox', description: 'Access to live chat inbox', category: 'messaging', section: 'Inbox' },
  { id: 'messages.read', name: 'Read Messages', description: 'View incoming messages', category: 'messaging', section: 'Messaging' },
  { id: 'messages.send', name: 'Send Messages', description: 'Send messages to contacts', category: 'messaging', section: 'Messaging' },
  { id: 'messages.delete', name: 'Delete Messages', description: 'Delete messages', category: 'messaging', section: 'Messaging' },
  
  // Session Management
  { id: 'sessions.view', name: 'View Sessions', description: 'View WhatsApp sessions/numbers', category: 'sessions', section: 'Sessions' },
  { id: 'sessions.create', name: 'Create Sessions', description: 'Create new WhatsApp sessions', category: 'sessions', section: 'Sessions' },
  { id: 'sessions.manage', name: 'Manage Sessions', description: 'Start/stop/configure sessions', category: 'sessions', section: 'Sessions' },
  { id: 'sessions.delete', name: 'Delete Sessions', description: 'Delete WhatsApp sessions', category: 'sessions', section: 'Sessions' },
  
  // Contacts Management
  { id: 'contacts.view', name: 'View Contacts', description: 'View contact lists and details', category: 'contacts', section: 'Contacts' },
  { id: 'contacts.create', name: 'Create Contacts', description: 'Add new contacts', category: 'contacts', section: 'Contacts' },
  { id: 'contacts.edit', name: 'Edit Contacts', description: 'Modify contact information', category: 'contacts', section: 'Contacts' },
  { id: 'contacts.delete', name: 'Delete Contacts', description: 'Remove contacts', category: 'contacts', section: 'Contacts' },
  { id: 'contacts.import', name: 'Import Contacts', description: 'Import contacts from files', category: 'contacts', section: 'Contacts' },
  { id: 'contacts.export', name: 'Export Contacts', description: 'Export contact data', category: 'contacts', section: 'Contacts' },
  
  // Bulk Messaging
  { id: 'bulk.view', name: 'View Bulk Campaigns', description: 'View bulk messaging campaigns', category: 'bulk', section: 'Bulk Messaging' },
  { id: 'bulk.create', name: 'Create Campaigns', description: 'Create new bulk campaigns', category: 'bulk', section: 'Bulk Messaging' },
  { id: 'bulk.send', name: 'Send Bulk Messages', description: 'Execute bulk messaging campaigns', category: 'bulk', section: 'Bulk Messaging' },
  { id: 'bulk.schedule', name: 'Schedule Messages', description: 'Schedule bulk messages for later', category: 'bulk', section: 'Bulk Messaging' },
  { id: 'bulk.advanced', name: 'Advanced Bulk Features', description: 'Access advanced bulk messaging features', category: 'bulk', section: 'Bulk Messaging' },
  
  // Templates Management
  { id: 'templates.view', name: 'View Templates', description: 'View message templates', category: 'templates', section: 'Templates' },
  { id: 'templates.create', name: 'Create Templates', description: 'Create new message templates', category: 'templates', section: 'Templates' },
  { id: 'templates.edit', name: 'Edit Templates', description: 'Modify existing templates', category: 'templates', section: 'Templates' },
  { id: 'templates.delete', name: 'Delete Templates', description: 'Remove templates', category: 'templates', section: 'Templates' },
  { id: 'templates.approve', name: 'Approve Templates', description: 'Approve templates for use', category: 'templates', section: 'Templates' },
  
  // Analytics & Reports
  { id: 'analytics.view', name: 'View Analytics', description: 'Access basic analytics and reports', category: 'analytics', section: 'Analytics' },
  { id: 'analytics.advanced', name: 'Advanced Analytics', description: 'Access advanced analytics features', category: 'analytics', section: 'Analytics' },
  { id: 'analytics.export', name: 'Export Reports', description: 'Export analytics data and reports', category: 'analytics', section: 'Analytics' },
  { id: 'analytics.realtime', name: 'Real-time Analytics', description: 'View real-time analytics data', category: 'analytics', section: 'Analytics' },
  
  // AI Management
  { id: 'ai.view', name: 'View AI Features', description: 'Access AI management interface', category: 'ai', section: 'AI Management' },
  { id: 'ai.agents', name: 'Manage AI Agents', description: 'Create and manage AI agents', category: 'ai', section: 'AI Management' },
  { id: 'ai.providers', name: 'AI Provider Settings', description: 'Configure AI provider settings', category: 'ai', section: 'AI Management' },
  { id: 'ai.ultimate', name: 'Ultimate AI Control', description: 'Access ultimate AI management panel', category: 'ai', section: 'AI Management' },
  
  // User Management
  { id: 'users.view', name: 'View Users', description: 'View user accounts and details', category: 'users', section: 'User Management' },
  { id: 'users.create', name: 'Create Users', description: 'Create new user accounts', category: 'users', section: 'User Management' },
  { id: 'users.edit', name: 'Edit Users', description: 'Modify user accounts and settings', category: 'users', section: 'User Management' },
  { id: 'users.delete', name: 'Delete Users', description: 'Remove user accounts', category: 'users', section: 'User Management' },
  { id: 'users.permissions', name: 'Manage User Permissions', description: 'Assign permissions to users', category: 'users', section: 'User Management' },
  
  // Role Management
  { id: 'roles.view', name: 'View Roles', description: 'View roles and their permissions', category: 'roles', section: 'Roles & Permissions' },
  { id: 'roles.create', name: 'Create Roles', description: 'Create new roles', category: 'roles', section: 'Roles & Permissions' },
  { id: 'roles.edit', name: 'Edit Roles', description: 'Modify existing roles and permissions', category: 'roles', section: 'Roles & Permissions' },
  { id: 'roles.delete', name: 'Delete Roles', description: 'Remove roles from system', category: 'roles', section: 'Roles & Permissions' },
  { id: 'roles.assign', name: 'Assign Roles', description: 'Assign roles to users', category: 'roles', section: 'Roles & Permissions' },
  
  // API & Webhooks
  { id: 'api.view', name: 'View API Settings', description: 'View API keys and webhook configurations', category: 'api', section: 'API & Webhooks' },
  { id: 'api.create', name: 'Create API Keys', description: 'Generate new API keys', category: 'api', section: 'API & Webhooks' },
  { id: 'api.edit', name: 'Edit API Settings', description: 'Modify API and webhook settings', category: 'api', section: 'API & Webhooks' },
  { id: 'api.delete', name: 'Delete API Keys', description: 'Remove API keys and webhooks', category: 'api', section: 'API & Webhooks' },
  
  // System Settings
  { id: 'settings.view', name: 'View Settings', description: 'Access system settings', category: 'settings', section: 'Settings' },
  { id: 'settings.edit', name: 'Edit Settings', description: 'Modify system configurations', category: 'settings', section: 'Settings' },
  { id: 'settings.backup', name: 'Backup & Restore', description: 'Perform system backup and restore', category: 'settings', section: 'Settings' },
  
  // Login Credentials
  { id: 'credentials.view', name: 'View Login Credentials', description: 'Access login credentials display', category: 'credentials', section: 'Login Credentials' },
  
  // Help & Support
  { id: 'help.view', name: 'View Help', description: 'Access help and support section', category: 'help', section: 'Help & Support' }
]

// Permission categories for grouping
export const PERMISSION_CATEGORIES = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊', color: 'blue' },
  { id: 'messaging', name: 'Messaging', icon: '💬', color: 'green' },
  { id: 'sessions', name: 'Sessions', icon: '📱', color: 'purple' },
  { id: 'contacts', name: 'Contacts', icon: '👥', color: 'orange' },
  { id: 'bulk', name: 'Bulk Messaging', icon: '📢', color: 'red' },
  { id: 'templates', name: 'Templates', icon: '📝', color: 'emerald' },
  { id: 'analytics', name: 'Analytics', icon: '📈', color: 'indigo' },
  { id: 'ai', name: 'AI Management', icon: '🤖', color: 'violet' },
  { id: 'users', name: 'User Management', icon: '👤', color: 'cyan' },
  { id: 'roles', name: 'Roles & Permissions', icon: '🔐', color: 'teal' },
  { id: 'api', name: 'API & Webhooks', icon: '🔗', color: 'pink' },
  { id: 'settings', name: 'Settings', icon: '⚙️', color: 'gray' },
  { id: 'credentials', name: 'Credentials', icon: '🔑', color: 'yellow' },
  { id: 'help', name: 'Help & Support', icon: '❓', color: 'slate' }
]

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS = {
  admin: [
    '*', // All permissions wildcard
    'dashboard.view', 'dashboard.stats',
    'sessions.view', 'sessions.manage', 'sessions.create', 'sessions.delete',
    'inbox.view', 'messages.read', 'messages.send', 'messages.delete',
    'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete',
    'bulk.view', 'bulk.create', 'bulk.send', 'bulk.schedule',
    'templates.view', 'templates.create', 'templates.edit', 'templates.delete',
    'analytics.view', 'analytics.advanced', 'analytics.export',
    'ai.view', 'ai.manage', 'ai.configure',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
    'credentials.view', 'credentials.manage',
    'api.view', 'api.manage', 'api.create', 'api.delete'
  ], // All permissions
  manager: [
    'dashboard.view', 'dashboard.stats',
    'inbox.view', 'messages.read', 'messages.send',
    'sessions.view', 'sessions.manage',
    'contacts.view', 'contacts.create', 'contacts.edit',
    'bulk.view', 'bulk.create', 'bulk.send',
    'templates.view', 'templates.create', 'templates.edit',
    'analytics.view', 'analytics.advanced',
    'users.view', 'users.create', 'users.edit'
  ],
  agent: [
    'dashboard.view',
    'inbox.view', 'messages.read', 'messages.send',
    'contacts.view', 'contacts.create',
    'templates.view',
    'analytics.view'
  ],
  viewer: [
    'dashboard.view',
    'inbox.view', 'messages.read',
    'contacts.view',
    'templates.view',
    'analytics.view'
  ]
}

// Helper functions
export const getPermissionsByCategory = (category: string): Permission[] => {
  return AVAILABLE_PERMISSIONS.filter(p => p.category === category)
}

export const getPermissionsBySection = (section: string): Permission[] => {
  return AVAILABLE_PERMISSIONS.filter(p => p.section === section)
}

export const getAllSections = (): string[] => {
  return [...new Set(AVAILABLE_PERMISSIONS.map(p => p.section))]
}

export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  if (userPermissions.includes('*')) return true
  return userPermissions.includes(requiredPermission)
}

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  if (userPermissions.includes('*')) return true
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}
