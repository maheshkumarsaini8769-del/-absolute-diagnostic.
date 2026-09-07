import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { blogSchema } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return Response.json({ blogs })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List blogs error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = blogSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const blog = await prisma.blog.create({ data: parsed.data })

    await logAudit(admin.id, 'CREATE', 'blog', blog.id, blog.title)

    return Response.json({ blog }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create blog error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
