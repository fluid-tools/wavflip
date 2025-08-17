"use client"

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { waveformKeys } from './keys'

type WaveformData = {
  peaks: number[]
  duration: number
  sampleRate: number
  channels: number
  bits: number
}

type WaveformResponse = {
  data: WaveformData
  isPlaceholder: boolean
  generatedAt: string
  key: string
}

async function getWaveform(key: string): Promise<WaveformResponse> {
  const res = await fetch(`/api/waveform/${encodeURIComponent(key)}`)
  if (!res.ok) throw new Error('Failed to fetch waveform')
  return res.json()
}

export function useWaveform(trackKey?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: trackKey ? waveformKeys.byKey(trackKey) : ['waveform:none'],
    enabled: !!trackKey,
    queryFn: () => getWaveform(trackKey!),
    staleTime: 60_000,
  })

  const persist = useMutation({
    mutationFn: async (payload: WaveformData) => {
      if (!trackKey) throw new Error('Missing trackKey')
      await fetch(`/api/waveform/${encodeURIComponent(trackKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return payload
    },
    onSuccess: (payload: WaveformData) => {
      if (!trackKey) return
      const optimistic: WaveformResponse = {
        data: payload,
        isPlaceholder: false,
        generatedAt: new Date().toISOString(),
        key: trackKey,
      }
      queryClient.setQueryData(waveformKeys.byKey(trackKey), optimistic)
      queryClient.invalidateQueries({ queryKey: waveformKeys.byKey(trackKey) })
    },
  })

  return useMemo(
    () => ({
      data: query.data?.data,
      isPlaceholder: query.data?.isPlaceholder ?? false,
      isLoading: query.isLoading,
      refetch: query.refetch,
      persist,
    }),
    [query.data, query.isLoading, query.refetch, persist]
  )
}


