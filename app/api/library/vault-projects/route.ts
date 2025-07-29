import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getVaultProjects } from '@/server/library'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    const projects = await getVaultProjects(session.user.id)
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Failed to fetch vault projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch vault projects' },
      { status: 500 }
    )
  }
} 