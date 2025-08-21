import { Skeleton } from '@/components/ui/skeleton';

export default function FolderLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Folder info loading */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Grid loading - matches your actual layout */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {[...Array(8)].map((_, i) => (
          <div
            className="aspect-[4/5] w-full max-w-40 overflow-hidden rounded-lg border bg-muted p-0"
            key={i}
          >
            {/* Image section skeleton */}
            <div className="relative h-40 w-full">
              <Skeleton className="h-full w-full" />
            </div>
            {/* Metadata section skeleton */}
            <div className="px-2 pt-1 pb-2">
              <Skeleton className="mb-1 h-3 w-20" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
