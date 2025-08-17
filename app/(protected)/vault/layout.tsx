import { ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getCachedSession } from '@/lib/server/auth'
import { redirect } from 'next/navigation'
import { getUserFolders, getVaultProjects, getVaultData } from '@/lib/server/vault'
import { vaultKeys } from '@/hooks/data/keys'

interface VaultLayoutProps {
  children: ReactNode
}

export default async function VaultLayout({ children }: VaultLayoutProps) {
  const session = await getCachedSession()
  if (!session) redirect('/sign-in')
  
  // Create query client with proper default options
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true, // Ensure data is fresh when navigating
      }
    }
  })

  // Prefetch common vault data for all vault pages
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: vaultKeys.folders(),
      queryFn: () => getUserFolders(session.user.id),
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: vaultKeys.vaultProjects(),
      queryFn: () => getVaultProjects(session.user.id),
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: vaultKeys.sidebar(),
      queryFn: () => getVaultData(session.user.id, { includeHierarchy: true }),
      staleTime: 5 * 60 * 1000,
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