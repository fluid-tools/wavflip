import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function TracksTableSkeleton() {
  return (
    <>
      {/* Mobile Skeleton */}
      <div className="md:hidden border rounded-lg overflow-hidden">
        <div style={{ height: '400px' }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 border-b border-border/50 last:border-b-0 bg-background"
            >
              {/* Play Button Skeleton */}
              <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                <Skeleton className="h-4 w-4" />
              </div>

              {/* Track Info Skeleton */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-32" />
                  {index % 3 === 0 && <Skeleton className="h-3 w-8 rounded-full" />}
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
      <div className="hidden md:block rounded-md border">
        <div className="w-full">
          {/* Header Skeleton */}
          <div className="border-b bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 80 }} className="border-0">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                <TableHead className="border-0">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead style={{ width: 80 }} className="border-0">
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead style={{ width: 120 }} className="border-0">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead style={{ width: 100 }} className="border-0">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead style={{ width: 50 }} className="border-0">
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
                <TableRow key={index} className="even:bg-muted/20 odd:bg-background">
                  <TableCell style={{ width: 80 }} className="border-0">
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell className="border-0">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      {index % 3 === 0 && <Skeleton className="h-3 w-8" />}
                    </div>
                  </TableCell>
                  <TableCell style={{ width: 80 }} className="border-0">
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </TableCell>
                  <TableCell style={{ width: 120 }} className="border-0">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell style={{ width: 100 }} className="border-0">
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell style={{ width: 50 }} className="border-0">
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
  )
} 