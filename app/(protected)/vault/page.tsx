import { VaultView } from '@/app/(protected)/vault/client'

export default async function VaultPage() {
  // No need to fetch session or prefetch data here
  // The layout already handles common data prefetching
  // The client component will use the hydrated data from the layout
  
  return <VaultView />
} 