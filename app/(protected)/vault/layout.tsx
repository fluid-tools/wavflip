import { ReactNode } from 'react'

interface VaultLayoutProps {
  children: ReactNode
}

export default function VaultLayout({ children }: VaultLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  )
} 