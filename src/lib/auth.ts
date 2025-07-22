'use client'

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  username: string
  email?: string
  password?: string // Added password field for authentication
  name: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  department?: string
  permissions: string[]
  avatar?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  name: string
  description?: string
  members: string[] // User IDs
  permissions: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  description: string
  category: 'messaging' | 'analytics' | 'users' | 'settings' | 'api'
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role?: 'agent' | 'viewer'
  department?: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_EXPIRES_IN = '7d'

// Default permissions for each role
const DEFAULT_PERMISSIONS = {
  admin: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'teams.create', 'teams.read', 'teams.update', 'teams.delete',
    'messages.read', 'messages.send', 'messages.delete',
    'analytics.read', 'analytics.export',
    'settings.read', 'settings.update',
    'api.read', 'api.create', 'api.delete',
    'sessions.create', 'sessions.read', 'sessions.delete'
  ],
  manager: [
    'users.read', 'users.update',
    'teams.read', 'teams.update',
    'messages.read', 'messages.send',
    'analytics.read', 'analytics.export',
    'settings.read',
    'sessions.read'
  ],
  agent: [
    'messages.read', 'messages.send',
    'analytics.read',
    'sessions.read'
  ],
  viewer: [
    'messages.read',
    'analytics.read'
  ]
}

export class AuthService {
  private static instance: AuthService | null = null
  private users: Map<string, User> = new Map()
  private teams: Map<string, Team> = new Map()
  private currentUser: User | null = null
  private adminPassword: string = ''

