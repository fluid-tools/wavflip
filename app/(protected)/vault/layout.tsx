import { ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface VaultLayoutProps {
  children: ReactNode
}

export default function VaultLayout({ children }: VaultLayoutProps) {
  return (
    <div className="h-full w-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="pb-24">
          {children}
        </div>
      </ScrollArea>
    </div>
  )
} 