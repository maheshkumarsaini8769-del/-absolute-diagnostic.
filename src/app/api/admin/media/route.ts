import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (category) where.category = category

    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return Response.json({ media })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List media error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()

    if (!body.filename || !body.originalName || !body.category || !body.filePath) {
      return Response.json(
        { error: 'filename, originalName, category, and filePath are required' },
        { status: 400 }
      )
    }

    const media = await prisma.media.create({
      data: {
        filename: body.filename,
        originalName: body.originalName,
        altText: body.altText || null,
        category: body.category,
        filePath: body.filePath,
        fileSize: body.fileSize || null,
        mimeType: body.mimeType || null
      }
    })

    return Response.json({ media }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create media error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
