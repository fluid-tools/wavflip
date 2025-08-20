// ================================
// QUERY KEYS
// ================================

export const vaultKeys = {
  base: ['vault'] as const,
  folders: () => [...vaultKeys.base, 'folders'] as const,
  folder: (id: string) => [...vaultKeys.folders(), id] as const,
  projects: () => [...vaultKeys.base, 'projects'] as const,
  project: (id: string) => [...vaultKeys.projects(), id] as const,
  vaultProjects: () => [...vaultKeys.base, 'vault-projects'] as const,
  tree: () => [...vaultKeys.base, 'tree'] as const,
  hierarchical: (excludeId?: string | null) =>
    excludeId
      ? ([...vaultKeys.base, 'hierarchical', excludeId] as const)
      : ([...vaultKeys.base, 'hierarchical'] as const),
  stats: () => [...vaultKeys.base, 'stats'] as const,
  storage: () => ['storage-estimate'] as const,
};

export const waveformKeys = {
  all: ['waveform'] as const,
  byKey: (key: string) => [...waveformKeys.all, key] as const,
};

export const trackUrlKeys = {
  all: ['track-urls'] as const,
  single: (trackId: string) => [...trackUrlKeys.all, trackId] as const,
  project: (projectId: string) =>
    [...trackUrlKeys.all, 'project', projectId] as const,
};

export const generationsKeys = {
  all: ['generations'] as const,
  online: () => [...generationsKeys.all, 'online'] as const,
  localCache: () => [...generationsKeys.all, 'local-cache'] as const,
};
