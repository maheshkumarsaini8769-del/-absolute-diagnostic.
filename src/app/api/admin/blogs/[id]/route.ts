import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { blogSchema } from '@/lib/validators'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await context.params

    const blog = await prisma.blog.findUnique({ where: { id } })

    if (!blog) {
      return Response.json({ error: 'Blog not found' }, { status: 404 })
    }

    return Response.json({ blog })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get blog error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params
    const body = await request.json()
    const parsed = blogSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.blog.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Blog not found' }, { status: 404 })
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: parsed.data
    })

    await logAudit(admin.id, 'UPDATE', 'blog', id, blog.title)

    return Response.json({ blog })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update blog error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params

    const existing = await prisma.blog.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Blog not found' }, { status: 404 })
    }

    await prisma.blog.delete({ where: { id } })

    await logAudit(admin.id, 'DELETE', 'blog', id, existing.title)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete blog error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
