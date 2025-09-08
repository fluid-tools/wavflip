'use client';

import { Loader2, Plus, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useProject } from '@/hooks/data/use-project';

type UploadTrackDialogProps = {
  projectId: string;
  triggerText?: string;
};

type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

export function UploadTrackDialog({
  projectId,
  triggerText = 'Add tracks',
}: UploadTrackDialogProps) {
  const { uploadTrack, isUploading } = useProject({ projectId });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileTypeDisplay = (file: File): string => {
    const mimeType = file.type;
    const extension = file.name.split('.').pop()?.toUpperCase();

    // More specific audio type detection
    const typeMap: Record<string, string> = {
      'audio/mpeg': 'MP3',
      'audio/wav': 'WAV',
      'audio/wave': 'WAV',
      'audio/x-wav': 'WAV',
      'audio/flac': 'FLAC',
      'audio/x-flac': 'FLAC',
      'audio/mp4': 'M4A',
      'audio/x-m4a': 'M4A',
      'audio/aac': 'AAC',
      'audio/ogg': 'OGG',
      'audio/webm': 'WEBM',
      'audio/3gpp': '3GP',
      'audio/amr': 'AMR',
    };

    return typeMap[mimeType] || extension || 'Audio';
  };

  // Helper function to extract audio duration from file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      const url = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration || 0);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        resolve(0); // Return 0 if we can't determine duration
      });

      audio.src = url;
    });
  };

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('audio/')) {
      setSelectedFile(file);
      if (!name) {
        // Auto-fill track name from filename (without extension)
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setName(fileName);
      }
    } else {
      toast.error('Please select an audio file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const resetForm = () => {
    setName('');
    setSelectedFile(null);
    setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setSelectedFile(null);
      setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(selectedFile && name.trim())) {
      toast.error('Please provide a track name and select a file');
      return;
    }

    try {
      // Extract duration from audio file
      const duration = await getAudioDuration(selectedFile);

      // Use optimistic upload from hook
      await uploadTrack({
        name: name.trim(),
        file: selectedFile,
        duration,
      });

      setOpen(false);
      resetForm();
    } catch (_error) {
      // Error handling is done in the hook
    }
  };

  const isLoading = isUploading;

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Track</DialogTitle>
            <DialogDescription>
              Upload an audio file to add a new track to this project.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Track Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Track Name</Label>
              <Input
                disabled={isLoading}
                id="name"
                name="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter track name"
                required
                value={name}
              />
            </div>

            {/* File Upload */}
            <div className="grid gap-2">
              <Label>Audio File</Label>

              {/* Drop Zone */}
              <div
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : selectedFile
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                onClick={() => !isLoading && fileInputRef.current?.click()}
                onDragLeave={() => setIsDragOver(false)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDrop={handleDrop}
              >
                <input
                  accept="audio/*"
                  className="hidden"
                  disabled={isLoading}
                  name="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(file);
                    }
                  }}
                  ref={fileInputRef}
                  type="file"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        {selectedFile.name}
                      </span>
                      {!isLoading && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB •{' '}
                      {getFileTypeDisplay(selectedFile)}
                    </p>

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="space-y-2">
                        <Progress
                          className="w-full"
                          value={uploadProgress.percentage}
                        />
                        <p className="text-muted-foreground text-xs">
                          Uploading... {uploadProgress.percentage}% (
                          {(uploadProgress.loaded / 1024 / 1024).toFixed(1)} MB
                          / {(uploadProgress.total / 1024 / 1024).toFixed(1)}{' '}
                          MB)
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isLoading ? (
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">
                        {isLoading
                          ? 'Processing...'
                          : 'Drop your audio file here'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {isLoading
                          ? 'Please wait...'
                          : 'or click to browse (MP3, WAV, FLAC, M4A, etc.)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={isLoading}
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isLoading || !name.trim() || !selectedFile}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading
                    ? `Uploading ${uploadProgress.percentage}%`
                    : 'Creating...'}
                </>
              ) : (
                'Upload Track'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
