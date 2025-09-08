import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { notFound, redirect } from 'next/navigation';
import { FolderView } from '@/app/(protected)/vault/folders/[folderId]/client';
import { getServerSession } from '@/lib/server/auth';
import { getFolderWithContents } from '@/lib/server/vault';

type FolderPageProps = {
  params: Promise<{
    folderId: string;
  }>;
};

export default async function FolderPage({ params }: FolderPageProps) {
  // Parallelize session check and params extraction for better performance
  const [session, { folderId }] = await Promise.all([
    getServerSession(),
    params,
  ]);

  if (!(folderId && session?.user?.id)) {
    redirect('/sign-in');
  }

  const queryClient = new QueryClient();

  // Only prefetch folder-specific data (common vault data is handled by layout)
  await queryClient.prefetchQuery({
    queryKey: ['vault', 'folders', folderId],
    queryFn: () => getFolderWithContents(folderId, session.user.id),
  });

  const folder = queryClient.getQueryData(['vault', 'folders', folderId]);

  if (!folder) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FolderView folderId={folderId} />
    </HydrationBoundary>
  );
}
