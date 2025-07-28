import { LocalStorage } from './local-storage'
import { getBackendUrl, getWebSocketUrl } from '@/lib/config'

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
  private chatSyncListeners: Array<(data: any) => void> = []
  private clientReadyListeners: Array<(data: any) => void> = []
  private conversationUpdateListeners: Array<(data: any) => void> = []
  private contactUpdateListeners: Array<(data: any) => void> = []
  private presenceUpdateListeners: Array<(data: any) => void> = []
  private typingStatusListeners: Array<(data: any) => void> = []
  private cachedMessages: any[] = []

  constructor(baseUrl?: string) {
    // Use centralized configuration
    this.baseUrl = baseUrl || getBackendUrl()

    console.log('🔧 WhatsApp Manager initialized with FIXED URL:', this.baseUrl)
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      WHATSAPP_BACKEND_URL: process.env.WHATSAPP_BACKEND_URL,
      isClient: typeof window !== 'undefined'
    })
  }

  // Initialize socket connection
  initializeSocket() {
    if (typeof window !== 'undefined' && !this.socket) {
      console.log('🔌 Initializing socket connection to:', this.baseUrl)
      const io = require('socket.io-client')
      this.socket = io(this.baseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        autoConnect: true
      })

      this.socket.on('connect', () => {
        console.log('✅ Connected to WhatsApp server')
        console.log('🔌 Socket ID:', this.socket.id)
      })

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from WhatsApp server')
      })

      this.socket.on('connect_error', (error: any) => {
        console.error('🔥 Socket connection error:', error)
      })

      // Force connection
      if (!this.socket.connected) {
        console.log('🔄 Forcing socket connection...')
        this.socket.connect()
      }

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

    // New message event
    this.socket.on('new_message', (data: any) => {
      console.log('📨 New message received:', data)
      this.messageListeners.forEach(listener => listener(data))
    })

    // Messages updated event
    this.socket.on('messages_updated', (data: any[]) => {
      console.log('📨 Messages updated:', data.length, 'messages')
      // Store messages for later retrieval
      this.cachedMessages = data
    })

    // Chat sync completion event
    this.socket.on('chats_synced', (data: any) => {
      console.log('🔄 Chats synced:', data)
      // Clear cache to force reload
      this.cachedMessages = []
      this.chatSyncListeners.forEach(listener => listener(data))
    })

    // Client ready event
    this.socket.on('client_ready', (data: any) => {
      console.log('✅ WhatsApp client ready:', data)
      this.clientReadyListeners.forEach(listener => listener(data))
    })

    // Test message event
    this.socket.on('test_message', (data: any) => {
      console.log('🧪 Test message received:', data)
      this.messageListeners.forEach(listener => listener(data))
    })

    // Conversations updated event
    this.socket.on('conversations_updated', (data: any) => {
      console.log('💬 Conversations updated:', data)
      this.conversationUpdateListeners.forEach(listener => listener(data))
    })

    // Contacts updated event
    this.socket.on('contacts_updated', (data: any) => {
      console.log('👤 Contacts updated:', data)
      this.contactUpdateListeners.forEach(listener => listener(data))
    })

    // Real-time presence updates
    this.socket.on('presence_update', (data: any) => {
      console.log('👤 Presence update received:', data)
      this.presenceUpdateListeners.forEach(listener => listener(data))
    })

    // Real-time typing status
    this.socket.on('typing_status', (data: any) => {
      console.log('⌨️ Typing status received:', data)
      this.typingStatusListeners.forEach(listener => listener(data))
    })

    // Message status updates (sent, delivered, read)
    this.socket.on('message_status_update', (data: any) => {
      console.log('✅ Message status update:', data)
      // Trigger message listeners to update status
      this.messageListeners.forEach(listener => listener({
        type: 'status_update',
        ...data
      }))
    })

    // Message acknowledgment (sent confirmation)
    this.socket.on('message_ack', (data: any) => {
      console.log('📤 Message acknowledgment:', data)
      this.messageListeners.forEach(listener => listener({
        type: 'message_ack',
        ...data
      }))
    })

    // Message delivery confirmation
    this.socket.on('message_delivered', (data: any) => {
      console.log('📬 Message delivered:', data)
      this.messageListeners.forEach(listener => listener({
        type: 'message_delivered',
        ...data
      }))
    })

    // Message read confirmation
    this.socket.on('message_read', (data: any) => {
      console.log('👁️ Message read:', data)
      this.messageListeners.forEach(listener => listener({
        type: 'message_read',
        ...data
      }))
    })

    // Contact profile updated event
    this.socket.on('contact_profile_updated', (data: any) => {
      console.log('👤 Contact profile updated:', data)
      this.contactUpdateListeners.forEach(listener => listener(data))
    })

    // Presence update event
    this.socket.on('presence_update', (data: any) => {
      console.log('👁️ Presence update:', data)
      this.presenceUpdateListeners.forEach(listener => listener(data))
    })

    // Typing status event
    this.socket.on('typing_status', (data: any) => {
      console.log('⌨️ Typing status:', data)
      this.typingStatusListeners.forEach(listener => listener(data))
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
      const response = await fetch('/api/whatsapp/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionName: name }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Setup real-time listeners for this session
      if (data.success) {
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
        // Emit to listeners
        this.qrCodeListeners.forEach(listener => listener(data))
      }
    })

    // Listen for client ready events
    this.socket?.on('client_ready', (data: { sessionId: string; phoneNumber: string }) => {
      if (data.sessionId === sessionId) {
        // Emit to listeners
        this.readyListeners.forEach(listener => listener(data))
      }
    })

    // Listen for disconnection events
    this.socket?.on('disconnected', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        // Emit to listeners
        this.disconnectedListeners.forEach(listener => listener(data))
      }
    })
  }

  async getSessions(): Promise<SessionStatus[]> {
    try {
      // Get sessions from frontend API which fetches from backend
      const response = await fetch('/api/whatsapp/sessions')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const serverSessions = result.sessions || []

      // Map server sessions to our format
      const sessions: SessionStatus[] = serverSessions.map((session: any) => ({
        id: session.id,
        name: session.name,
        phoneNumber: session.phoneNumber,
        status: session.status,
        qrCode: session.qrCode,
        createdAt: session.createdAt || session.updatedAt,
        isActive: session.status === 'ready' || session.status === 'connected',
        stats: {
          totalMessages: 0,
          totalContacts: 0,
          lastActivity: session.updatedAt
        }
      }))

      return sessions
    } catch (error) {
      console.error('❌ Error getting sessions:', error)
      return []
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
        message: (error && typeof error === 'object' && 'message' in error) ? (error as Error).message : 'Failed to send message'
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
      console.log(`📱 WhatsAppManager: Getting chats for session ${sessionId}`)
      console.log(`🔗 WhatsAppManager: Using URL: ${this.baseUrl}/api/sessions/${sessionId}/chats`)
      const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/chats`)

      console.log(`📡 WhatsAppManager: Response status: ${response.status}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ WhatsAppManager: Received chats response:`, data)

      if (data.success) {
        console.log(`📊 WhatsAppManager: Returning ${data.chats?.length || 0} chats`)
        return data.chats || []
      }

      console.warn('❌ WhatsAppManager: Failed to get chats:', data.error)
      return []
    } catch (error) {
      console.error('❌ WhatsAppManager: Error getting chats:', error)
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

  // Get all messages from database
  async getAllMessages() {
    try {
      console.log('🔍 WhatsAppManager: Getting all messages from database')

      // First try to get from cached messages
      if (this.cachedMessages.length > 0) {
        console.log(`📊 WhatsAppManager: Returning ${this.cachedMessages.length} cached messages`)
        return this.cachedMessages
      }

      // Request messages from server via socket
      if (this.socket) {
        this.socket.emit('get_messages')

        // Wait a bit for the response
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (this.cachedMessages.length > 0) {
          return this.cachedMessages
        }
      }

      // Fallback to API endpoint
      const response = await fetch(`${this.baseUrl}/api/database/messages`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`📊 WhatsAppManager: API Response:`, data)

      if (Array.isArray(data)) {
        console.log(`📊 WhatsAppManager: Found ${data.length} messages from API`)
        this.cachedMessages = data
        return data
      }

      console.log('📊 WhatsAppManager: No messages found or invalid response')
      return []
    } catch (error) {
      console.error('Error getting all messages:', error)
      return []
    }
  }

  // Get messages for a specific chat (alias for getChatMessages)
  async getMessages(sessionId: string, contactNumber: string) {
    try {
      console.log('🔄 Getting messages for:', { sessionId, contactNumber })

      // First try to get from database via Next.js API
      const dbApiUrl = `/api/sessions/${sessionId}/messages/${encodeURIComponent(contactNumber)}`
      console.log('🔗 Database API URL:', dbApiUrl)

      try {
        const dbResponse = await fetch(dbApiUrl)
        console.log('📡 Database API Response status:', dbResponse.status, dbResponse.statusText)

        if (dbResponse.ok) {
          const dbData = await dbResponse.json()
          console.log('📊 Database API Response:', dbData)

          if (dbData.success && dbData.messages && dbData.messages.length > 0) {
            console.log('✅ Got messages from database:', dbData.messages.length)
            console.log('📨 Sample database messages:', dbData.messages.slice(0, 2))
            return dbData.messages
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Database API failed, trying WhatsApp server:', dbError)
      }

      // Fallback: Get messages directly from WhatsApp server
      const whatsappApiUrl = `${this.baseUrl}/api/sessions/${sessionId}/messages/${encodeURIComponent(contactNumber)}`
      console.log('🔗 WhatsApp Server API URL:', whatsappApiUrl)

      const whatsappResponse = await fetch(whatsappApiUrl)
      console.log('📡 WhatsApp Server Response status:', whatsappResponse.status, whatsappResponse.statusText)

      if (!whatsappResponse.ok) {
        console.error('❌ WhatsApp Server HTTP Error:', whatsappResponse.status, whatsappResponse.statusText)
        return []
      }

      const whatsappData = await whatsappResponse.json()
      console.log('📊 WhatsApp Server API Response:', whatsappData)

      if (whatsappData.success && whatsappData.messages) {
        console.log('✅ Got messages from WhatsApp server:', whatsappData.messages.length)
        console.log('📨 Sample WhatsApp messages:', whatsappData.messages.slice(0, 2))
        return whatsappData.messages
      }

      console.log('⚠️ No messages found from any source')
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

  // Real-time presence updates
  onPresenceUpdate(callback: (data: { chatId: string; isOnline: boolean; lastSeen?: number }) => void) {
    console.log('🎯 Setting up presence update listener')
    if (this.socket) {
      this.socket.on('presence_update', (data: any) => {
        console.log('👤 Received presence update:', data)
        callback(data)
      })
    } else {
      console.warn('⚠️ Socket not available for presence listener')
    }
  }

  // Real-time typing status
  onTypingStatus(callback: (data: { chatId: string; isTyping: boolean }) => void) {
    console.log('🎯 Setting up typing status listener')
    if (this.socket) {
      this.socket.on('typing_status', (data: any) => {
        console.log('⌨️ Received typing status:', data)
        callback(data)
      })
    } else {
      console.warn('⚠️ Socket not available for typing listener')
    }
  }

  // Message status updates
  onMessageStatusUpdate(callback: (data: { messageId: string; status: 'sent' | 'delivered' | 'read'; timestamp: number }) => void) {
    console.log('🎯 Setting up message status listener')
    if (this.socket) {
      this.socket.on('message_status_update', (data: any) => {
        console.log('✅ Received message status update:', data)
        callback(data)
      })

      this.socket.on('message_ack', (data: any) => {
        console.log('📤 Message acknowledged:', data)
        callback({ ...data, status: 'sent' })
      })

      this.socket.on('message_delivered', (data: any) => {
        console.log('📬 Message delivered:', data)
        callback({ ...data, status: 'delivered' })
      })

      this.socket.on('message_read', (data: any) => {
        console.log('👁️ Message read:', data)
        callback({ ...data, status: 'read' })
      })
    } else {
      console.warn('⚠️ Socket not available for message status listener')
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

  // Message listener
  onMessage(callback: (data: any) => void) {
    this.messageListeners.push(callback)
    if (this.socket) {
      this.socket.on('new_message', callback)
      this.socket.on('test_message', callback)
    }
  }

  // Remove message listener
  offMessage(callback: (data: any) => void) {
    const index = this.messageListeners.indexOf(callback)
    if (index > -1) {
      this.messageListeners.splice(index, 1)
    }
  }

  // Conversation update listener
  onConversationUpdate(callback: (data: any) => void) {
    this.conversationUpdateListeners.push(callback)
    if (this.socket) {
      this.socket.on('conversations_updated', callback)
    }
  }

  // Contact update listener
  onContactUpdate(callback: (data: any) => void) {
    this.contactUpdateListeners.push(callback)
    if (this.socket) {
      this.socket.on('contacts_updated', callback)
    }
  }

  // Request real-time data
  requestConversations(sessionId: string) {
    if (this.socket) {
      console.log(`📡 Requesting conversations for session: ${sessionId}`)
      this.socket.emit('get_conversations', { sessionId })
    }
  }

  requestContacts(sessionId: string) {
    if (this.socket) {
      console.log(`📡 Requesting contacts for session: ${sessionId}`)
      this.socket.emit('get_contacts', { sessionId })
    }
  }

  // Presence update listener
  onPresenceUpdate(callback: (data: any) => void) {
    this.presenceUpdateListeners.push(callback)
    if (this.socket) {
      this.socket.on('presence_update', callback)
    }
  }

  // Typing status listener
  onTypingStatus(callback: (data: any) => void) {
    this.typingStatusListeners.push(callback)
    if (this.socket) {
      this.socket.on('typing_status', callback)
    }
  }

  // Message status update listener
  onMessageStatusUpdate(callback: (data: { messageId: string; status: 'sent' | 'delivered' | 'read' }) => void) {
    if (this.socket) {
      this.socket.on('message_status_update', callback)
    }
  }

  // Chat sync listener
  onChatSync(callback: (data: any) => void) {
    this.chatSyncListeners.push(callback)
    if (this.socket) {
      this.socket.on('chats_synced', callback)
    }
  }

  // Client ready listener
  onClientReady(callback: (data: any) => void) {
    this.clientReadyListeners.push(callback)
    if (this.socket) {
      this.socket.on('client_ready', callback)
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
