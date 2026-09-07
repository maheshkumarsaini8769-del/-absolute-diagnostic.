import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = pathSegments.join('/')

    // Security: only allow access to uploads/reports directory
    const resolved = path.resolve('uploads', 'reports', ...pathSegments)
    const uploadsDir = path.resolve('uploads', 'reports')
    if (!resolved.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const buffer = fs.readFileSync(resolved)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.basename(resolved)}"`,
        'Cache-Control': 'private, max-age=900',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Error serving file' }, { status: 500 })
  }
}
