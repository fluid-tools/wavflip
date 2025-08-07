import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }        ) {
  const { key } = await params
  const range = req.headers.get('range')

  const s3 = new S3Client({ region: process.env.AWS_REGION })
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Range: range || undefined,
  })

  const s3Res = await s3.send(command)
  const { ContentLength, ContentRange, ContentType, AcceptRanges } = s3Res

  return NextResponse.json({
    status: range ? 206 : 200,
    headers: {
      'Content-Type': ContentType,
      'Content-Length': ContentLength?.toString() || '',
      'Accept-Ranges': AcceptRanges || 'bytes',
      ...(ContentRange ? { 'Content-Range': ContentRange } : {}),
    },
  })
}
