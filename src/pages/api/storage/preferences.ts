// 🗄️ API Route for User Preferences (Server Storage)
// Replaces localStorage with PostgreSQL storage

import { NextApiRequest, NextApiResponse } from 'next'
import { serverStorage } from '../../../lib/server-storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req
    const { userId, key } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    switch (method) {
      case 'GET':
        if (key && typeof key === 'string') {
          // Get specific preference
          const value = await serverStorage.getUserPreference(userId, key)
          return res.status(200).json({ key, value })
        } else {
          // Get all preferences
          const preferences = await serverStorage.getAllUserPreferences(userId)
          return res.status(200).json({ preferences })
        }

      case 'POST':
        const { preference_key, preference_value, preference_type } = req.body
        
        if (!preference_key || preference_value === undefined) {
          return res.status(400).json({ error: 'Key and value are required' })
        }

        await serverStorage.setUserPreference(
          userId, 
          preference_key, 
          preference_value, 
          preference_type
        )
        
        return res.status(200).json({ 
          success: true, 
          message: 'Preference saved successfully' 
        })

      case 'DELETE':
        if (!key || typeof key !== 'string') {
          return res.status(400).json({ error: 'Key is required for deletion' })
        }

        const deleted = await serverStorage.removeUserPreference(userId, key)
        
        if (deleted) {
          return res.status(200).json({ 
            success: true, 
            message: 'Preference deleted successfully' 
          })
        } else {
          return res.status(404).json({ error: 'Preference not found' })
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('❌ Storage API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
