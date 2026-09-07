import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    return Response.json(testimonials)
  } catch (error) {
    console.error('List public testimonials error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
