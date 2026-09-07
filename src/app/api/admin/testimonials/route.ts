import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { testimonialSchema } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return Response.json({ testimonials })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List testimonials error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = testimonialSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const testimonial = await prisma.testimonial.create({ data: parsed.data })

    await logAudit(admin.id, 'CREATE', 'testimonial', testimonial.id, testimonial.patientName)

    return Response.json({ testimonial }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create testimonial error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
