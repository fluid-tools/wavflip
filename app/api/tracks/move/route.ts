import { NextRequest, NextResponse } from 'next/server'
import { moveTrackAction } from '@/actions/library'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const result = await moveTrackAction(
      { success: false, error: null }, 
      formData
    )

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to move track' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Move track API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 