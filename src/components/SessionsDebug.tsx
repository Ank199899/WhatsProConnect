'use client'

import React from 'react'
import { useSharedSessions } from '@/hooks/useSharedSessions'

const SessionsDebug = () => {
  const { sessions, loading } = useSharedSessions()

  console.log('🐛 SessionsDebug: Sessions:', sessions)
  console.log('🐛 SessionsDebug: Loading:', loading)

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-bold text-yellow-800 mb-2">Sessions Debug</h3>
      <p className="text-sm text-yellow-700">Loading: {loading ? 'Yes' : 'No'}</p>
      <p className="text-sm text-yellow-700">Sessions Count: {sessions.length}</p>
      <div className="mt-2 space-y-1">
        {sessions.map(session => (
          <div key={session.id} className="text-xs text-yellow-600 bg-yellow-100 p-1 rounded">
            {session.name} - {session.status} - {session.phone}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SessionsDebug
