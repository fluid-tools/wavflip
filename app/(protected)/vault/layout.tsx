import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { vaultKeys } from '@/hooks/data/keys';
import { getServerSession } from '@/lib/server/auth';
import {
  getRootProjects,
  getUserFolders,
  getVaultData,
} from '@/lib/server/vault';

type VaultLayoutProps = {
  children: ReactNode;
};

export default async function VaultLayout({ children }: VaultLayoutProps) {
  const session = await getServerSession();
  if (!session) {
    redirect('/sign-in');
  }

  // Create query client with proper default options
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true, // Ensure data is fresh when navigating
      },
    },
  });

  // Prefetch common vault data for all vault pages
  await queryClient.prefetchQuery({
    queryKey: vaultKeys.tree(),
    queryFn: () => getVaultData(session.user.id),
    staleTime: 5 * 60 * 1000,
  });

  // Prefetch root folders and root projects for immediate availability in /vault
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: vaultKeys.folders(),
      queryFn: () => getUserFolders(session.user.id),
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: vaultKeys.projects(),
      queryFn: () => getRootProjects(session.user.id),
      staleTime: 5 * 60 * 1000,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-full w-full flex-col">
        <ScrollArea className="flex-1">
          <div className="pb-24">{children}</div>
        </ScrollArea>
      </div>
    </HydrationBoundary>
  );
}
