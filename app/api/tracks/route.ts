import { type NextRequest, NextResponse } from 'next/server';
import {
  TrackCreateFormSchema,
  TrackCreateResponseSchema,
  TrackDeleteFormSchema,
  TrackDeleteResponseSchema,
  TrackRenameFormSchema,
  TrackRenameResponseSchema,
} from '@/lib/contracts/api/tracks';
import { requireAuth } from '@/lib/server/auth';
import {
  createTrack,
  createTrackVersion,
  deleteTrack,
  renameTrack,
  setActiveVersion,
} from '@/lib/server/vault';
import { bustPresignedTrackCache } from '@/lib/storage/s3-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const form = await request.formData();
    const { name, projectId, fileKey, fileSize, mimeType, duration } =
      TrackCreateFormSchema.parse({
        name: form.get('name'),
        projectId: form.get('projectId'),
        fileKey: form.get('fileKey'),
        fileSize: form.get('fileSize'),
        mimeType: form.get('mimeType'),
        duration: form.get('duration'),
      });

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Track name is required' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!fileKey) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    // Create track
    const track = await createTrack({
      name: name.trim(),
      projectId,
      userId: session.user.id,
      order: 0,
    });

    // Create first version with the uploaded file
    const version = await createTrackVersion({
      trackId: track.id,
      fileKey,
      size: fileSize ?? 0,
      duration: duration ?? 0,
      mimeType: mimeType ?? 'audio/mpeg',
    });

    // Set the active version for the track
    await setActiveVersion(track.id, version.id, session.user.id);

    // Compose full track-with-versions payload for clients that expect versions array
    const fullTrack = {
      ...track,
      versions: [version],
      activeVersion: version,
    };

    return NextResponse.json(
      TrackCreateResponseSchema.parse({ success: true, track: fullTrack })
    );
  } catch (error) {
    console.error('Failed to create track:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create track',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const { trackId } = TrackDeleteFormSchema.parse({
      trackId: formData.get('trackId'),
    });

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    await deleteTrack(trackId, session.user.id);

    // Bust the cache for this track
    await bustPresignedTrackCache(trackId);

    return NextResponse.json(
      TrackDeleteResponseSchema.parse({ success: true })
    );
  } catch (error) {
    console.error('Failed to delete track:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete track',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const { trackId, name } = TrackRenameFormSchema.parse({
      trackId: formData.get('trackId'),
      name: formData.get('name'),
    });

    await renameTrack(trackId, name.trim(), session.user.id);

    return NextResponse.json(
      TrackRenameResponseSchema.parse({ success: true })
    );
  } catch (error) {
    console.error('Failed to rename track:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to rename track',
      },
      { status: 500 }
    );
  }
}
