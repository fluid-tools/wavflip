import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'
import { 
  getUserFolders, 
  createFolder, 
  deleteFolder,
  handleDuplicateFolderName 
} from '@/lib/server/vault'
import { FolderCreateFormSchema, FolderDeleteFormSchema, FoldersListResponseSchema } from '@/lib/contracts/api/folders'

export async function GET() {
  try {
    const session = await requireAuth()
    
    const folders = await getUserFolders(session.user.id)
    // Validate API response
    return NextResponse.json(FoldersListResponseSchema.parse(folders))
  } catch (error) {
    console.error('Failed to fetch folders:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const { name, parentFolderId } = FolderCreateFormSchema.parse({
      name: formData.get('name'),
      parentFolderId: formData.get('parentFolderId'),
    })

    // Handle duplicate names by adding suffix
    const folderName = await handleDuplicateFolderName(
      name, 
      parentFolderId || null, 
      session.user.id
    )

    const folder = await createFolder({
      name: folderName,
      parentFolderId: parentFolderId || null,
      userId: session.user.id,
      order: 0,
    })
    
    return NextResponse.json({ success: true, folder })
  } catch (error) {
    console.error('Failed to create folder:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()
    const { folderId } = FolderDeleteFormSchema.parse({
      folderId: formData.get('folderId'),
    })

    const { parentFolderId } = await deleteFolder(folderId, session.user.id)

    return NextResponse.json({ success: true, parentFolderId })
  } catch (error) {
    console.error('Failed to delete folder:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete folder' },
      { status: 500 }
    )
  }
} 