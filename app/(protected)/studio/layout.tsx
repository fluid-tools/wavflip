import { ReactNode } from 'react'
import { StudioHeader } from '@/components/studio/header'

interface StudioLayoutProps {
  children: ReactNode
}

export default function StudioLayout({ children }: StudioLayoutProps) {

  return (
    <div className="flex flex-col h-full">
      <div className="fixed pt-12 inset-0 flex flex-col bg-background">
        {children}
      </div>
    </div>
  )
} 