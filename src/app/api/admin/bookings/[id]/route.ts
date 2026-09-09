import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await context.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { items: true, patient: true }
    })

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 })
    }

    return Response.json({ booking })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get booking error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params
    const body = await request.json()

    const existing = await prisma.booking.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Booking not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.status) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes

    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: { items: true, patient: true }
    })

    await logAudit(admin.id, 'UPDATE', 'booking', id, JSON.stringify(data))

    return Response.json({ booking })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update booking error:', error)
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

    const existing = await prisma.booking.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Booking not found' }, { status: 404 })
    }

    await prisma.booking.delete({ where: { id } })
    await logAudit(admin.id, 'DELETE', 'booking', id, existing.bookingId)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete booking error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
