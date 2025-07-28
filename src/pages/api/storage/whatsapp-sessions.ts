// 📱 API Route for WhatsApp Session Data (Server Storage)
// Replaces local file storage with PostgreSQL

import { NextApiRequest, NextApiResponse } from 'next'
import { serverStorage } from '../../../lib/server-storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req
    const { sessionId, dataType, dataKey } = req.query

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Session ID is required' })
    }

    switch (method) {
      case 'GET':
        if (dataType && dataKey) {
          // Get specific session data
          const data = await serverStorage.getWhatsAppSessionData(
            sessionId, 
            dataType as any, 
            dataKey as string
          )
          
          return res.status(200).json({ 
            sessionId, 
            dataType, 
            dataKey, 
            data 
          })
        } else {
          return res.status(400).json({ 
            error: 'dataType and dataKey are required for GET requests' 
          })
        }

      case 'POST':
        const { data_type, data_key, data_value, encrypted = false } = req.body
        
        if (!data_type || !data_key || data_value === undefined) {
          return res.status(400).json({ 
            error: 'data_type, data_key, and data_value are required' 
          })
        }

        await serverStorage.saveWhatsAppSessionData(
          sessionId,
          data_type,
          data_key,
          data_value,
          encrypted
        )
        
        return res.status(200).json({ 
          success: true, 
          message: 'WhatsApp session data saved successfully',
          sessionId,
          dataType: data_type,
          dataKey: data_key
        })

      case 'DELETE':
        // Note: We don't have a delete method in serverStorage yet
        // This would need to be implemented if needed
        return res.status(501).json({ 
          error: 'Delete operation not implemented yet' 
        })

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('❌ WhatsApp Session Storage API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
