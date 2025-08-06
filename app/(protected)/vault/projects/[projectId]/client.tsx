'use client'

import { useState, useRef } from 'react'
import { useAtom } from 'jotai'
import { Play, Shuffle, MoreHorizontal, Share, Upload, Image as ImageIcon, Edit2, Trash2, Copy, ExternalLink, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TrackWithVersions } from '@/db/schema/vault'
import type { AudioTrack } from '@/types/audio'
import Image from 'next/image'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

import { UploadTrackDialog } from '@/components/vault/tracks/upload-dialog'
import { TracksTable } from '@/components/vault/tracks/table'
import { playerControlsAtom } from '@/state/audio-atoms'
import { toast } from 'sonner'
import { useProject } from '@/hooks/data/use-project'
import { useRootFolders, useVaultProjects } from '@/hooks/data/use-vault'

interface ProjectViewProps {
    projectId: string
}

export function ProjectView({ projectId }: ProjectViewProps) {
    const { project, uploadTracks, isUploading, uploadImage, isUploadingImage, presignedImageUrl } = useProject({
        projectId
    })

    // Get available projects for move operations
    const { data: folders = [] } = useRootFolders()
    const { data: vaultProjects = [] } = useVaultProjects()

    const availableProjects = [
        ...vaultProjects,
        ...folders.flatMap(folder => folder.projects)
    ]

    // // Debug: Log when project data changes
    // useEffect(() => {
    //   console.log('🎵 ProjectView project updated:', project.tracks?.length || 0, 'tracks')
    // }, [project.tracks?.length])

    const [isDragOver, setIsDragOver] = useState(false)
    const dropZoneRef = useRef<HTMLDivElement>(null)

    const [, dispatchPlayerAction] = useAtom(playerControlsAtom)

    // project will now be reactive to mutations thanks to placeholderData
    if (!project) return null

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

    const handleShuffle = () => {
        if (!project.tracks || project.tracks.length === 0) {
            toast.error('No tracks to shuffle')
            return
        }

        // Create shuffled copy of tracks
        const shuffledTracks = [...project.tracks].sort(() => Math.random() - 0.5)
        const firstTrack = shuffledTracks[0]

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
        toast.success('Playing in shuffle mode')
    }

    const handleShare = async () => {
        try {
            const projectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/vault/projects/${projectId}`
            await navigator.clipboard.writeText(projectUrl)
            toast.success('Project link copied to clipboard')
        } catch {
            toast.error('Failed to copy link')
        }
    }

    const handleCopyProjectId = async () => {
        try {
            await navigator.clipboard.writeText(projectId)
            toast.success('Project ID copied to clipboard')
        } catch {
            toast.error('Failed to copy project ID')
        }
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

    const imageSrc = project.image?.startsWith('blob:')
        ? project.image
        : presignedImageUrl

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
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
                    {/* Album Art */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <ContextMenu>
                                    <ContextMenuTrigger asChild>
                                        <div
                                            className="relative w-48 h-48 md:w-64 md:h-64 rounded-lg shadow-lg overflow-hidden flex-shrink-0 cursor-pointer group border-2 border-transparent group-hover:border-primary/50 transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                const input = document.createElement('input')
                                                input.type = 'file'
                                                input.accept = 'image/*'
                                                input.multiple = false
                                                input.onchange = async (e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0]
                                                    if (file) {
                                                        await uploadImage(file)
                                                    }
                                                }
                                                input.click()
                                            }}
                                        >
                                            {isUploadingImage && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                                    <Upload className="h-6 w-6 text-white animate-spin" />
                                                </div>
                                            )}
                                            {imageSrc ? (
                                                <Image
                                                    src={imageSrc}
                                                    alt={project.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 192px, 256px"
                                                    priority
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
                                                    {/* Placeholder abstract design */}
                                                    <ImageIcon className="h-6 w-6 text-white" />
                                                </div>
                                            )}
                                            {/* Overlay on hover */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                <div className="bg-black/60 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ImageIcon className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent className="w-48">
                                        <ContextMenuItem
                                            onClick={() => {
                                                const input = document.createElement('input')
                                                input.type = 'file'
                                                input.accept = 'image/*'
                                                input.multiple = false
                                                input.onchange = async (e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0]
                                                    if (file) {
                                                        await uploadImage(file)
                                                    }
                                                }
                                                input.click()
                                            }}
                                            disabled={isUploadingImage}
                                        >
                                            {isUploadingImage ? (
                                                <Upload className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <ImageIcon className="h-4 w-4 mr-2" />
                                            )}
                                            {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to upload project image</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Project Info */}
                    <div className="flex-1 flex flex-col justify-center md:justify-end text-center md:text-left space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">PROJECT</p>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{project.name}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start flex-wrap">
                                <span>{project.tracks?.length || 0} tracks</span>
                                <span>•</span>
                                <span>{formatTotalDuration(totalDuration)}</span>
                                {project.accessType !== 'private' && (
                                    <>
                                        <span>•</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {project.accessType}
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <Button
                        size="lg"
                        className="rounded-full px-6 sm:px-8"
                        onClick={handlePlayAll}
                        disabled={!project.tracks || project.tracks.length === 0 || isUploading}
                    >
                        <Play className="h-5 w-5 mr-2" />
                        Play
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="rounded-full h-12 w-12 p-0"
                                    onClick={handleShuffle}
                                    disabled={!project.tracks || project.tracks.length === 0 || isUploading}
                                >
                                    <Shuffle className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Shuffle play</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <UploadTrackDialog projectId={projectId} />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={isUploading}>
                                <Share className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={handleShare}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyProjectId}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Copy Project ID
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={isUploading}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Rename Project
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive Project
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Project
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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