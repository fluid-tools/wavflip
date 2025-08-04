'use client'

import { Folder, Music, FileAudio, HardDrive } from 'lucide-react'
import { useVaultStats } from '@/hooks/data/use-vault'

export function VaultStats() {
  const { data: stats } = useVaultStats()
  
  if (!stats) return null
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const statItems = [
    {
      label: 'Folders',
      value: stats.totalFolders,
      icon: Folder,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      label: 'Projects', 
      value: stats.totalProjects,
      icon: Music,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    {
      label: 'Tracks',
      value: `${stats.totalTracks} • ${stats.totalVersions} versions`,
      icon: FileAudio,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    },
    {
      label: 'Storage',
      value: `${formatBytes(stats.totalSize)} • ${formatDuration(stats.totalDuration)}`,
      icon: HardDrive,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
      {statItems.map((item) => (
        <div 
          key={item.label}
          className="flex items-center gap-3 p-2 rounded-xl border hover:bg-card transition-colors"
        >
          <div className={`p-2 rounded-xl ${item.bgColor}`}>
            <item.icon className={`sm:h-4 sm:w-4 h-3 w-3 ${item.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{item.label}</p>
            <p className="text-sm font-medium truncate">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}