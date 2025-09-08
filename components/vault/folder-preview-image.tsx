'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { vaultKeys } from '@/hooks/data/keys';

type FolderPreviewImageProps = {
  projectId: string;
  projectName: string;
  imageKey: string | null | undefined;
  sizes?: string;
  className?: string;
};

// Component for displaying project images in folder preview grids
export function FolderPreviewImage({
  projectId,
  projectName,
  imageKey,
  sizes = '(max-width: 640px) 80px, (max-width: 768px) 90px, (max-width: 1024px) 100px, 120px',
  className = 'object-cover',
}: FolderPreviewImageProps) {
  // Only need the presigned image URL; avoid fetching full project
  const { data: presignedUrl } = useQuery({
    queryKey: [...vaultKeys.project(projectId), 'presigned-image'],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/image`);
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      return (data?.signedUrl as string) ?? null;
    },
    enabled: !!imageKey,
    staleTime: 60 * 1000,
  });

  if (!imageKey) {
    // No image: show initial in colored circle
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
        <span className="font-semibold text-green-600 text-xs dark:text-green-400">
          {projectName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  if (!presignedUrl) {
    // Image exists but no presigned URL yet: show loading placeholder
    return (
      <div className="flex h-full w-full animate-pulse items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <span className="font-semibold text-blue-600 text-xs dark:text-blue-400">
          {projectName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <Image
      alt={projectName}
      className={className}
      fill
      priority
      sizes={sizes}
      src={presignedUrl}
    />
  );
}
