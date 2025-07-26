import { ReactNode } from 'react'
import { StudioHeader } from '@/components/studio/header'

interface StudioLayoutProps {
  children: ReactNode
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
} 