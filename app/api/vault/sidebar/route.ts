// This route is deprecated in favor of /api/vault/tree. Keeping a stub that returns 410 Gone to catch stragglers.
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Deprecated. Use /api/vault/tree' }, { status: 410 })
}