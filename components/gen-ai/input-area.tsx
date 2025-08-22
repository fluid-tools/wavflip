'use client';

import {
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  Music,
  Volume2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
import { MUSIC_PROMPTS } from '@/lib/constants/prompts';
import { cn } from '@/lib/utils';

interface InputAreaProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isTTSMode: boolean;
  setIsTTSMode: (mode: boolean) => void;
  isLoading: boolean;
  onGenerate: () => void;
  className?: string;
  extraControls?: ReactNode;
}

export function InputArea({
  prompt,
  setPrompt,
  isTTSMode,
  setIsTTSMode,
  isLoading,
  onGenerate,
  className,
  extraControls,
}: InputAreaProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });

  const modes = [
    { id: false, name: 'Sound Generation', icon: Music },
    { id: true, name: 'Text-to-Speech', icon: Volume2 },
  ];

  const currentMode = modes.find((mode) => mode.id === isTTSMode) || modes[0];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
      adjustHeight(true);
    }
  };

  const handlePromptClick = (promptText: string) => {
    setPrompt(promptText);
    textareaRef.current?.focus();
    // Resize after setting a suggestion
    adjustHeight();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    adjustHeight();
  };

  const handleSubmit = () => {
    onGenerate();
    adjustHeight(true);
  };

  return (
    <div className={cn('flex w-full flex-shrink-0 justify-center', className)}>
      <div className="mx-auto w-full max-w-[600px] px-2 py-3 sm:max-w-[700px] sm:px-4 sm:py-4 md:max-w-[800px] lg:max-w-[900px]">
        <div className="w-full rounded-2xl bg-black/5 p-1.5 pt-4 dark:bg-white/5">
          {/* Prompt Suggestions */}
          {prompt === '' && !isTTSMode && (
            <div className="mx-1 mb-3 sm:mx-2">
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {MUSIC_PROMPTS.slice(0, 12).map((promptText, index) => (
                    <motion.button
                      className="flex-shrink-0 whitespace-nowrap rounded-full border border-black/10 bg-black/5 px-3 py-1.5 text-black/70 text-xs transition-all duration-200 hover:border-black/20 hover:bg-black/10 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
                      key={index}
                      onClick={() => handlePromptClick(promptText)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {promptText}
                    </motion.button>
                  ))}
                </div>
                <ScrollBar className="h-1" orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          <div className="relative w-full">
            <div className="relative flex w-full flex-col">
              <div
                className="w-full overflow-y-auto"
                style={{ maxHeight: '400px' }}
              >
                <Textarea
                  className={cn(
                    'w-full resize-none rounded-xl rounded-b-none border-none bg-black/5 px-4 py-3 text-sm placeholder:text-black/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white/5 dark:text-white dark:placeholder:text-white/70',
                    'min-h-[72px]'
                  )}
                  disabled={isLoading}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isTTSMode
                      ? 'Enter text to convert to speech...'
                      : 'Describe a sound, beat, or musical element...'
                  }
                  ref={textareaRef}
                  value={prompt}
                />
              </div>

              <div className="flex h-14 w-full items-center rounded-b-xl bg-black/5 dark:bg-white/5">
                <div className="absolute right-3 bottom-3 left-3 flex w-[calc(100%-24px)] flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="flex h-8 items-center gap-1 rounded-md pr-2 pl-1 text-xs hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:text-white dark:hover:bg-white/10"
                          variant="ghost"
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-1"
                              exit={{ opacity: 0, y: 5 }}
                              initial={{ opacity: 0, y: -5 }}
                              key={currentMode.id.toString()}
                              transition={{ duration: 0.15 }}
                            >
                              <currentMode.icon className="h-3.5 w-3.5" />
                              {currentMode.name}
                              <ChevronDown className="h-3 w-3 opacity-50" />
                            </motion.div>
                          </AnimatePresence>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className={cn(
                          'min-w-[10rem]',
                          'border-black/10 dark:border-white/10',
                          'bg-gradient-to-b from-white via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800'
                        )}
                      >
                        {modes.map((mode) => (
                          <DropdownMenuItem
                            className="flex items-center justify-between gap-2"
                            key={mode.id.toString()}
                            onSelect={() => setIsTTSMode(mode.id)}
                          >
                            <div className="flex items-center gap-2">
                              <mode.icon className="h-4 w-4 opacity-50" />
                              <span>{mode.name}</span>
                            </div>
                            {currentMode.id === mode.id && (
                              <Check className="h-4 w-4 text-blue-500" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="mx-0.5 h-4 w-px bg-black/10 dark:bg-white/10" />
                    {extraControls}
                    <div className="text-black/60 text-xs dark:text-white/60">
                      {prompt.length}/{isTTSMode ? 2500 : 500}
                    </div>
                  </div>
                  <motion.button
                    aria-label="Send message"
                    className={cn(
                      'rounded-lg bg-black/5 p-2 transition-all duration-200 dark:bg-white/5',
                      'hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:hover:bg-white/10',
                      prompt.trim()
                        ? 'text-black dark:text-white'
                        : 'text-black/30 dark:text-white/30'
                    )}
                    disabled={!prompt.trim() || isLoading}
                    onClick={handleSubmit}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight
                        className={cn(
                          'h-4 w-4 transition-opacity duration-200',
                          prompt.trim() ? 'opacity-100' : 'opacity-30'
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
  );
}
