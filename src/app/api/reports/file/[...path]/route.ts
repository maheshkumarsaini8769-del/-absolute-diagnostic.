import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const fileName = pathSegments[pathSegments.length - 1] || 'report.pdf'

    // Check candidate directories
    const candidates = [
      path.resolve(process.cwd(), 'public', 'uploads', 'reports', ...pathSegments),
      path.resolve(process.cwd(), 'uploads', 'reports', ...pathSegments),
      path.resolve('/tmp', 'uploads', 'reports', ...pathSegments),
    ]

    let foundPath: string | null = null
    for (const p of candidates) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        foundPath = p
        break
      }
    }

    if (!foundPath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const buffer = fs.readFileSync(/*turbopackIgnore: true*/ foundPath)
    const ext = path.extname(foundPath).toLowerCase()
    let contentType = 'application/pdf'
    if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=900',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Error serving file' }, { status: 500 })
  }
}
