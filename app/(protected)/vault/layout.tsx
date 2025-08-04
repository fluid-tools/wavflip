import { ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { requireAuth } from '@/lib/server/auth'
import { getUserFolders, getVaultProjects, getSidebarData } from '@/lib/server/vault'

interface VaultLayoutProps {
  children: ReactNode
}

export default async function VaultLayout({ children }: VaultLayoutProps) {
  const session = await requireAuth()
  const queryClient = new QueryClient()

  // Prefetch common vault data for all vault pages
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['vault', 'folders'],
      queryFn: () => getUserFolders(session.user.id)
    }),
    queryClient.prefetchQuery({
      queryKey: ['vault', 'vault-projects'],
      queryFn: () => getVaultProjects(session.user.id)
    }),
    queryClient.prefetchQuery({
      queryKey: ['vault', 'sidebar'],
      queryFn: () => getSidebarData(session.user.id)
    })
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-full w-full flex flex-col">
        <ScrollArea className="flex-1">
          <div className="pb-24">
            {children}
          </div>
        </ScrollArea>
      </div>
    </HydrationBoundary>
  )
} 