import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { getVaultProjects } from '@/lib/server/vault'
import { ProjectWithTracksSchema } from '@/lib/contracts/project'

export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth()

    // Get only root-level projects (not in any folder)
    const projects = await getVaultProjects(session.user.id)

    return NextResponse.json(projects.map(p => ProjectWithTracksSchema.parse(p)))
  } catch (error) {
    console.error('Failed to fetch vault projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch vault projects' },
      { status: 500 }
    )
  }
}