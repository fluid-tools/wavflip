'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StorageInfo {
  usage: number
  quota: number
  usageDetails?: {
    indexedDB?: number
    caches?: number
    serviceWorker?: number
  }
}

export function StorageIndicator({ className }: { className?: string }) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkStorage() {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate()
          setStorageInfo({
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            usageDetails: 'usageDetails' in estimate ? (estimate as StorageEstimate & { usageDetails?: Record<string, number> }).usageDetails : undefined
          })
        } catch (error) {
          console.error('Failed to estimate storage:', error)
        }
      }
      setIsLoading(false)
    }

    checkStorage()
    // Check every 30 seconds
    const interval = setInterval(checkStorage, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !storageInfo) {
    return null
  }

  const usagePercentage = (storageInfo.usage / storageInfo.quota) * 100
  const usageMB = storageInfo.usage / (1024 * 1024)
  const quotaMB = storageInfo.quota / (1024 * 1024)

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
          {formatSize(usageMB)} / {formatSize(quotaMB)}
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

      {storageInfo.usageDetails && (
        <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
          {storageInfo.usageDetails.indexedDB && (
            <div>IndexedDB: {formatSize(storageInfo.usageDetails.indexedDB / (1024 * 1024))}</div>
          )}
          {storageInfo.usageDetails.caches && (
            <div>Caches: {formatSize(storageInfo.usageDetails.caches / (1024 * 1024))}</div>
          )}
        </div>
      )}
    </div>
  )
}