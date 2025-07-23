'use client'

import { useState, useTransition } from 'react'
import { useAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wand2, Mic, Play, Download } from 'lucide-react'
import { generateSoundEffect, generateTextToSpeech } from '@/actions/generate-sound'
import { 
  isGeneratingAtom, 
  generationProgressAtom, 
  playerControlsAtom,
  generatedSoundsAtom 
} from '@/state/audio-atoms'
import type { GeneratedSound } from '@/types/audio'
import { downloadAndStoreAudio } from '@/lib/library-storage'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SoundGeneratorProps {
  className?: string
}

export function SoundGenerator({ className }: SoundGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [ttsText, setTtsText] = useState('')
  const [activeTab, setActiveTab] = useState('sound-effects')
  const [isPending, startTransition] = useTransition()
  
  const [isGenerating] = useAtom(isGeneratingAtom)
  const [generationProgress] = useAtom(generationProgressAtom)
  const [, dispatchPlayerAction] = useAtom(playerControlsAtom)
  const [generatedSounds] = useAtom(generatedSoundsAtom)

  const handleGenerateSoundEffect = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a sound description')
      return
    }

    startTransition(async () => {
      dispatchPlayerAction({ type: 'START_GENERATION' })
      
      try {
        const result = await generateSoundEffect(prompt.trim())
        
        if (result.success && result.data) {
          dispatchPlayerAction({ 
            type: 'FINISH_GENERATION', 
            payload: result.data 
          })
          
          // Auto-play the generated sound
          dispatchPlayerAction({ 
            type: 'PLAY_TRACK', 
            payload: result.data 
          })
          
          // Auto-save to library
          try {
            await downloadAndStoreAudio(result.data)
            dispatchPlayerAction({ type: 'ADD_TO_LIBRARY', payload: result.data })
          } catch (error) {
            console.error('Failed to save to library:', error)
            // Don't show error to user, just log it
          }
          
          toast.success('Sound generated successfully!')
          setPrompt('') // Clear the prompt
        } else {
          dispatchPlayerAction({ type: 'ERROR' })
          toast.error(result.error || 'Failed to generate sound')
        }
      } catch (error) {
        dispatchPlayerAction({ type: 'ERROR' })
        toast.error('An unexpected error occurred')
        console.error('Generation error:', error)
      }
    })
  }

  const handleGenerateTextToSpeech = () => {
    if (!ttsText.trim()) {
      toast.error('Please enter text to convert to speech')
      return
    }

    startTransition(async () => {
      dispatchPlayerAction({ type: 'START_GENERATION' })
      
      try {
        const result = await generateTextToSpeech(ttsText.trim())
        
        if (result.success && result.data) {
          dispatchPlayerAction({ 
            type: 'FINISH_GENERATION', 
            payload: result.data 
          })
          
          // Auto-play the generated speech
          dispatchPlayerAction({ 
            type: 'PLAY_TRACK', 
            payload: result.data 
          })
          
          // Auto-save to library
          try {
            await downloadAndStoreAudio(result.data)
            dispatchPlayerAction({ type: 'ADD_TO_LIBRARY', payload: result.data })
          } catch (error) {
            console.error('Failed to save to library:', error)
            // Don't show error to user, just log it
          }
          
          toast.success('Speech generated successfully!')
          setTtsText('') // Clear the text
        } else {
          dispatchPlayerAction({ type: 'ERROR' })
          toast.error(result.error || 'Failed to generate speech')
        }
      } catch (error) {
        dispatchPlayerAction({ type: 'ERROR' })
        toast.error('An unexpected error occurred')
        console.error('Generation error:', error)
      }
    })
  }

  const handlePlaySound = (sound: GeneratedSound) => {
    dispatchPlayerAction({ type: 'PLAY_TRACK', payload: sound })
  }

  const isLoading = isPending || isGenerating

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sound-effects" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Sound Effects
          </TabsTrigger>
          <TabsTrigger value="text-to-speech" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Text to Speech
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sound-effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Generate Sound Effects
              </CardTitle>
              <CardDescription>
                Describe the sound you want to create and AI will generate it for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Sound Description
                </label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., A gentle rain falling on leaves, footsteps on gravel, ocean waves crashing..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  maxLength={500}
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Be descriptive for better results</span>
                  <span>{prompt.length}/500</span>
                </div>
              </div>

              <Button 
                onClick={handleGenerateSoundEffect}
                disabled={isLoading || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating... {Math.round(generationProgress * 100)}%
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Sound Effect
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text-to-speech" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Text to Speech
              </CardTitle>
              <CardDescription>
                Convert any text into natural-sounding speech
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="tts-text" className="text-sm font-medium">
                  Text to Convert
                </label>
                <Textarea
                  id="tts-text"
                  placeholder="Enter the text you want to convert to speech..."
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  rows={4}
                  maxLength={2500}
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Natural speech generation</span>
                  <span>{ttsText.length}/2500</span>
                </div>
              </div>

              <Button 
                onClick={handleGenerateTextToSpeech}
                disabled={isLoading || !ttsText.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating... {Math.round(generationProgress * 100)}%
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Generate Speech
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Sounds List */}
      {generatedSounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Sounds</span>
              <Badge variant="secondary">{generatedSounds.length}</Badge>
            </CardTitle>
            <CardDescription>
              Your recently generated audio files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedSounds.slice(0, 5).map((sound) => (
                <div 
                  key={`generated-${sound.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{sound.title}</h4>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {sound.metadata?.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {sound.metadata?.model?.replace('elevenlabs-', '')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(sound.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePlaySound(sound)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={sound.url} download>
                        <Download className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SoundGenerator