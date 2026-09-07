import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (type) where.collectionType = type

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { items: true, patient: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.booking.count({ where })
    ])

    return Response.json({ bookings, total })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List bookings error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    const validStatuses = [
      'requested', 'confirmed', 'sample_collected',
      'processing', 'report_ready', 'completed', 'cancelled'
    ]

    if (!body.id || !body.status) {
      return Response.json({ error: 'id and status are required' }, { status: 400 })
    }

    if (!validStatuses.includes(body.status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }

    const booking = await prisma.booking.update({
      where: { id: body.id },
      data: { status: body.status },
      include: { items: true }
    })

    return Response.json({ booking })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update booking status error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
