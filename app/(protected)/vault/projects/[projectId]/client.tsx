'use client'

import { useState, useRef } from 'react'
import { useAtom } from 'jotai'
import { Play, Shuffle, MoreHorizontal, Share, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProjectWithTracks, TrackWithVersions } from '@/db/schema/vault'
import type { AudioTrack } from '@/types/audio'
import Image from 'next/image'

import { UploadTrackDialog } from '@/components/vault/tracks/upload-dialog'
import { TracksTable } from '@/components/vault/tracks/table'
import { playerControlsAtom } from '@/state/audio-atoms'
import { toast } from 'sonner'
import { useProject } from '@/hooks/data/use-project'
import { useSession } from '@/lib/auth-client'

interface ProjectViewProps {
    projectId: string
    initialProject: ProjectWithTracks
    availableProjects?: ProjectWithTracks[]
}

export function ProjectView({ projectId, initialProject, availableProjects = [] }: ProjectViewProps) {
    const { data: session } = useSession()
    const { project: queryProject, uploadTracks, isUploading } = useProject({
        projectId,
        initialData: initialProject
    })

    // Use query data or fallback to initial data
    const project = queryProject || initialProject

    // // Debug: Log when project data changes
    // useEffect(() => {
    //   console.log('🎵 ProjectView project updated:', project.tracks?.length || 0, 'tracks')
    // }, [project.tracks?.length])

    const [isDragOver, setIsDragOver] = useState(false)
    const dropZoneRef = useRef<HTMLDivElement>(null)

    const [, dispatchPlayerAction] = useAtom(playerControlsAtom)

    const totalDuration = (project.tracks || []).reduce((sum: number, track: TrackWithVersions) => {
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
        if (!project.tracks || project.tracks.length === 0) return

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

        // Use optimistic uploads from the hook
        await uploadTracks(files)
    }

    return (
        <div
            ref={dropZoneRef}
            className={`min-h-screen bg-gradient-to-b from-background to-muted/20 transition-colors ${isDragOver ? 'bg-primary/5 border-primary' : ''
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



            {/* Project Hero Section */}
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Album Art */}
                    <div className="relative w-32 h-32 rounded-lg shadow-lg overflow-hidden flex-shrink-0 self-center sm:self-start">
                        {project.image ? (
                            <Image 
                                src={project.image} 
                                alt={project.name}
                                fill
                                className="object-cover"
                                sizes="128px"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
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
                        )}
                    </div>

                    {/* Project Info */}
                    <div className="flex-1 flex flex-col justify-center sm:justify-end text-center sm:text-left">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">PROJECT</p>
                            <h1 className="text-2xl font-bold">{project.name}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground justify-center sm:justify-start flex-wrap">
                                <span>{session?.user?.name || session?.user?.email || 'Unknown'}</span>
                                <span>•</span>
                                <span>{project.tracks?.length || 0} tracks</span>
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
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <Button
                        size="lg"
                        className="rounded-full px-6 sm:px-8"
                        onClick={handlePlayAll}
                        disabled={!project.tracks || project.tracks.length === 0 || isUploading}
                    >
                        <Play className="h-5 w-5 mr-2" />
                        Play
                    </Button>
                    <Button variant="ghost" size="lg" className="rounded-full" disabled={isUploading}>
                        <Shuffle className="h-5 w-5" />
                    </Button>
                    <UploadTrackDialog projectId={projectId} />
                    <Button variant="ghost" size="sm" disabled={isUploading}>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    <Button variant="ghost" size="sm" disabled={isUploading}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>

                {/* Track List - Refactored Table */}
                {project.tracks && project.tracks.length > 0 ? (
                    <div>
                        <TracksTable
                            tracks={project.tracks}
                            projectId={projectId}
                            availableProjects={availableProjects}
                        />
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
                            <UploadTrackDialog projectId={projectId} triggerText="Upload Track" />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
} 