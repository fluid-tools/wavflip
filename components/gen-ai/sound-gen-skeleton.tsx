import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SoundGeneratorSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs Skeleton */}
      <div className="w-full">
        <div className="mb-6 grid w-full grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>

        {/* Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="mt-2 h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-20 w-full rounded-md" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>

            <Skeleton className="h-12 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>

      {/* Generated Sounds Skeleton */}
      <Card className="flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-4 w-60" />
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="h-[400px] px-6 pb-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                  key={i}
                >
                  <div className="min-w-0 flex-1">
                    <Skeleton className="mb-1 h-4 w-48" />
                    <Skeleton className="mb-2 h-3 w-full" />
                    <Skeleton className="mb-2 h-3 w-32" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