  constructor() {
    this.initializeDefaultData()
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private loadUsersFromStorage() {
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedUsers = localStorage.getItem('app_users')
        if (storedUsers) {
          const users = JSON.parse(storedUsers)
          console.log('📥 Loading users from localStorage:', users.length)

          // Clear existing users and load from storage
          this.users.clear()
          users.forEach((user: User) => {
            this.users.set(user.id, user)
          })

          console.log('✅ Users loaded from storage:', this.users.size)
        }
      }
    } catch (error) {
      console.error('❌ Error loading users from storage:', error)
    }
  }

  private saveUsersToStorage() {
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const users = Array.from(this.users.values())
        localStorage.setItem('app_users', JSON.stringify(users))
        console.log('💾 Users saved to localStorage:', users.length)
      }
    } catch (error) {
      console.error('❌ Error saving users to storage:', error)
    }
  }

  private initializeDefaultData() {
    // Clear localStorage to reset with new permissions structure
    if (typeof window !== 'undefined') {
      localStorage.removeItem('whatsapp_users')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }

    // First try to load users from localStorage
    this.loadUsersFromStorage()

    // Create default admin user with specified credentials
    const adminUser: User = {
      id: 'admin-001', // Fixed ID for consistency
      username: 'ankit1999899',
      email: 'ankit.chauhan1911@outlook.com',
      password: 'Ankit@9718577453', // Store admin password
      name: 'Ankit Chauhan',
      role: 'admin',
      department: 'IT',
      permissions: [
        '*', // Admin wildcard permission
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
        'api.view', 'api.manage', 'api.create', 'api.delete',
        'users.read', 'users.update', 'teams.create', 'teams.read', 'teams.update', 'teams.delete',
        'settings.read', 'settings.update', 'api.read', 'sessions.read'
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // If no users found in storage, create default data
    if (this.users.size === 0) {
      console.log('🔧 Initializing default auth data...')

      // Store admin user in users map
      this.users.set(adminUser.id, adminUser)
      console.log('Admin user created:', adminUser)

      // Create sample users
      const sampleUsers: User[] = [
        {
          id: uuidv4(),
          username: 'manager1',
          email: 'manager@whatsapp-pro.com',
          password: 'manager123', // Default password for demo
          name: 'Team Manager',
          role: 'manager',
          department: 'Customer Service',
          permissions: DEFAULT_PERMISSIONS.manager,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          username: 'agent1',
          email: 'agent1@whatsapp-pro.com',
          password: 'agent123', // Default password for demo
          name: 'Support Agent 1',
          role: 'agent',
          department: 'Customer Service',
          permissions: DEFAULT_PERMISSIONS.agent,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          username: 'agent2',
          email: 'agent2@whatsapp-pro.com',
          password: 'agent123', // Default password for demo
          name: 'Support Agent 2',
          role: 'agent',
          department: 'Sales',
          permissions: DEFAULT_PERMISSIONS.agent,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      sampleUsers.forEach(user => {
        this.users.set(user.id, user)
        console.log('Sample user stored:', user)
      })

      console.log('Total users in map:', this.users.size)
      console.log('All users:', Array.from(this.users.values()))

      // Create sample teams
      const sampleTeams: Team[] = [
        {
          id: uuidv4(),
          name: 'Customer Support',
          description: 'Handle customer inquiries and support requests',
          members: [sampleUsers[1].id, sampleUsers[2].id],
          permissions: ['messages.read', 'messages.send', 'analytics.read'],
          createdBy: adminUser.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'Sales Team',
          description: 'Manage sales inquiries and lead conversion',
          members: [sampleUsers[2].id],
          permissions: ['messages.read', 'messages.send', 'analytics.read'],
          createdBy: adminUser.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      sampleTeams.forEach(team => this.teams.set(team.id, team))

      // Save to localStorage for User Management sync
      this.saveUsersToStorage()
    }

    // Store admin password (in production, this should be hashed)
    this.adminPassword = 'Ankit@9718577453'

    // Set current user to admin for demo
    this.currentUser = adminUser
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      console.log('=== LOGIN ATTEMPT ===')
      console.log('Credentials:', { username: credentials.username, password: credentials.password })

      // Load users from localStorage first (real-time sync with User Management)
      this.loadUsersFromStorage()

      // Ensure data is initialized if no users found
      if (this.users.size === 0) {
        console.log('Users map empty, reinitializing...')
        this.initializeDefaultData()
      }

      console.log('Admin password:', this.adminPassword)
      console.log('Users map size:', this.users.size)
      console.log('Available users:', Array.from(this.users.values()).map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        isActive: u.isActive
      })))



      // Find user by username or email
      const user = Array.from(this.users.values()).find(u =>
        u.username === credentials.username || u.email === credentials.username
      )
      console.log('Found user:', user)

      if (!user) {
        console.log('User not found')
        throw new Error('Invalid username or password')
      }

      console.log('User found:', { username: user.username, isActive: user.isActive })

      if (!user.isActive) {
        console.log('User account is deactivated')
        throw new Error('Account is deactivated')
      }

      // Check password for all users
      console.log('Checking password:', {
        provided: credentials.password,
        stored: user.password,
        username: user.username
      })

      if (!user.password || credentials.password !== user.password) {
        console.log('Password mismatch')
        throw new Error('Invalid username or password')
      }

      console.log('Password match - login successful')

      // Update last login
      user.lastLogin = new Date().toISOString()
      user.updatedAt = new Date().toISOString()
      this.users.set(user.id, user)

      // Save to localStorage for User Management sync
      this.saveUsersToStorage()

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )

      this.currentUser = user

      return { user, token }
    } catch (error) {
      throw new Error('Login failed: ' + (error as Error).message)
    }
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    try {
      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(u => u.email === data.email)
      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Hash password (in demo, we'll skip this)
      // const hashedPassword = await bcrypt.hash(data.password, 12)

      // Create new user
      const newUser: User = {
        id: uuidv4(),
        username: data.email.split('@')[0], // Generate username from email
        email: data.email,
        password: data.password, // Store password
        name: data.name,
        role: data.role || 'agent',
        department: data.department,
        permissions: DEFAULT_PERMISSIONS[data.role || 'agent'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.users.set(newUser.id, newUser)

      // Save to localStorage for User Management sync
      this.saveUsersToStorage()

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )

      return { user: newUser, token }
    } catch (error) {
      throw new Error('Registration failed: ' + (error as Error).message)
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  // Debug function to check users
  debugUsers(): void {
    console.log('=== DEBUG USERS ===')
    console.log('Total users:', this.users.size)
    console.log('Admin password:', this.adminPassword)
    Array.from(this.users.values()).forEach(user => {
      console.log('User:', {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      })
    })
    console.log('=== END DEBUG ===')
  }

  async getUsers(): Promise<User[]> {
    // Load latest users from storage
    this.loadUsersFromStorage()
    return Array.from(this.users.values())
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      this.users.delete(userId)
      // Save to localStorage for User Management sync
      this.saveUsersToStorage()
      console.log('User deleted:', userId)
    } catch (error) {
      throw new Error('Failed to delete user: ' + (error as Error).message)
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const user = this.users.get(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      this.users.set(userId, updatedUser)
      // Save to localStorage for User Management sync
      this.saveUsersToStorage()

      return updatedUser
    } catch (error) {
      throw new Error('Failed to update user: ' + (error as Error).message)
    }
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id)
    if (!user) {
      throw new Error('User not found')
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.users.set(id, updatedUser)
    return updatedUser
  }

  async deleteUser(id: string): Promise<void> {
    if (!this.users.has(id)) {
      throw new Error('User not found')
    }
    this.users.delete(id)
  }

  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values())
  }

  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const newTeam: Team = {
      ...teamData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.teams.set(newTeam.id, newTeam)
    return newTeam
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const team = this.teams.get(id)
    if (!team) {
      throw new Error('Team not found')
    }

    const updatedTeam = {
      ...team,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.teams.set(id, updatedTeam)
    return updatedTeam
  }

  async deleteTeam(id: string): Promise<void> {
    if (!this.teams.has(id)) {
      throw new Error('Team not found')
    }
    this.teams.delete(id)
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false
    return this.currentUser.permissions.includes(permission)
  }

  hasAnyPermission(permissions: string[]): boolean {
    if (!this.currentUser) return false
    return permissions.some(permission => this.currentUser!.permissions.includes(permission))
  }

  hasRole(role: string): boolean {
    if (!this.currentUser) return false
    return this.currentUser.role === role
  }

  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  canAccessResource(resource: string, action: string): boolean {
    const permission = `${resource}.${action}`
    return this.hasPermission(permission)
  }
}

export const authService = new AuthService()

// Permission definitions
export const PERMISSIONS: Permission[] = [
  // User Management
  { id: 'users.create', name: 'Create Users', description: 'Create new user accounts', category: 'users' },
  { id: 'users.read', name: 'View Users', description: 'View user information', category: 'users' },
  { id: 'users.update', name: 'Update Users', description: 'Edit user information', category: 'users' },
  { id: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', category: 'users' },

  // Team Management
  { id: 'teams.create', name: 'Create Teams', description: 'Create new teams', category: 'users' },
  { id: 'teams.read', name: 'View Teams', description: 'View team information', category: 'users' },
  { id: 'teams.update', name: 'Update Teams', description: 'Edit team information', category: 'users' },
  { id: 'teams.delete', name: 'Delete Teams', description: 'Delete teams', category: 'users' },

  // Messaging
  { id: 'messages.read', name: 'View Messages', description: 'View messages and conversations', category: 'messaging' },
  { id: 'messages.send', name: 'Send Messages', description: 'Send messages to contacts', category: 'messaging' },
  { id: 'messages.delete', name: 'Delete Messages', description: 'Delete messages and conversations', category: 'messaging' },

  // Analytics
  { id: 'analytics.read', name: 'View Analytics', description: 'View analytics and reports', category: 'analytics' },
  { id: 'analytics.export', name: 'Export Analytics', description: 'Export analytics data', category: 'analytics' },

  // Settings
  { id: 'settings.read', name: 'View Settings', description: 'View system settings', category: 'settings' },
  { id: 'settings.update', name: 'Update Settings', description: 'Modify system settings', category: 'settings' },

  // API Management
  { id: 'api.read', name: 'View API Keys', description: 'View API keys and webhooks', category: 'api' },
  { id: 'api.create', name: 'Create API Keys', description: 'Create new API keys', category: 'api' },
  { id: 'api.delete', name: 'Delete API Keys', description: 'Delete API keys', category: 'api' },

  // Session Management
  { id: 'sessions.create', name: 'Create Sessions', description: 'Create WhatsApp sessions', category: 'messaging' },
  { id: 'sessions.read', name: 'View Sessions', description: 'View WhatsApp sessions', category: 'messaging' },
  { id: 'sessions.delete', name: 'Delete Sessions', description: 'Delete WhatsApp sessions', category: 'messaging' }
]

// Export default instance
export default AuthService

// Export singleton instance
export const authServiceInstance = AuthService.getInstance()
