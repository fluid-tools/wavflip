'use client';

import { FileAudio, Folder, HardDrive, Music } from 'lucide-react';
// import { useVaultStats } from '@/hooks/data/use-vault'

export function VaultStats() {
  // const { data: stats } = useVaultStats()
  const stats = {
    totalFolders: 10,
    totalProjects: 100,
    totalTracks: 1000,
    totalVersions: 10_000,
    totalSize: 1_000_000,
    totalDuration: 1_000_000,
  };

  if (!stats) return null;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / k ** i).toFixed(1)) + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statItems = [
    {
      label: 'Folders',
      value: stats.totalFolders,
      icon: Folder,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'Projects',
      value: stats.totalProjects,
      icon: Music,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      label: 'Tracks',
      value: `${stats.totalTracks} • ${stats.totalVersions} versions`,
      icon: FileAudio,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      label: 'Storage',
      value: `${formatBytes(stats.totalSize)} • ${formatDuration(stats.totalDuration)}`,
      icon: HardDrive,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 md:grid-cols-4">
      {statItems.map((item) => (
        <div
          className="flex items-center gap-3 rounded-xl border p-2 transition-colors hover:bg-card"
          key={item.label}
        >
          <div className={`rounded-xl p-2 ${item.bgColor}`}>
            <item.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${item.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-muted-foreground text-xs">
              {item.label}
            </p>
            <p className="truncate font-medium text-sm">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
