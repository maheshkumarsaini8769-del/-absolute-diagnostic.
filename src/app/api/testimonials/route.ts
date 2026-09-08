import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(testimonials)
  } catch (error) {
    console.error('List public testimonials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patientName, content, rating } = body

    if (!patientName || typeof patientName !== 'string' || !patientName.trim()) {
      return NextResponse.json({ error: 'Please enter your name' }, { status: 400 })
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Please enter your review' }, { status: 400 })
    }

    const numRating = Number(rating) || 5
    const clampedRating = Math.max(1, Math.min(5, Math.round(numRating)))

    const newTestimonial = await prisma.testimonial.create({
      data: {
        patientName: patientName.trim(),
        content: content.trim(),
        rating: clampedRating,
        isActive: true,
        isFeatured: true,
      }
    })

    return NextResponse.json({ success: true, testimonial: newTestimonial }, { status: 201 })
  } catch (error: any) {
    console.error('Submit testimonial error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to submit review' }, { status: 500 })
  }
}
