import { Skeleton } from '@/components/ui/skeleton'

export default function FolderLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Folder info loading */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Grid loading - matches your actual layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-full max-w-40 aspect-[4/5] rounded-lg overflow-hidden bg-muted border p-0">
            {/* Image section skeleton */}
            <div className="relative w-full h-40">
              <Skeleton className="w-full h-full" />
            </div>
            {/* Metadata section skeleton */}
            <div className="px-2 pb-2 pt-1">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}