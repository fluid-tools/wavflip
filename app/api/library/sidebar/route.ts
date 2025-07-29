import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { getAllUserFolders, getVaultProjects } from '@/lib/library-db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Fetch all folders and root projects
    const [allFolders, rootProjects] = await Promise.all([
      getAllUserFolders(session.user.id),
      getVaultProjects(session.user.id)
    ])

    // Build hierarchical folder structure with projects included
    const buildHierarchy = (folders: any[], parentId: string | null = null): any[] => {
      return folders
        .filter(folder => folder.parentFolderId === parentId)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          parentFolderId: folder.parentFolderId,
          projects: folder.projects || [],
          subfolders: buildHierarchy(folders, folder.id)
        }))
    }

    const hierarchicalFolders = buildHierarchy(allFolders)

    return NextResponse.json({
      folders: hierarchicalFolders,
      rootProjects: rootProjects.map(project => ({
        id: project.id,
        name: project.name,
        trackCount: project.trackCount || 0
      }))
    })
  } catch (error) {
    console.error('Failed to fetch sidebar library data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch library data' },
      { status: 500 }
    )
  }
} 