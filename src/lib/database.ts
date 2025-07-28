// 🗄️ Database Service - CLOUD DATABASE SERVER ONLY
// This service redirects all operations to the cloud database server
// NO LOCAL STORAGE OR IN-MEMORY DATA

import { ServerDatabaseService } from './database-server'

// Create database service instance
const dbService = new ServerDatabaseService()

// Cloud Database Service - ALL OPERATIONS GO TO SERVER DATABASE
const DatabaseService = {
  // Session Management - ALL FROM DATABASE SERVER
  getSessions: async () => await dbService.getAllSessions(),
  getAllSessions: async () => await dbService.getAllSessions(),
  getSession: async (id: string) => await dbService.getSession(id),
  createSession: async (session: any) => await dbService.createSession(session),
  updateSession: async (id: string, updates: any) => await dbService.updateSession(id, updates),
  deleteSession: async (id: string) => await dbService.deleteSession(id),

  // Message Management - ALL FROM DATABASE SERVER
  getMessages: async (sessionId: string) => await dbService.getMessages(sessionId),
  getChatMessages: async (sessionId: string, contactNumber: string) => await dbService.getChatMessages(sessionId, contactNumber),
  saveMessage: async (message: any) => await dbService.saveMessage(message),
  getMessagesInDateRange: async (startDate: Date, endDate: Date) => await dbService.getMessagesInDateRange(startDate, endDate),

  // Contact Management - ALL FROM DATABASE SERVER
  getContacts: async (sessionId: string) => await dbService.getContacts(sessionId),
  getAllContacts: async () => await dbService.getAllContacts(),
  saveContact: async (contact: any) => await dbService.saveContact(contact),
  createContact: async (contact: any) => await dbService.saveContact(contact),
  updateContact: async (id: string, updates: any) => await dbService.saveContact({ id, ...updates }),
  deleteContact: async (id: string) => await dbService.deleteContact(id),

  // Template Management - ALL FROM DATABASE SERVER
  getAllTemplates: async () => await dbService.getAllTemplates(),
  getTemplate: async (id: string) => {
    const templates = await dbService.getAllTemplates()
    return templates.find((t: any) => t.id === id) || null
  },
  createTemplate: async (template: any) => await dbService.saveTemplate(template),
  updateTemplate: async (id: string, updates: any) => await dbService.saveTemplate({ id, ...updates }),
  deleteTemplate: async (id: string) => await dbService.deleteTemplate(id),
  clearAllTemplates: async () => {
    const templates = await dbService.getAllTemplates()
    for (const template of templates) {
      await dbService.deleteTemplate(template.id)
    }
    return true
  },

  // Group Management - ALL FROM DATABASE SERVER
  getAllGroups: async () => await dbService.getAllGroups(),
  saveGroup: async (group: any) => await dbService.saveGroup(group),
  deleteGroup: async (id: string) => await dbService.deleteGroup(id),

  // Template Groups Management - ALL FROM DATABASE SERVER
  getAllTemplateGroups: async () => await dbService.getAllGroups(),
  getTemplateGroup: async (id: string) => {
    const groups = await dbService.getAllGroups()
    return groups.find((g: any) => g.id === id) || null
  },
  createTemplateGroup: async (group: any) => await dbService.saveGroup(group),
  updateTemplateGroup: async (id: string, updates: any) => await dbService.saveGroup({ id, ...updates }),
  deleteTemplateGroup: async (id: string) => await dbService.deleteGroup(id),

  // AI Provider Management - ALL FROM DATABASE SERVER (placeholder)
  getAllAIProviders: async () => [],
  getAIProvider: async (id: string) => null,
  createAIProvider: async (provider: any) => provider,
  updateAIProvider: async (id: string, updates: any) => null,
  deleteAIProvider: async (id: string) => false,

  // AI Agent Management - ALL FROM DATABASE SERVER (placeholder)
  getAllAIAgents: async () => [],
  getAIAgent: async (id: string) => null,
  createAIAgent: async (agent: any) => agent,
  updateAIAgent: async (id: string, updates: any) => null,
  deleteAIAgent: async (id: string) => false,

  // Bulk Message Management - ALL FROM DATABASE SERVER (placeholder)
  getBulkMessageQueue: () => Promise.resolve([]),
  addToBulkQueue: (item: any) => Promise.resolve(item),
  updateBulkQueueItem: (id: string, updates: any) => Promise.resolve(null),
  deleteBulkQueueItem: (id: string) => Promise.resolve(false),

  // Close connection
  close: async () => await dbService.close()
}

export default DatabaseService
