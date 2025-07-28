// 🔄 Storage Replacement Service
// Replaces localStorage/sessionStorage with server-side PostgreSQL storage via API

// API-based storage to avoid client-side PostgreSQL imports
async function apiCall(endpoint: string, method: string = 'GET', data?: any) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(endpoint, options)

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('❌ API call error:', error)
    throw error
  }
}

// Current user context (should be set after login)
let currentUserId: string | null = null

export const setCurrentUser = (userId: string) => {
  currentUserId = userId
  console.log(`👤 Current user set for storage: ${userId}`)
}

export const getCurrentUser = (): string | null => {
  return currentUserId
}

// ==================== localStorage Replacement ====================

export const LocalStorageReplacement = {
  // Get item from server storage via API
  async getItem(key: string): Promise<string | null> {
    if (!currentUserId) {
      console.warn('⚠️ No current user set for storage operation')
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key)
      }
      return null
    }

    try {
      const response = await apiCall(`/api/storage/preferences?userId=${currentUserId}&key=${key}`)
      return response.value ? String(response.value) : null
    } catch (error) {
      console.error('❌ Error getting item from server storage:', error)
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key)
      }
      return null
    }
  },

  // Set item in server storage via API
  async setItem(key: string, value: string): Promise<void> {
    if (!currentUserId) {
      console.warn('⚠️ No current user set for storage operation')
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value)
      }
      return
    }

    try {
      await apiCall(`/api/storage/preferences?userId=${currentUserId}`, 'POST', {
        preference_key: key,
        preference_value: value,
        preference_type: 'string'
      })
      console.log(`💾 Item saved to server storage: ${key}`)
    } catch (error) {
      console.error('❌ Error setting item in server storage:', error)
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value)
      }
    }
  },

  // Remove item from server storage
  async removeItem(key: string): Promise<void> {
    if (!currentUserId) {
      console.warn('⚠️ No current user set for storage operation')
      return
    }
    
    try {
      await serverStorage.removeUserPreference(currentUserId, key)
      console.log(`🗑️ Item removed from server storage: ${key}`)
    } catch (error) {
      console.error('❌ Error removing item from server storage:', error)
    }
  },

  // Clear all user preferences
  async clear(): Promise<void> {
    if (!currentUserId) {
      console.warn('⚠️ No current user set for storage operation')
      return
    }
    
    try {
      const preferences = await serverStorage.getAllUserPreferences(currentUserId)
      for (const key of Object.keys(preferences)) {
        await serverStorage.removeUserPreference(currentUserId, key)
      }
      console.log(`🧹 All items cleared from server storage for user: ${currentUserId}`)
    } catch (error) {
      console.error('❌ Error clearing server storage:', error)
    }
  },

  // Get all keys
  async getAllKeys(): Promise<string[]> {
    if (!currentUserId) {
      console.warn('⚠️ No current user set for storage operation')
      return []
    }
    
    try {
      const preferences = await serverStorage.getAllUserPreferences(currentUserId)
      return Object.keys(preferences)
    } catch (error) {
      console.error('❌ Error getting keys from server storage:', error)
      return []
    }
  },

  // Get length
  async length(): Promise<number> {
    const keys = await this.getAllKeys()
    return keys.length
  }
}

// ==================== sessionStorage Replacement ====================

export const SessionStorageReplacement = {
  // For session storage, we'll use a shorter expiry time
  async getItem(key: string): Promise<string | null> {
    return LocalStorageReplacement.getItem(`session_${key}`)
  },

  async setItem(key: string, value: string): Promise<void> {
    return LocalStorageReplacement.setItem(`session_${key}`, value)
  },

  async removeItem(key: string): Promise<void> {
    return LocalStorageReplacement.removeItem(`session_${key}`)
  },

  async clear(): Promise<void> {
    if (!currentUserId) return
    
    try {
      const preferences = await serverStorage.getAllUserPreferences(currentUserId)
      for (const key of Object.keys(preferences)) {
        if (key.startsWith('session_')) {
          await serverStorage.removeUserPreference(currentUserId, key)
        }
      }
      console.log(`🧹 Session storage cleared for user: ${currentUserId}`)
    } catch (error) {
      console.error('❌ Error clearing session storage:', error)
    }
  }
}

// ==================== Theme Storage Replacement ====================

