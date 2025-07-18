// Local storage service for WhatsApp data
export interface LocalSession {
  id: string
  name: string
  phone_number?: string
  status: 'initializing' | 'qr_code' | 'ready' | 'disconnected' | 'auth_failure'
  created_at: string
  is_active: boolean
}

export interface LocalContact {
  id: string
  session_id: string
  name: string
  phone_number: string
  is_group: boolean
  profile_pic_url?: string
  created_at: string
}

export interface LocalMessage {
  id: string
  session_id: string
  from_number: string
  to_number: string
  body: string
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice'
  is_group_message: boolean
  timestamp: string
  created_at: string
}

export interface LocalUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  department: string
  is_active: boolean
  created_at: string
}

export interface LocalAPIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  created_at: string
  expires_at?: string
  is_active: boolean
  last_used?: string
  usage_count: number
}

class LocalStorageService {
  private getStorageKey(type: string): string {
    return `whatsapp_${type}`
  }

  private getData<T>(type: string): T[] {
    if (typeof window === 'undefined') return []
    
    try {
      const data = localStorage.getItem(this.getStorageKey(type))
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Error reading ${type} from localStorage:`, error)
      return []
    }
  }

  private setData<T>(type: string, data: T[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.getStorageKey(type), JSON.stringify(data))
    } catch (error) {
      console.error(`Error saving ${type} to localStorage:`, error)
    }
  }

  // Sessions
  getSessions(): LocalSession[] {
    return this.getData<LocalSession>('sessions')
  }

  createSession(session: Omit<LocalSession, 'id' | 'created_at'>): LocalSession {
    const sessions = this.getSessions()
    const newSession: LocalSession = {
      ...session,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    
    sessions.push(newSession)
    this.setData('sessions', sessions)
    return newSession
  }

  updateSession(id: string, updates: Partial<LocalSession>): LocalSession | null {
    const sessions = this.getSessions()
    const index = sessions.findIndex(s => s.id === id)
    
    if (index === -1) return null
    
    sessions[index] = { ...sessions[index], ...updates }
    this.setData('sessions', sessions)
    return sessions[index]
  }

  deleteSession(id: string): boolean {
    const sessions = this.getSessions()
    const filteredSessions = sessions.filter(s => s.id !== id)
    
    if (filteredSessions.length === sessions.length) return false
    
    this.setData('sessions', filteredSessions)
    
    // Also delete related contacts and messages
    this.deleteContactsBySession(id)
    this.deleteMessagesBySession(id)
    
    return true
  }

  getSessionStats(sessionId: string): { totalContacts: number; totalMessages: number } {
    const contacts = this.getContacts().filter(c => c.session_id === sessionId)
    const messages = this.getMessages().filter(m => m.session_id === sessionId)
    
    return {
      totalContacts: contacts.length,
      totalMessages: messages.length
    }
  }

  // Contacts
  getContacts(): LocalContact[] {
    return this.getData<LocalContact>('contacts')
  }

  getContactsBySession(sessionId: string): LocalContact[] {
    return this.getContacts().filter(c => c.session_id === sessionId)
  }

  createContact(contact: Omit<LocalContact, 'id' | 'created_at'>): LocalContact {
    const contacts = this.getContacts()
    const newContact: LocalContact = {
      ...contact,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    
    contacts.push(newContact)
    this.setData('contacts', contacts)
    return newContact
  }

  deleteContactsBySession(sessionId: string): void {
    const contacts = this.getContacts()
    const filteredContacts = contacts.filter(c => c.session_id !== sessionId)
    this.setData('contacts', filteredContacts)
  }

  // Messages
  getMessages(): LocalMessage[] {
    return this.getData<LocalMessage>('messages')
  }

  getMessagesBySession(sessionId: string): LocalMessage[] {
    return this.getMessages().filter(m => m.session_id === sessionId)
  }

  getMessagesByContact(sessionId: string, contactNumber: string): LocalMessage[] {
    return this.getMessages().filter(m => 
      m.session_id === sessionId && 
      (m.from_number === contactNumber || m.to_number === contactNumber)
    )
  }

  createMessage(message: Omit<LocalMessage, 'id' | 'created_at'>): LocalMessage {
    const messages = this.getMessages()
    const newMessage: LocalMessage = {
      ...message,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    
    messages.push(newMessage)
    this.setData('messages', messages)
    return newMessage
  }

  deleteMessagesBySession(sessionId: string): void {
    const messages = this.getMessages()
    const filteredMessages = messages.filter(m => m.session_id !== sessionId)
    this.setData('messages', filteredMessages)
  }

  // Users
  getUsers(): LocalUser[] {
    return this.getData<LocalUser>('users')
  }

  createUser(user: Omit<LocalUser, 'id' | 'created_at'>): LocalUser {
    const users = this.getUsers()
    const newUser: LocalUser = {
      ...user,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    
    users.push(newUser)
    this.setData('users', users)
    return newUser
  }

  updateUser(id: string, updates: Partial<LocalUser>): LocalUser | null {
    const users = this.getUsers()
    const index = users.findIndex(u => u.id === id)
    
    if (index === -1) return null
    
    users[index] = { ...users[index], ...updates }
    this.setData('users', users)
    return users[index]
  }

  deleteUser(id: string): boolean {
    const users = this.getUsers()
    const filteredUsers = users.filter(u => u.id !== id)
    
    if (filteredUsers.length === users.length) return false
    
    this.setData('users', filteredUsers)
    return true
  }

  // API Keys
  getAPIKeys(): LocalAPIKey[] {
    return this.getData<LocalAPIKey>('api_keys')
  }

  createAPIKey(apiKey: Omit<LocalAPIKey, 'id' | 'created_at' | 'usage_count'>): LocalAPIKey {
    const apiKeys = this.getAPIKeys()
    const newAPIKey: LocalAPIKey = {
      ...apiKey,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      usage_count: 0
    }
    
    apiKeys.push(newAPIKey)
    this.setData('api_keys', apiKeys)
    return newAPIKey
  }

  updateAPIKey(id: string, updates: Partial<LocalAPIKey>): LocalAPIKey | null {
    const apiKeys = this.getAPIKeys()
    const index = apiKeys.findIndex(k => k.id === id)
    
    if (index === -1) return null
    
    apiKeys[index] = { ...apiKeys[index], ...updates }
    this.setData('api_keys', apiKeys)
    return apiKeys[index]
  }

  deleteAPIKey(id: string): boolean {
    const apiKeys = this.getAPIKeys()
    const filteredAPIKeys = apiKeys.filter(k => k.id !== id)
    
    if (filteredAPIKeys.length === apiKeys.length) return false
    
    this.setData('api_keys', filteredAPIKeys)
    return true
  }

  // Utility methods
  clearAllData(): void {
    if (typeof window === 'undefined') return
    
    const keys = ['sessions', 'contacts', 'messages', 'users', 'api_keys']
    keys.forEach(key => {
      localStorage.removeItem(this.getStorageKey(key))
    })
  }

  exportData(): string {
    const data = {
      sessions: this.getSessions(),
      contacts: this.getContacts(),
      messages: this.getMessages(),
      users: this.getUsers(),
      apiKeys: this.getAPIKeys(),
      exportedAt: new Date().toISOString()
    }
    
    return JSON.stringify(data, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.sessions) this.setData('sessions', data.sessions)
      if (data.contacts) this.setData('contacts', data.contacts)
      if (data.messages) this.setData('messages', data.messages)
      if (data.users) this.setData('users', data.users)
      if (data.apiKeys) this.setData('api_keys', data.apiKeys)
      
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }
}

export const LocalStorage = new LocalStorageService()
