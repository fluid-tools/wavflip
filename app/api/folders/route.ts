import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { 
  getUserFolders, 
  createFolder, 
  deleteFolder,
  handleDuplicateFolderName 
} from '@/server/vault'

export async function GET() {
  try {
    const session = await requireAuth()
    
    const folders = await getUserFolders(session.user.id)
    
    return NextResponse.json(folders)
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
    const name = formData.get('name') as string
    const parentFolderId = formData.get('parentFolderId') as string | null

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

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
    const folderId = formData.get('folderId') as string

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    }

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