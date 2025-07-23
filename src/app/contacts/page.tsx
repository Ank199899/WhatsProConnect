import ContactsManagement from '@/components/ContactsManagement'
import { Users } from 'lucide-react'

function ContactsPageComponent() {
  return <ContactsManagement />
}

// Error boundary wrapper
export default function ContactsPage() {
  try {
    return <ContactsPageComponent />
  } catch (error) {
    console.error('Contacts page error:', error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Users className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Contacts Unavailable</h2>
          <p className="text-gray-600">There was an issue loading the contacts page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}
