import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { getVaultProjects } from '@/lib/server/vault'

export async function GET() {
  try {
    const session = await requireAuth()
    
    // Get only root-level projects (not in any folder)
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