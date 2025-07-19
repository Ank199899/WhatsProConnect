import { LocalStorage } from './local-storage'

export interface SessionStatus {
  id: string
  name: string
  phoneNumber?: string
  status: 'initializing' | 'qr_code' | 'ready' | 'disconnected' | 'auth_failure'
  qrCode?: string
  createdAt: string
  isActive: boolean
  stats?: {
    totalContacts: number
    totalMessages: number
  }
}

export interface MessageData {
  sessionId: string
  id: string
  body: string
  from: string
  to: string
  timestamp: number
  type: string
  isGroupMsg: boolean
  author?: string
  mediaUrl?: string
  filename?: string
  fileSize?: string
  mimeType?: string
}

export interface ContactData {
  id: string
  name: string
  number: string
  isGroup: boolean
  profilePicUrl?: string
}

export interface BulkMessageRequest {
  sessionId: string
  contacts: string[]
  message: string
  delay?: number
}

export interface BulkMessageProgress {
  sessionId: string
  sent: number
  failed: number
  total: number
  current?: string
  error?: string
}

export class WhatsAppManagerClient {
  private baseUrl: string
  public socket: any
  private qrCodeListeners: Array<(data: any) => void> = []
  private readyListeners: Array<(data: any) => void> = []
  private disconnectedListeners: Array<(data: any) => void> = []
  private messageListeners: Array<(data: any) => void> = []
  private authFailureListeners: Array<(data: any) => void> = []
  private connectionStatusListeners: Array<(isConnected: boolean) => void> = []

