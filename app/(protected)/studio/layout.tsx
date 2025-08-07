import { ReactNode } from 'react'

interface StudioLayoutProps {
  children: ReactNode
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      {children}
    </div>
  )
} 