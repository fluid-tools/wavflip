
// ================================
// QUERY KEYS
// ================================

export const vaultKeys = {
  base: ['vault'] as const,
  sidebar: () => [...vaultKeys.base, 'sidebar'] as const,
  folders: () => [...vaultKeys.base, 'folders'] as const,
  folder: (id: string) => [...vaultKeys.folders(), id] as const,
  projects: () => [...vaultKeys.base, 'projects'] as const,
  project: (id: string) => [...vaultKeys.projects(), id] as const,
  vaultProjects: () => [...vaultKeys.base, 'vault-projects'] as const,
  hierarchical: (excludeId?: string | null) =>
    excludeId
      ? ([...vaultKeys.base, 'hierarchical', excludeId] as const)
      : ([...vaultKeys.base, 'hierarchical'] as const),
  stats: () => [...vaultKeys.base, 'stats'] as const,
  storage: () => ['storage-estimate'] as const,
}
