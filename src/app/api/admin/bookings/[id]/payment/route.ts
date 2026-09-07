import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requirePermission(request, 'payments:write')
    const { id } = await params
    const body = await request.json()

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    if (body.paidAmount !== undefined) updates.paidAmount = body.paidAmount
    if (body.discount !== undefined) updates.discount = body.discount
    if (body.paymentStatus !== undefined) updates.paymentStatus = body.paymentStatus
    if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod

    if (body.paidAmount !== undefined && body.totalAmount !== undefined) {
      if (body.paidAmount >= body.totalAmount) {
        updates.paymentStatus = 'paid'
      } else if (body.paidAmount > 0) {
        updates.paymentStatus = 'partial'
      }
    }

    const updated = await prisma.booking.update({ where: { id }, data: updates })

    await logAudit(
      admin.id, 'PAYMENT_UPDATE', 'booking', id,
      `Payment updated for ${booking.bookingId}`,
      JSON.stringify({ paidAmount: booking.paidAmount, paymentStatus: booking.paymentStatus }),
      JSON.stringify(updates)
    )

    return Response.json({ booking: updated })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Payment update error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
