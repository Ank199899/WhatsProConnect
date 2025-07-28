'use client'

import MediaTestComponent from '@/components/MediaTestComponent'

export default function TestMediaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Media Features Test Page
        </h1>
        <MediaTestComponent />
      </div>
    </div>
  )
}
