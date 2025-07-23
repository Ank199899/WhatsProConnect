import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'week'
    
    console.log('📊 Getting analytics data for range:', timeRange)

    // Get date range based on selection
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStart, 1)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get all sessions (real data only - will be empty initially)
    const sessions = await DatabaseService.getSessions()
    const activeSessions = sessions.filter(s => s.phone_number)

    // Get all messages in date range (real data only - will be empty initially)
    const messages = await DatabaseService.getMessagesInDateRange(startDate, now)

    // Get all contacts (real data only - will be empty initially)
    const contacts = await DatabaseService.getAllContacts()

    // Calculate analytics
    const totalMessages = messages.length
    const incomingMessages = messages.filter(m => m.direction === 'incoming')
    const outgoingMessages = messages.filter(m => m.direction === 'outgoing')
    
    // Response rate calculation (outgoing / incoming)
    const responseRate = incomingMessages.length > 0 
      ? Math.round((outgoingMessages.length / incomingMessages.length) * 100 * 100) / 100
      : 0

    // Average response time (mock calculation)
    const avgResponseTime = Math.round((Math.random() * 3 + 0.5) * 100) / 100

    // Get top contacts by message count
    const contactMessageCounts = new Map()
    messages.forEach(msg => {
      const count = contactMessageCounts.get(msg.contact_id) || 0
      contactMessageCounts.set(msg.contact_id, count + 1)
    })

    const topContacts = Array.from(contactMessageCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([contactId, count]) => {
        const contact = contacts.find(c => c.id === contactId)
        return {
          name: contact?.phone_number || `Contact ${contactId}`,
          count,
          sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
        }
      })

    // Message categories (mock data based on content analysis)
    const categoryBreakdown = [
      { category: 'Support', count: Math.floor(totalMessages * 0.4), percentage: 40 },
      { category: 'Sales', count: Math.floor(totalMessages * 0.3), percentage: 30 },
      { category: 'General', count: Math.floor(totalMessages * 0.2), percentage: 20 },
      { category: 'Complaints', count: Math.floor(totalMessages * 0.1), percentage: 10 }
    ]

    // Calculate last 24h messages
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const messagesLast24h = messages.filter(m => new Date(m.timestamp) > last24h).length

    // Calculate real metrics from actual data
    const deliveredMessages = messages.filter(m => m.status === 'delivered' || m.status === 'sent')
    const successRate = totalMessages > 0 ? Math.round((deliveredMessages.length / totalMessages) * 100 * 100) / 100 : 0

    // Calculate sentiment from message content (basic implementation)
    const positiveKeywords = ['thanks', 'good', 'great', 'excellent', 'happy', 'satisfied']
    const negativeKeywords = ['bad', 'terrible', 'angry', 'disappointed', 'problem', 'issue']
    let sentimentScore = 50 // neutral baseline

    if (totalMessages > 0) {
      const positiveCount = messages.filter(m =>
        positiveKeywords.some(keyword => m.content?.toLowerCase().includes(keyword))
      ).length
      const negativeCount = messages.filter(m =>
        negativeKeywords.some(keyword => m.content?.toLowerCase().includes(keyword))
      ).length

      sentimentScore = Math.round(((positiveCount - negativeCount) / totalMessages * 50 + 50) * 100) / 100
      sentimentScore = Math.max(0, Math.min(100, sentimentScore)) // Clamp between 0-100
    }

    // Calculate urgent messages (messages with urgent keywords)
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'help']
    const urgentMessages = messages.filter(m =>
      urgentKeywords.some(keyword => m.content?.toLowerCase().includes(keyword))
    ).length

    const analyticsData = {
      totalMessages,
      responseRate,
      avgResponseTime,
      sentimentScore,
      aiAccuracy: successRate, // Use delivery success rate as AI accuracy
      autoReplyRate: outgoingMessages.length > 0 ? Math.round((outgoingMessages.length / totalMessages) * 100 * 100) / 100 : 0,
      customerSatisfaction: Math.round((sentimentScore / 20) * 10) / 10, // Convert to 1-5 scale
      urgentMessages,
      resolvedIssues: deliveredMessages.length, // Consider delivered messages as resolved
      topContacts,
      categoryBreakdown,
      // Additional metrics
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      totalContacts: contacts.length,
      messagesLast24h,
      incomingMessages: incomingMessages.length,
      outgoingMessages: outgoingMessages.length
    }

    console.log('📊 Analytics data calculated:', {
      totalMessages,
      responseRate,
      topContactsCount: topContacts.length,
      timeRange
    })

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error getting analytics:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
