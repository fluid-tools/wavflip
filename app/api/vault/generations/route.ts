import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server/auth'
import { getOrCreateGenerationsProject } from '@/lib/server/vault/generations'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Get or create the generations project
    const generationsProject = await getOrCreateGenerationsProject(session.user.id)
    
    return NextResponse.json(generationsProject)
  } catch (error) {
    console.error('Failed to fetch generations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    )
  }
}