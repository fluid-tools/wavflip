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
    <div className="rounded-md border">
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
  )
} 