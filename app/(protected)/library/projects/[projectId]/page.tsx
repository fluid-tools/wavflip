import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-server'
import { getProjectWithTracks, getVaultProjects, getAllUserFolders } from '@/server/library'
import { ProjectView } from '@/components/library/projects/view'
import { TracksTableSkeleton } from '@/components/library/tracks/table-skeleton'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

async function ProjectData({ projectId }: { projectId: string }) {
  const session = await requireAuth()
  
  // Fetch project data and all available projects for move functionality
  const [project, folders, vaultProjects] = await Promise.all([
    getProjectWithTracks(projectId, session.user.id),
    getAllUserFolders(session.user.id),
    getVaultProjects(session.user.id)
  ])

  if (!project) {
    notFound()
  }

  // Combine all projects from folders and vault
  const allProjects = [
    ...vaultProjects,
    ...folders.flatMap(folder => folder.projects)
  ]

  return (
    <ProjectView 
      projectId={projectId} 
      initialProject={project} 
      availableProjects={allProjects}
    />
  )
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params

  if (!projectId) {
    notFound()
  }

  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          <div className="p-6">
            {/* Hero Section Skeleton */}
            <div className="flex gap-6 mb-8">
              <div className="w-64 h-64 bg-muted rounded-lg animate-pulse" />
              <div className="flex-1 flex flex-col justify-end space-y-4">
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </div>
            </div>
            
            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-10 w-20 bg-muted rounded-full animate-pulse" />
              <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            </div>

            {/* Table Skeleton */}
            <TracksTableSkeleton />
          </div>
        </div>
      }
    >
      <ProjectData projectId={projectId} />
    </Suspense>
  )
} 