'use client'

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  email: string
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
  email: string
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

class AuthService {
  private users: Map<string, User> = new Map()
  private teams: Map<string, Team> = new Map()
  private currentUser: User | null = null

  constructor() {
    this.initializeDefaultData()
  }

  private initializeDefaultData() {
    // Create default admin user
    const adminUser: User = {
      id: uuidv4(),
      email: 'admin@whatsapp-pro.com',
      name: 'System Administrator',
      role: 'admin',
      department: 'IT',
      permissions: DEFAULT_PERMISSIONS.admin,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Create sample users
    const sampleUsers: User[] = [
      {
        id: uuidv4(),
        email: 'manager@whatsapp-pro.com',
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
        email: 'agent1@whatsapp-pro.com',
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
        email: 'agent2@whatsapp-pro.com',
        name: 'Support Agent 2',
        role: 'agent',
        department: 'Sales',
        permissions: DEFAULT_PERMISSIONS.agent,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // Store users
    this.users.set(adminUser.id, adminUser)
    sampleUsers.forEach(user => this.users.set(user.id, user))

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

    // Set current user to admin for demo
    this.currentUser = adminUser
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      // Find user by email
      const user = Array.from(this.users.values()).find(u => u.email === credentials.email)
      
      if (!user) {
        throw new Error('Invalid email or password')
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated')
      }

      // In a real app, you would verify the password hash
      // For demo purposes, we'll accept any password
      
      // Update last login
      user.lastLogin = new Date().toISOString()
      user.updatedAt = new Date().toISOString()
      this.users.set(user.id, user)

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
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
        email: data.email,
        name: data.name,
        role: data.role || 'agent',
        department: data.department,
        permissions: DEFAULT_PERMISSIONS[data.role || 'agent'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.users.set(newUser.id, newUser)

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

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values())
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
