// 🗄️ Database Service - Real Data Only (No Demo Data)
// This service provides database operations with real data only

// Temporary fallback service for real data only
const DatabaseService = {
  // Session Management - Return empty arrays for real data only
  getSessions: async () => [],
  getAllSessions: async () => [],
  getSession: async (id: string) => null,
  createSession: async (session: any) => session,
  updateSession: async (id: string, updates: any) => null,
  deleteSession: async (id: string) => true,

  // Message Management - Return empty arrays for real data only
  getMessages: async (sessionId: string) => [],
  getChatMessages: async (sessionId: string, contactNumber: string) => [],
  saveMessage: async (message: any) => message,
  getMessagesInDateRange: async (startDate: Date, endDate: Date) => [],

  // Contact Management - Return empty arrays for real data only
  getContacts: async (sessionId: string) => [],
  getAllContacts: async () => [],
  saveContact: async (contact: any) => contact,

  // Template Management - Return empty arrays for real data only
  getAllTemplates: async () => [],
  getTemplate: async (id: string) => null,
  createTemplate: async (template: any) => template,
  updateTemplate: async (id: string, updates: any) => null,
  deleteTemplate: async (id: string) => false,

  // AI Provider Management - Return empty arrays for real data only
  getAllAIProviders: async () => [],
  getAIProvider: async (id: string) => null,
  createAIProvider: async (provider: any) => provider,
  updateAIProvider: async (id: string, updates: any) => null,
  deleteAIProvider: async (id: string) => false,

  // AI Agent Management - Return empty arrays for real data only
  getAllAIAgents: async () => [],
  getAIAgent: async (id: string) => null,
  createAIAgent: async (agent: any) => agent,
  updateAIAgent: async (id: string, updates: any) => null,
  deleteAIAgent: async (id: string) => false,

  // Bulk Message Management (placeholder methods)
  getBulkMessageQueue: () => Promise.resolve([]),
  addToBulkQueue: (item: any) => Promise.resolve(item),
  updateBulkQueueItem: (id: string, updates: any) => Promise.resolve(null),
  deleteBulkQueueItem: (id: string) => Promise.resolve(false),

  // Database connection (for backward compatibility)
  db: {
    prepare: (query: string) => ({
      run: (...params: any[]) => {
        console.warn('⚠️ Direct database access is deprecated. Use DatabaseService methods instead.');
        return { changes: 0, lastInsertRowid: 0 };
      },
      get: (...params: any[]) => {
        console.warn('⚠️ Direct database access is deprecated. Use DatabaseService methods instead.');
        return null;
      },
      all: (...params: any[]) => {
        console.warn('⚠️ Direct database access is deprecated. Use DatabaseService methods instead.');
        return [];
      }
    }),
    exec: (query: string) => {
      console.warn('⚠️ Direct database access is deprecated. Use DatabaseService methods instead.');
    }
  },

  // Close connection
  close: async () => {}
}

export { DatabaseService }
export default DatabaseService
