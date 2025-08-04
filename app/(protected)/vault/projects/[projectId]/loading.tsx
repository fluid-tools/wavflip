import { TracksTableSkeleton } from '@/components/vault/tracks/table-skeleton'

export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="p-6">
        {/* Hero Section Skeleton */}
        <div className="mb-8 flex flex-col items-center text-center space-y-4 md:flex-row md:items-end md:text-left md:gap-6">
          <div className="w-48 h-48 md:w-64 md:h-64 bg-muted rounded-lg animate-pulse" />
          <div className="flex flex-col items-center space-y-4 md:items-start md:flex-1 md:justify-end">
            <div className="h-4 w-12 md:w-16 bg-muted rounded animate-pulse" />
            <div className="h-8 w-48 md:w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 md:w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
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