export const ThemeStorageService = {
  async getThemeMode(): Promise<string | null> {
    return LocalStorageReplacement.getItem('theme-mode')
  },

  async setThemeMode(mode: string): Promise<void> {
    return LocalStorageReplacement.setItem('theme-mode', mode)
  },

  async getColorScheme(): Promise<string | null> {
    return LocalStorageReplacement.getItem('color-scheme')
  },

  async setColorScheme(scheme: string): Promise<void> {
    return LocalStorageReplacement.setItem('color-scheme', scheme)
  },

  async getUIDesign(): Promise<string | null> {
    return LocalStorageReplacement.getItem('ui-design')
  },

  async setUIDesign(design: string): Promise<void> {
    return LocalStorageReplacement.setItem('ui-design', design)
  },

  async getAllThemeSettings(): Promise<{
    mode?: string
    colorScheme?: string
    uiDesign?: string
  }> {
    const [mode, colorScheme, uiDesign] = await Promise.all([
      this.getThemeMode(),
      this.getColorScheme(),
      this.getUIDesign()
    ])

    return {
      mode: mode || undefined,
      colorScheme: colorScheme || undefined,
      uiDesign: uiDesign || undefined
    }
  }
}

// ==================== Auth Storage Replacement ====================

export const AuthStorageService = {
  async getAuthToken(): Promise<string | null> {
    return LocalStorageReplacement.getItem('auth_token')
  },

  async setAuthToken(token: string): Promise<void> {
    return LocalStorageReplacement.setItem('auth_token', token)
  },

  async getUserData(): Promise<any> {
    const userData = await LocalStorageReplacement.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  },

  async setUserData(userData: any): Promise<void> {
    return LocalStorageReplacement.setItem('user_data', JSON.stringify(userData))
  },

  async getSessionInfo(): Promise<any> {
    const sessionInfo = await LocalStorageReplacement.getItem('session_info')
    return sessionInfo ? JSON.parse(sessionInfo) : null
  },

  async setSessionInfo(sessionInfo: any): Promise<void> {
    return LocalStorageReplacement.setItem('session_info', JSON.stringify(sessionInfo))
  },

  async clearAuth(): Promise<void> {
    await Promise.all([
      LocalStorageReplacement.removeItem('auth_token'),
      LocalStorageReplacement.removeItem('user_data'),
      LocalStorageReplacement.removeItem('session_info')
    ])
    console.log('🔐 Auth data cleared from server storage')
  }
}

// ==================== WhatsApp Session Storage Replacement ====================

export const WhatsAppStorageService = {
  async saveSessionData(sessionId: string, dataType: string, key: string, value: any): Promise<void> {
    try {
      await serverStorage.saveWhatsAppSessionData(
        sessionId, 
        dataType as any, 
        key, 
        value, 
        false
      )
    } catch (error) {
      console.error('❌ Error saving WhatsApp session data:', error)
    }
  },

  async getSessionData(sessionId: string, dataType: string, key: string): Promise<any> {
    try {
      return await serverStorage.getWhatsAppSessionData(sessionId, dataType as any, key)
    } catch (error) {
      console.error('❌ Error getting WhatsApp session data:', error)
      return null
    }
  },

  async saveAuthData(sessionId: string, authData: any): Promise<void> {
    return this.saveSessionData(sessionId, 'auth', 'whatsapp_auth', authData)
  },

  async getAuthData(sessionId: string): Promise<any> {
    return this.getSessionData(sessionId, 'auth', 'whatsapp_auth')
  },

  async saveCookies(sessionId: string, cookies: any): Promise<void> {
    return this.saveSessionData(sessionId, 'cookies', 'browser_cookies', cookies)
  },

  async getCookies(sessionId: string): Promise<any> {
    return this.getSessionData(sessionId, 'cookies', 'browser_cookies')
  }
}

// ==================== Utility Functions ====================

export const StorageUtils = {
  // Migrate existing localStorage to server storage
  async migrateLocalStorageToServer(userId: string): Promise<void> {
    if (typeof window === 'undefined') return
    
    console.log('🔄 Migrating localStorage to server storage...')
    setCurrentUser(userId)
    
    const itemsToMigrate = [
      'theme-mode',
      'color-scheme', 
      'ui-design',
      'auth_token',
      'user_data',
      'session_info',
      'whatsapp-ai-agents',
      'whatsapp-ai-providers',
      'whatsapp-agent-sessions',
      'whatsapp-chat-sessions'
    ]
    
    for (const key of itemsToMigrate) {
      const value = localStorage.getItem(key)
      if (value) {
        await LocalStorageReplacement.setItem(key, value)
        console.log(`✅ Migrated: ${key}`)
      }
    }
    
    console.log('✅ localStorage migration completed')
  },

  // Clear all localStorage (for cleanup)
  clearBrowserStorage(): void {
    if (typeof window === 'undefined') return
    
    localStorage.clear()
    sessionStorage.clear()
    console.log('🧹 Browser storage cleared')
  }
}

export default {
  LocalStorageReplacement,
  SessionStorageReplacement,
  ThemeStorageService,
  AuthStorageService,
  WhatsAppStorageService,
  StorageUtils,
  setCurrentUser,
  getCurrentUser
}
