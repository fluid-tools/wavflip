import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import {
  getPresignedImageUrlForProject,
  getProjectOr404,
  requireProjectOwnership,
} from '@/lib/server/vault';
import {
  bustPresignedImageCache,
  uploadProjectImage,
} from '@/lib/storage/s3-storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;

    const project = await getProjectOr404(projectId);
    requireProjectOwnership(project, session.user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file?.type.startsWith('image/')) {
      return Response.json(
        { success: false, error: 'Invalid image file' },
        { status: 400 }
      );
    }

    // Use refactored S3 upload function
    const uploadResult = await uploadProjectImage(file, projectId);

    if (!uploadResult.success) {
      return Response.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      );
    }

    // Bust the Redis cache for this project's presigned URL
    await bustPresignedImageCache(projectId);

    await (await import('@/lib/server/vault')).setProjectImageKey(
      projectId,
      uploadResult.filename!
    );

    return Response.json({
      success: true,
      resourceKey: uploadResult.filename,
    });
  } catch (_error) {
    return Response.json(
      {
        success: false,
        error: 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;

    // Use resource-first helper to enforce ownership and return presigned URL
    const signedUrl = await getPresignedImageUrlForProject(projectId, {
      requireOwnerUserId: session.user.id,
    });
    if (!signedUrl) {
      return Response.json(
        { success: false, error: 'No image' },
        { status: 404 }
      );
    }
    return Response.json({ success: true, signedUrl });
  } catch (_error) {
    return Response.json(
      { success: false, error: 'Failed to get presigned URL' },
      { status: 500 }
    );
  }
}
