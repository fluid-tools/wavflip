import { type NextRequest, NextResponse } from 'next/server';
import { FolderMoveFormSchema } from '@/lib/contracts/api/folders';
import { requireAuth } from '@/lib/server/auth';
import { moveFolder } from '@/lib/server/vault';

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const parsed = FolderMoveFormSchema.parse({
      folderId: formData.get('folderId'),
      parentFolderId: formData.get('parentFolderId'),
    });
    const parentFolderId =
      parsed.parentFolderId === '' ? null : parsed.parentFolderId;

    await moveFolder(parsed.folderId, parentFolderId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to move folder',
      },
      { status: 500 }
    );
  }
}
