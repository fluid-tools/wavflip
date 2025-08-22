import { TracksTableSkeleton } from '@/components/vault/tracks/table-skeleton';

export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="p-6">
        {/* Hero Section Skeleton */}
        <div className="mb-8 flex flex-col items-center space-y-4 text-center md:flex-row md:items-end md:gap-6 md:text-left">
          <div className="h-48 w-48 animate-pulse rounded-lg bg-muted md:h-64 md:w-64" />
          <div className="flex flex-col items-center space-y-4 md:flex-1 md:items-start md:justify-end">
            <div className="h-4 w-12 animate-pulse rounded bg-muted md:w-16" />
            <div className="h-8 w-48 animate-pulse rounded bg-muted md:w-64" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted md:w-48" />
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-4 md:justify-start">
          <div className="h-10 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        </div>

        {/* Table Skeleton */}
        <TracksTableSkeleton />
      </div>
    </div>
  );
}
