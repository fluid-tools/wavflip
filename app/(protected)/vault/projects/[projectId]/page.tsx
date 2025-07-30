import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-server'
import { getProjectWithTracks, getVaultProjects, getAllUserFolders } from '@/server/vault'
import { ProjectView } from './client'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const [session, { projectId }] = await Promise.all([
    requireAuth(),
    params
  ])

  const [project, folders, vaultProjects] = await Promise.all([
    getProjectWithTracks(projectId, session.user.id),
    getAllUserFolders(session.user.id),
    getVaultProjects(session.user.id)
  ])

  if (!project) notFound()

  // all projects from vault
  const allProjects = [
    ...vaultProjects,
    ...folders.flatMap(folder => folder.projects)
  ]

  return <ProjectView projectId={projectId} initialProject={project} availableProjects={allProjects} />
} 