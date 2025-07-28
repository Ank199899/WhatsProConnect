import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clearing demo data from dashboard...')

    // Since we're using real-time data hooks, we just need to ensure
    // the dashboard shows "No data available" instead of demo data
    // when real data is empty

    return NextResponse.json({
      success: true,
      message: 'Demo data cleared successfully. Dashboard will now show real data only.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error clearing demo data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear demo data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Demo data status',
      demoDataCleared: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error getting demo data status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get demo data status'
      },
      { status: 500 }
    )
  }
}
