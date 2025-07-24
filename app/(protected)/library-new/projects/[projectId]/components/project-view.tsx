'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { ArrowLeft, ChevronRight, Play, Shuffle, MoreHorizontal, Share, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProjectWithTracks } from '@/db/schema/library'
import type { AudioTrack } from '@/types/audio'
import Link from 'next/link'
import { UploadTrackDialog } from '../../../components/upload-track-dialog'
import { TracksDataTable } from '../../../components/tracks-data-table'
import { currentTrackAtom, playerControlsAtom, isPlayingAtom } from '@/state/audio-atoms'
import { toast } from 'sonner'
import { upload } from '@vercel/blob/client'

interface ProjectViewProps {
  project: ProjectWithTracks
}

// Helper function to extract audio duration from file
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(file)
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration || 0)
    })
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve(0) // Return 0 if we can't determine duration
    })
    
    audio.src = url
  })
}

export function ProjectView({ project }: ProjectViewProps) {
  const router = useRouter()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
  const [currentTrack] = useAtom(currentTrackAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [isPlaying] = useAtom(isPlayingAtom)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const totalDuration = project.tracks.reduce((sum, track) => {
    return sum + (track.activeVersion?.duration || 0)
  }, 0)

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`
    }
    return `${mins}m ${secs}s`
  }

  const handlePlayAll = () => {
    if (project.tracks.length === 0) return
    
    const firstTrack = project.tracks[0]
    if (!firstTrack.activeVersion) {
      toast.error('No audio available')
      return
    }

    const audioTrack: AudioTrack = {
      id: firstTrack.id,
      title: firstTrack.name,
      url: firstTrack.activeVersion.fileUrl,
      duration: firstTrack.activeVersion.duration || undefined,
      createdAt: firstTrack.createdAt,
      type: 'uploaded'
    }

    dispatchPlayerAction({ type: 'PLAY_TRACK', payload: audioTrack })
  }

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('audio/')
    )

    if (files.length === 0) {
      toast.error('Please drop audio files only')
      return
    }

    setIsUploading(true)

    // Handle multiple files sequentially to avoid overwhelming the server
    for (const file of files) {
      try {
        const toastId = toast.loading(`Uploading ${file.name}...`)
        
        // Extract duration from audio file
        const duration = await getAudioDuration(file)
        
        // Client-side upload to Vercel Blob
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        } as any)

        // Call server API directly instead of using action hook
        const response = await fetch('/api/tracks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name.replace(/\.[^/.]+$/, ""),
            projectId: project.id,
            fileUrl: blob.url,
            fileSize: file.size,
            mimeType: file.type,
            duration: duration
          })
        })

        if (response.ok) {
          toast.success(`${file.name} uploaded successfully`, { id: toastId })
        } else {
          const error = await response.text()
          toast.error(`Failed to upload ${file.name}: ${error}`, { id: toastId })
        }
        
      } catch (error) {
        console.error('Upload failed:', error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    setIsUploading(false)
    // Refresh server-side data to show new tracks immediately
    router.refresh()
  }

  return (
    <div 
      ref={dropZoneRef}
      className={`min-h-screen bg-gradient-to-b from-background to-muted/20 transition-colors ${
        isDragOver ? 'bg-primary/5 border-primary' : ''
      } ${isUploading ? 'pointer-events-none' : ''}`}
      onDrop={handleFileDrop}
      onDragOver={(e) => {
        e.preventDefault()
        if (!isUploading) setIsDragOver(true)
      }}
      onDragLeave={(e) => {
        // Only hide drag over if we're leaving the main container
        if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
          setIsDragOver(false)
        }
      }}
    >
      {/* Drag Overlay */}
      {(isDragOver || isUploading) && (
        <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background p-8 rounded-lg border-2 border-dashed border-primary text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">
              {isUploading ? 'Uploading files...' : 'Drop audio files here'}
            </h3>
            <p className="text-muted-foreground">
              {isUploading ? 'Please wait while files are being processed' : `Files will be added to ${project.name}`}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link href={project.folderId ? `/library-new/folders/${project.folderId}` : '/library-new'}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {project.folderId ? 'Back to Folder' : 'Library'}
            </Button>
          </Link>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/library-new" className="hover:text-foreground">
              Library
            </Link>
            {project.folderId && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link href={`/library-new/folders/${project.folderId}`} className="hover:text-foreground">
                  Folder
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{project.name}</span>
          </div>
        </div>
      </div>

      {/* Project Hero Section */}
      <div className="p-6">
        <div className="flex gap-6 mb-8">
          {/* Album Art */}
          <div className="w-64 h-64 bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden">
            {/* Placeholder abstract design */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <path
                  d="M20,180 Q50,20 100,100 T180,80 L180,180 Z"
                  fill="currentColor"
                  className="text-yellow-400"
                />
                <path
                  d="M0,160 Q40,40 80,120 T160,100 L160,200 Z"
                  fill="currentColor"
                  className="text-orange-400"
                />
              </svg>
            </div>
          </div>

          {/* Project Info */}
          <div className="flex-1 flex flex-col justify-end">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">PROJECT</p>
              <h1 className="text-4xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>arth</span>
                <span>•</span>
                <span>{project.tracks.length} tracks</span>
                <span>•</span>
                <span>{formatTotalDuration(totalDuration)}</span>
                {project.accessType !== 'private' && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary">{project.accessType}</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            size="lg" 
            className="rounded-full px-8"
            onClick={handlePlayAll}
            disabled={project.tracks.length === 0 || isUploading}
          >
            <Play className="h-5 w-5 mr-2" />
            Play
          </Button>
          <Button variant="ghost" size="lg" className="rounded-full" disabled={isUploading}>
            <Shuffle className="h-5 w-5" />
          </Button>
          <UploadTrackDialog projectId={project.id} />
          <Button variant="ghost" size="sm" disabled={isUploading}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="ghost" size="sm" disabled={isUploading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Track List - Proper Data Table */}
        {project.tracks.length > 0 ? (
          <div className="space-y-4">
            <TracksDataTable tracks={project.tracks} projectId={project.id} />
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center mb-4">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No tracks yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm text-center">
                Upload your first track to get started with this project. You can drag & drop files here or use the upload button.
              </p>
              <UploadTrackDialog projectId={project.id} triggerText="Upload Track" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 