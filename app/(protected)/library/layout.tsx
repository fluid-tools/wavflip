import { ReactNode } from 'react'
import { LibraryHeader } from '@/components/library/header'

interface LibraryLayoutProps {
  children: ReactNode
}

export default function LibraryLayout({ children }: LibraryLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <LibraryHeader />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
} 