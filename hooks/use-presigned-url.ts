'use client'

import { useQuery } from '@tanstack/react-query'

export function usePresignedUrl(projectId: string, imageKey: string | null | undefined) {
  return useQuery({
    queryKey: [['vault', 'projects', projectId], 'presigned-image'],
    queryFn: async () => {
      if (!imageKey) return null
      
      const res = await fetch(`/api/projects/${projectId}/image`)
      if (!res.ok) return null
      const data = await res.json()
      return data.signedUrl as string
    },
    enabled: !!imageKey,
    staleTime: 60 * 1000, // 1 minute
  })
}