import { ReactNode } from 'react'
// import { StudioHeader } from '@/components/studio/header'

interface StudioLayoutProps {
  children: ReactNode
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col bg-background h-full w-full">
        {children}
      </div>
    </div>
  )
} 