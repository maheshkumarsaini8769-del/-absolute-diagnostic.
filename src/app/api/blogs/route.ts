import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    return Response.json(blogs)
  } catch (error) {
    console.error('List public blogs error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
