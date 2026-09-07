import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    let booking = await prisma.booking.findFirst({
      where: { bookingId: id },
      include: { items: true }
    })

    if (!booking && /^[0-9a-fA-F]{24}$/.test(id)) {
      booking = await prisma.booking.findFirst({
        where: { id },
        include: { items: true }
      })
    }

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 })
    }

    return Response.json({ booking })
  } catch (error) {
    console.error('Get booking error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
