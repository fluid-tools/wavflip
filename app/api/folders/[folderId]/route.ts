import { type NextRequest, NextResponse } from 'next/server';
import { FolderGetResponseSchema } from '@/lib/contracts/api/folders';
import { requireAuth } from '@/lib/server/auth';
import { getFolderWithContents } from '@/lib/server/vault';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const session = await requireAuth();
    const { folderId } = await params;

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    const folder = await getFolderWithContents(folderId, session.user.id);

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json(FolderGetResponseSchema.parse(folder));
  } catch (error) {
    console.error('Failed to fetch folder:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch folder',
      },
      { status: 500 }
    );
  }
}
