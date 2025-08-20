import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function VaultLoading() {
  return (
    <div className="w-full space-y-6 p-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[...new Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {[...new Array(12)].map((_, i) => (
          <div
            className="aspect-[4/5] w-full max-w-40 overflow-hidden rounded-lg border bg-muted"
            key={i}
          >
            <Skeleton className="h-40 w-full" />
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
