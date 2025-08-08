'use client'

import { Progress } from '@/components/ui/progress'
import { HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStorageEstimate, useOfflineVaultSize } from '@/hooks/data/use-vault'

export function StorageIndicator({ className }: { className?: string }) {
  const { data: storageInfo, isLoading } = useStorageEstimate()
  const { data: vaultSize } = useOfflineVaultSize()

  if (isLoading || !storageInfo) {
    return null
  }

  const { quotaMB, usageDetails } = storageInfo
  const offlineMB = vaultSize?.totalMB ?? 0
  const browserMB = storageInfo.usageMB
  const usedMB = Math.max(browserMB, offlineMB)
  const usagePercentage = quotaMB > 0 ? (usedMB / quotaMB) * 100 : 0

  // Format storage size
  const formatSize = (mb: number) => {
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`
    }
    return `${(mb / 1024).toFixed(1)} GB`
  }

  // Determine color based on usage
  const getProgressColor = () => {
    if (usagePercentage > 90) return 'bg-red-500'
    if (usagePercentage > 70) return 'bg-orange-500'
    if (usagePercentage > 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5" />
          <span>Browser Storage</span>
        </div>
        <span className="font-mono">
          {formatSize(usedMB)} / {formatSize(quotaMB)}
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={usagePercentage} 
          className="h-1.5"
        />
        <div 
          className={cn(
            "absolute inset-0 h-1.5 rounded-full opacity-50",
            getProgressColor()
          )}
          style={{ width: `${usagePercentage}%` }}
        />
      </div>

      {usagePercentage > 70 && (
        <p className="text-xs text-orange-500">
          Storage is {usagePercentage.toFixed(0)}% full. Consider clearing old tracks.
        </p>
      )}

      {usageDetails && (
        <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
          {usageDetails.indexedDB && (
            <div>IndexedDB: {formatSize(usageDetails.indexedDB / (1024 * 1024))}</div>
          )}
          {usageDetails.caches && (
            <div>Caches: {formatSize(usageDetails.caches / (1024 * 1024))}</div>
          )}
        </div>
      )}

      {vaultSize && (
        <div className="text-xs text-muted-foreground">
          Offline vault: {formatSize(vaultSize.totalMB)}
        </div>
      )}
    </div>
  )
}