'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2, Send, Music, Volume2, ArrowRight, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MUSIC_PROMPTS } from '@/lib/constants/prompts'
import { motion, AnimatePresence } from 'motion/react'



interface InputAreaProps {
  prompt: string
  setPrompt: (prompt: string) => void
  isTTSMode: boolean
  setIsTTSMode: (mode: boolean) => void
  isLoading: boolean
  onGenerate: () => void
  className?: string
}

export function InputArea({
  prompt,
  setPrompt,
  isTTSMode,
  setIsTTSMode,
  isLoading,
  onGenerate,
  className
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [textareaHeight, setTextareaHeight] = useState(72)

  const modes = [
    { id: false, name: 'Sound Generation', icon: Music },
    { id: true, name: 'Text-to-Speech', icon: Volume2 }
  ]

  const currentMode = modes.find(mode => mode.id === isTTSMode) || modes[0]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onGenerate()
    }
  }

  const handlePromptClick = (promptText: string) => {
    setPrompt(promptText)
    textareaRef.current?.focus()
  }

  const adjustHeight = (reset?: boolean) => {
    if (textareaRef.current) {
      if (reset) {
        setTextareaHeight(72)
        textareaRef.current.style.height = '72px'
      } else {
        textareaRef.current.style.height = 'auto'
        const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 72), 300)
        textareaRef.current.style.height = `${newHeight}px`
        setTextareaHeight(newHeight)
      }
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    adjustHeight()
  }

  const handleSubmit = () => {
    onGenerate()
    adjustHeight(true)
  }

  return (
    <div className={cn("flex-shrink-0", className)}>
      <div className="w-full max-w-4xl mx-auto px-4 py-4">
        <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-1.5 pt-4">
          {/* Prompt Suggestions */}
          {prompt === '' && !isTTSMode && (
            <div className="mb-3 mx-2">
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {MUSIC_PROMPTS.slice(0, 12).map((promptText, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePromptClick(promptText)}
                      className="flex-shrink-0 px-3 py-1.5 text-xs bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white rounded-full transition-all duration-200 whitespace-nowrap border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
                    >
                      {promptText}
                    </motion.button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-1" />
              </ScrollArea>
            </div>
          )}

          <div className="relative">
            <div className="relative flex flex-col">
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "400px" }}
              >
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  placeholder={isTTSMode ? "Enter text to convert to speech..." : "Describe a sound, beat, or musical element..."}
                  className={cn(
                    "w-full rounded-xl rounded-b-none px-4 py-3 bg-black/5 dark:bg-white/5 border-none dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm",
                    "min-h-[72px]"
                  )}
                  style={{ height: `${textareaHeight}px` }}
                  onKeyDown={handleKeyDown}
                  onChange={handleTextChange}
                  disabled={isLoading}
                />
              </div>

              <div className="h-14 bg-black/5 dark:bg-white/5 rounded-b-xl flex items-center">
                <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between w-[calc(100%-24px)]">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-1 h-8 pl-1 pr-2 text-xs rounded-md dark:text-white hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentMode.id.toString()}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1"
                            >
                              <currentMode.icon className="w-3.5 h-3.5" />
                              {currentMode.name}
                              <ChevronDown className="w-3 h-3 opacity-50" />
                            </motion.div>
                          </AnimatePresence>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className={cn(
                          "min-w-[10rem]",
                          "border-black/10 dark:border-white/10",
                          "bg-gradient-to-b from-white via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800"
                        )}
                      >
                        {modes.map((mode) => (
                          <DropdownMenuItem
                            key={mode.id.toString()}
                            onSelect={() => setIsTTSMode(mode.id)}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <mode.icon className="w-4 h-4 opacity-50" />
                              <span>{mode.name}</span>
                            </div>
                            {currentMode.id === mode.id && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" />
                    <div className="text-xs text-black/60 dark:text-white/60">
                      {prompt.length}/{isTTSMode ? 2500 : 500}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    className={cn(
                      "rounded-lg p-2 bg-black/5 dark:bg-white/5 transition-all duration-200",
                      "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                      prompt.trim() 
                        ? "text-black dark:text-white" 
                        : "text-black/30 dark:text-white/30"
                    )}
                    aria-label="Send message"
                    disabled={!prompt.trim() || isLoading}
                    onClick={handleSubmit}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight
                        className={cn(
                          "w-4 h-4 transition-opacity duration-200",
                          prompt.trim() ? "opacity-100" : "opacity-30"
                        )}
                      />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 