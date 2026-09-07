import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { testimonialSchema } from '@/lib/validators'

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params
    const body = await request.json()
    const parsed = testimonialSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: parsed.data
    })

    await logAudit(admin.id, 'UPDATE', 'testimonial', id, testimonial.patientName)

    return Response.json({ testimonial })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update testimonial error:', error)
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

    const existing = await prisma.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    await prisma.testimonial.delete({ where: { id } })

    await logAudit(admin.id, 'DELETE', 'testimonial', id, existing.patientName)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete testimonial error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