  constructor(baseUrl?: string) {
    // Auto-detect environment and set appropriate URL
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const protocol = window.location.protocol

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        this.baseUrl = baseUrl || 'http://localhost:3001'
      } else {
        this.baseUrl = baseUrl || `${protocol}//${hostname}:3001`
      }
    } else {
      this.baseUrl = baseUrl || 'http://localhost:3001'
    }

    console.log('🔧 WhatsApp Manager initialized with URL:', this.baseUrl)
  }

  // Initialize socket connection
  initializeSocket() {
    if (typeof window !== 'undefined') {
      console.log('🔌 Initializing socket connection to:', this.baseUrl)
      const io = require('socket.io-client')
      this.socket = io(this.baseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      })

      this.socket.on('connect', () => {
        console.log('✅ Connected to WhatsApp server')
      })

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from WhatsApp server')
      })

      this.socket.on('connect_error', (error: any) => {
        console.error('🔥 Socket connection error:', error)
      })

      // Setup event listeners
      this.setupEventListeners()

      return this.socket
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

    // QR Code event
    this.socket.on('qr_code', (data: { sessionId: string; qrCode: string }) => {
      console.log('QR Code received:', data)
      this.qrCodeListeners.forEach(listener => listener(data))
    })

    // Client ready event
    this.socket.on('client_ready', (data: { sessionId: string; phoneNumber: string }) => {
      console.log('🎉 Client ready received:', data)
      this.readyListeners.forEach(listener => listener(data))
    })

    // Disconnected event
    this.socket.on('disconnected', (data: { sessionId: string }) => {
      console.log('Client disconnected:', data)
      this.disconnectedListeners.forEach(listener => listener(data))
    })
  }

  // Event listener methods
  onQRCode(callback: (data: any) => void) {
    this.qrCodeListeners.push(callback)
  }

  onClientReady(callback: (data: any) => void) {
    this.readyListeners.push(callback)
  }

  onDisconnected(callback: (data: any) => void) {
    this.disconnectedListeners.push(callback)
  }

  // Session Management
  async createSession(name?: string): Promise<{ success: boolean; sessionId: string; sessionName: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Session created:', data)

      // Save to local storage
      if (data.success) {
        LocalStorage.createSession({
          name: data.sessionName,
          status: 'initializing',
          is_active: true,
          id: data.sessionId
        })

        // Setup real-time listeners for this session
        this.setupSessionListeners(data.sessionId)
      }

      return data
    } catch (error) {
      console.error('❌ Error creating session:', error)
      return {
        success: false,
        sessionId: '',
        sessionName: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private setupSessionListeners(sessionId: string) {
    if (!this.socket) {
      this.initializeSocket()
    }

    // Listen for QR code events
    this.socket?.on('qr_code', (data: { sessionId: string; qrCode: string }) => {
      if (data.sessionId === sessionId) {
        console.log('QR Code received for session:', sessionId)

        // Update local storage with QR code
        const sessions = LocalStorage.getSessions()
        const sessionIndex = sessions.findIndex(s => s.id === sessionId)
        if (sessionIndex !== -1) {
          sessions[sessionIndex].qrCode = data.qrCode
          sessions[sessionIndex].status = 'qr_code'
          LocalStorage.updateSession(sessionId, sessions[sessionIndex])
        }

        // Emit to listeners
        this.qrCodeListeners.forEach(listener => listener(data))
      }
    })

    // Listen for client ready events
    this.socket?.on('client_ready', (data: { sessionId: string; phoneNumber: string }) => {
      if (data.sessionId === sessionId) {
        console.log('Client ready for session:', sessionId)

        // Update local storage
        const sessions = LocalStorage.getSessions()
        const sessionIndex = sessions.findIndex(s => s.id === sessionId)
        if (sessionIndex !== -1) {
          sessions[sessionIndex].status = 'ready'
          sessions[sessionIndex].phone_number = data.phoneNumber
          sessions[sessionIndex].qrCode = undefined
          LocalStorage.updateSession(sessionId, sessions[sessionIndex])
        }

        // Emit to listeners
        this.readyListeners.forEach(listener => listener(data))
      }
    })

    // Listen for disconnection events
    this.socket?.on('disconnected', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        console.log('Client disconnected for session:', sessionId)

        // Update local storage
        const sessions = LocalStorage.getSessions()
        const sessionIndex = sessions.findIndex(s => s.id === sessionId)
        if (sessionIndex !== -1) {
          sessions[sessionIndex].status = 'disconnected'
          sessions[sessionIndex].is_active = false
          LocalStorage.updateSession(sessionId, sessions[sessionIndex])
        }

        // Emit to listeners
        this.disconnectedListeners.forEach(listener => listener(data))
      }
    })
  }

  async getSessions(): Promise<SessionStatus[]> {
    try {
      // Get sessions from backend server
      const response = await fetch(`${this.baseUrl}/api/sessions`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const serverSessions = await response.json()
      console.log('Server sessions:', serverSessions)

      // Get local sessions for persistence
      const localSessions = LocalStorage.getSessions()

      // Cleanup duplicate sessions in local storage
      LocalStorage.cleanupDuplicateSessions()

      // Merge server and local data
      const sessions: SessionStatus[] = serverSessions.map((session: any) => {
        const localSession = localSessions.find(ls => ls.id === session.id)
        const stats = LocalStorage.getSessionStats(session.id)

        // Update local session if it exists, create if not
        if (localSession) {
          LocalStorage.updateSession(session.id, {
            status: session.status,
            phone_number: session.phoneNumber
          })
        } else {
          LocalStorage.createSession({
            id: session.id,
            name: session.name,
            status: session.status,
            phone_number: session.phoneNumber,
            is_active: true
          })
        }

        return {
          id: session.id,
          name: session.name,
          phoneNumber: session.phoneNumber,
          status: session.status,
          qrCode: session.qrCode,
          createdAt: session.createdAt,
          isActive: true,
          stats
        }
      })

      return sessions
    } catch (error) {
      console.error('Error getting sessions:', error)
      // Return local sessions as fallback
      const localSessions = LocalStorage.getSessions()
      return localSessions.map(session => ({
        id: session.id,
        name: session.name,
        phoneNumber: session.phone_number,
        status: session.status,
        createdAt: session.created_at,
        isActive: session.is_active,
        stats: LocalStorage.getSessionStats(session.id)
      }))
    }
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Deleting session: ${sessionId}`);

      // Delete from WhatsApp server
      const serverResponse = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!serverResponse.ok) {
        const errorText = await serverResponse.text();
        throw new Error(`Server delete failed: ${serverResponse.status} - ${errorText}`);
      }

      const serverData = await serverResponse.json();
      console.log('✅ Session deleted from server:', serverData);

      // Delete from database
      const dbResponse = await fetch(`/api/database/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!dbResponse.ok) {
        console.warn('⚠️ Database delete failed, but continuing...');
      } else {
        const dbData = await dbResponse.json();
        console.log('✅ Session deleted from database:', dbData);
      }

      // Delete from local storage
      LocalStorage.deleteSession(sessionId);
      console.log('✅ Session deleted from local storage');

      return {
        success: true,
        message: 'Session deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      return { success: false, message: 'Failed to delete session' };
    }
  }

  // Message Management
  async sendMessage(sessionId: string, to: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 WhatsAppManager: Sending message to ${to} via session ${sessionId}`)

      const response = await fetch(`${this.baseUrl}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, to, message }),
      })

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`)
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`
        }
      }

      const data = await response.json()
      console.log(`📊 WhatsApp API Response:`, data)

      if (data.success) {
        console.log('✅ Message sent successfully, saving to database...')

        // Save message to database (don't let this fail the send operation)
        try {
          // TODO: Use API endpoint to save message
          console.log('📝 Message sent, should save to database via API')
        } catch (dbError) {
          console.warn('⚠️ Failed to save message to database:', dbError)
          // Don't fail the send operation for database errors
        }
      }

      return data
    } catch (error) {
      console.error('❌ WhatsAppManager: Error sending message:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send message'
      }
    }
  }

  async sendBulkMessage(request: BulkMessageRequest): Promise<{ success: boolean; message: string }> {
    try {
      // Create bulk message queue in database
      // TODO: Use API endpoint to create bulk message queue
      const queueData = { id: `queue_${Date.now()}` }

      // Send to backend server
      const response = await fetch(`${this.baseUrl}/api/messages/bulk-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: request.sessionId,
          contacts: request.contacts,
          message: request.message,
          delay: request.delay || 2000
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update queue status
        // TODO: Use API endpoint to update bulk message queue
        console.log('📝 Bulk message started, should update queue via API')
      }

      return data
    } catch (error) {
      console.error('Error sending bulk message:', error)
      return { success: false, message: 'Failed to send bulk message' }
    }
  }

  // Contact Management
  async getContacts(sessionId: string): Promise<ContactData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/contacts/${sessionId}`)
      const data = await response.json()

      if (data.success) {
        // Save contacts to database
        const contactsToSave = data.contacts.map((contact: any) => ({
          session_id: sessionId,
          whatsapp_id: contact.id,
          name: contact.name,
          phone_number: contact.number,
          is_group: contact.isGroup,
          profile_pic_url: contact.profilePicUrl
        }))

        // TODO: Use API endpoint to save contacts
        console.log('📝 Should save contacts to database via API')

        return data.contacts
      }

      return []
    } catch (error) {
      console.error('Error getting contacts:', error)
      return []
    }
  }

  async getContactsFromDB(sessionId: string): Promise<ContactData[]> {
    try {
      // TODO: Use API endpoint to get contacts
      console.log('📝 Should get contacts from database via API')
      return []
    } catch (error) {
      console.error('Error getting contacts from DB:', error)
      return []
    }
  }

  // Chat Management
  async getChats(sessionId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chats/${sessionId}`)
      const data = await response.json()

      if (data.success) {
        return data.chats
      }

      return []
    } catch (error) {
      console.error('Error getting chats:', error)
      return []
    }
  }

  async getChatMessages(sessionId: string, contactNumber: string) {
    try {
      console.log(`🔍 WhatsAppManager: Getting messages for session ${sessionId}, contact ${contactNumber}`)

      // Use API endpoint instead of direct database access (for client-side compatibility)
      const response = await fetch(`/api/database/messages?session_id=${sessionId}&contact_number=${encodeURIComponent(contactNumber)}`)
      const data = await response.json()

      if (data.success && data.messages) {
        console.log(`📊 WhatsAppManager: Found ${data.messages.length} messages from API`)
        return data.messages
      } else {
        console.log(`📭 WhatsAppManager: No messages found or API error:`, data.error)
        return []
      }
    } catch (error) {
      console.error('❌ WhatsAppManager: Error getting chat messages:', error)
      return []
    }
  }

  // Get messages for a specific chat (alias for getChatMessages)
  async getMessages(sessionId: string, contactNumber: string) {
    try {
      console.log('🔄 Getting messages for:', contactNumber)

      // Try to get from WhatsApp API first
      const response = await fetch(`${this.baseUrl}/api/messages/${sessionId}/${encodeURIComponent(contactNumber)}`)
      const data = await response.json()

      if (data.success && data.messages) {
        console.log('✅ Got messages from API:', data.messages.length)
        return data.messages
      }

      // Fallback to database via API
      const dbResponse = await fetch(`/api/database/messages?session_id=${sessionId}&contact_number=${encodeURIComponent(contactNumber)}`)
      const dbData = await dbResponse.json()

      if (dbData.success && dbData.messages) {
        console.log('✅ Got messages from database:', dbData.messages.length)
        return dbData.messages
      }

      return []
    } catch (error) {
      console.error('❌ Error getting messages:', error)
      return []
    }
  }

  // Bulk Message Management
  async getBulkMessageQueues(sessionId?: string) {
    try {
      // TODO: Use API endpoint to get bulk message queues
      console.log('📝 Should get bulk message queues from database via API')
      return []
    } catch (error) {
      console.error('Error getting bulk message queues:', error)
      return []
    }
  }

  // Event Handlers
  onQRCode(callback: (data: { sessionId: string; qrCode: string }) => void) {
    if (this.socket) {
      this.socket.on('qr_code', callback)
    }
  }

  onClientReady(callback: (data: { sessionId: string; phoneNumber: string }) => void) {
    if (this.socket) {
      this.socket.on('client_ready', async (data: any) => {
        // Update session in database
        // TODO: Use API endpoint to update session
        console.log('📝 Should update session in database via API')
        callback(data)
      })
    }
  }

  onNewMessage(callback: (message: MessageData) => void) {
    console.log('🎯 Setting up new message listener')
    if (this.socket) {
      this.socket.on('new_message', async (message: MessageData) => {
        console.log('📨 Received new message event:', message)

        try {
          // Save message to database
          // TODO: Use API endpoint to save message
          console.log('📝 Should save incoming message to database via API')
        } catch (error) {
          console.error('❌ Failed to save message to database:', error)
        }

        callback(message)
      })
    } else {
      console.warn('⚠️ Socket not available for message listener')
    }
  }

  onChatUpdated(callback: (chat: any) => void) {
    console.log('🎯 Setting up chat update listener')
    if (this.socket) {
      this.socket.on('chat_updated', (chat: any) => {
        console.log('📊 Received chat update event:', chat)
        callback(chat)
      })
    } else {
      console.warn('⚠️ Socket not available for chat update listener')
    }
  }

  onBulkMessageProgress(callback: (progress: BulkMessageProgress) => void) {
    if (this.socket) {
      this.socket.on('bulk_message_progress', callback)
    }
  }

  onBulkMessageComplete(callback: (result: { sessionId: string; sent: number; failed: number; total: number }) => void) {
    if (this.socket) {
      this.socket.on('bulk_message_complete', async (result: any) => {
        // Update bulk message queue status
        // TODO: Use API endpoint to update bulk message queue
        console.log('📝 Should update bulk message queue via API')
        
        callback(result)
      })
    }
  }

  onAuthFailure(callback: (data: { sessionId: string; message: string }) => void) {
    if (this.socket) {
      this.socket.on('auth_failure', async (data: any) => {
        // Update session status in database
        // TODO: Use API endpoint to update session
        console.log('📝 Should update session status via API')
        callback(data)
      })
    }
  }

  onClientDisconnected(callback: (data: { sessionId: string; reason: string }) => void) {
    if (this.socket) {
      this.socket.on('client_disconnected', async (data: any) => {
        // Update session status in database
        // TODO: Use API endpoint to update session
        console.log('📝 Should update session status via API')
        callback(data)
      })
    }
  }

  // Connection status listener
  onConnectionStatus(callback: (isConnected: boolean) => void) {
    this.connectionStatusListeners.push(callback)
  }

  // Typing status listener
  onTypingStatus(callback: (data: { chatId: string; isTyping: boolean }) => void) {
    if (this.socket) {
      this.socket.on('typing_status', callback)
    }
  }

  // Presence update listener
  onPresenceUpdate(callback: (data: { chatId: string; isOnline: boolean; lastSeen?: string }) => void) {
    if (this.socket) {
      this.socket.on('presence_update', callback)
    }
  }

  // Message status update listener
  onMessageStatusUpdate(callback: (data: { messageId: string; status: 'sent' | 'delivered' | 'read' }) => void) {
    if (this.socket) {
      this.socket.on('message_status_update', callback)
    }
  }

  // Notify connection status to all listeners
  private notifyConnectionStatus(isConnected: boolean) {
    this.connectionStatusListeners.forEach(listener => {
      try {
        listener(isConnected)
      } catch (error) {
        console.error('Error in connection status listener:', error)
      }
    })
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }
}
