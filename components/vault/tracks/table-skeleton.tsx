import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function TracksTableSkeleton() {
  return (
    <>
      {/* Mobile Skeleton */}
      <div className="overflow-hidden rounded-lg border md:hidden">
        <div style={{ height: '400px' }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              className="flex items-center gap-3 border-border/50 border-b bg-background p-3 last:border-b-0"
              key={index}
            >
              {/* Play Button Skeleton */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                <Skeleton className="h-4 w-4" />
              </div>

              {/* Track Info Skeleton */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  {index % 3 === 0 && (
                    <Skeleton className="h-3 w-8 rounded-full" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-16" />
                  <span className="text-muted-foreground">•</span>
                  <Skeleton className="h-3 w-8 rounded-full" />
                  <span className="text-muted-foreground">•</span>
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>

              {/* Actions Menu Skeleton */}
              <Skeleton className="h-8 w-8 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden rounded-md border md:block">
        <div className="w-full">
          {/* Header Skeleton */}
          <div className="border-b bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-0" style={{ width: 80 }}>
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                  <TableHead className="border-0">
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead className="border-0" style={{ width: 80 }}>
                    <Skeleton className="h-4 w-12" />
                  </TableHead>
                  <TableHead className="border-0" style={{ width: 120 }}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead className="border-0" style={{ width: 100 }}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead className="border-0" style={{ width: 50 }}>
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          {/* Body Skeleton */}
          <div style={{ height: '400px' }}>
            <Table>
              <TableBody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <TableRow
                    className="odd:bg-background even:bg-muted/20"
                    key={index}
                  >
                    <TableCell className="border-0" style={{ width: 80 }}>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell className="border-0">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        {index % 3 === 0 && <Skeleton className="h-3 w-8" />}
                      </div>
                    </TableCell>
                    <TableCell className="border-0" style={{ width: 80 }}>
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </TableCell>
                    <TableCell className="border-0" style={{ width: 120 }}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="border-0" style={{ width: 100 }}>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="border-0" style={{ width: 50 }}>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
