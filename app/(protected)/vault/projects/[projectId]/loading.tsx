import { TracksTableSkeleton } from '@/components/vault/tracks/table-skeleton'

export default function ProjectLoading() {
  return (
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
  )
} 
