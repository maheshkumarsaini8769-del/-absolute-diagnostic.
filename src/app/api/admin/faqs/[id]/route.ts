import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { faqSchema } from '@/lib/validators'

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params
    const body = await request.json()
    const parsed = faqSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.fAQ.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'FAQ not found' }, { status: 404 })
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: parsed.data
    })

    await logAudit(admin.id, 'UPDATE', 'faq', id, faq.question)

    return Response.json({ faq })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update FAQ error:', error)
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

    const existing = await prisma.fAQ.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'FAQ not found' }, { status: 404 })
    }

    await prisma.fAQ.delete({ where: { id } })

    await logAudit(admin.id, 'DELETE', 'faq', id, existing.question)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete FAQ error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
