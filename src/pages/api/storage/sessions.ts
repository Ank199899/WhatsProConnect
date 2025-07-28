// 🔐 API Route for User Sessions (Server Storage)
// Replaces browser session management with PostgreSQL

import { NextApiRequest, NextApiResponse } from 'next'
import { serverStorage } from '../../../lib/server-storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req

    switch (method) {
      case 'POST':
        // Create new session
        const { userId, ipAddress, userAgent } = req.body
        
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' })
        }

        const session = await serverStorage.createUserSession(
          userId, 
          ipAddress, 
          userAgent
        )
        
        return res.status(201).json({ 
          success: true, 
          session: {
            id: session.id,
            sessionToken: session.session_token,
            expiresAt: session.expires_at
          }
        })

      case 'GET':
        // Validate session
        const { sessionToken } = req.query
        
        if (!sessionToken || typeof sessionToken !== 'string') {
          return res.status(400).json({ error: 'Session token is required' })
        }

        const validSession = await serverStorage.validateUserSession(sessionToken)
        
        if (validSession) {
          return res.status(200).json({ 
            valid: true, 
            session: {
              id: validSession.id,
              userId: validSession.user_id,
              expiresAt: validSession.expires_at,
              isActive: validSession.is_active
            }
          })
        } else {
          return res.status(401).json({ 
            valid: false, 
            message: 'Invalid or expired session' 
          })
        }

      case 'DELETE':
        // Invalidate session
        const { sessionToken: tokenToInvalidate } = req.body
        
        if (!tokenToInvalidate) {
          return res.status(400).json({ error: 'Session token is required' })
        }

        const invalidated = await serverStorage.invalidateUserSession(tokenToInvalidate)
        
        if (invalidated) {
          return res.status(200).json({ 
            success: true, 
            message: 'Session invalidated successfully' 
          })
        } else {
          return res.status(404).json({ error: 'Session not found' })
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('❌ Session API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
