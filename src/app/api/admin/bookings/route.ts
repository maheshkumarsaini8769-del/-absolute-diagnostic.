import { requireAdmin } from '@/lib/auth'
import { Booking, Report, Patient, Notification } from '@/models'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import mongoose from 'mongoose'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const query: any = {}

    if (status && status !== 'all') {
      if (status === 'new' || status === 'pending') query.status = 'requested'
      else if (status === 'collection') query.status = 'sample_collected'
      else if (status === 'received') query.status = 'sample_received'
      else if (status === 'processing') query.status = 'processing'
      else if (status === 'report_pending') query.status = { $in: ['processing', 'sample_received'] }
      else if (status === 'verification_pending') query.status = 'under_review'
      else if (status === 'ready') query.status = { $in: ['report_ready', 'ready'] }
      else query.status = status
    }

    if (type) query.collectionType = type

    const [bookingsRaw, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query)
    ])

    // Collect booking IDs and patient IDs for bulk population
    const bookingIds = bookingsRaw.map((b: any) => b._id)
    const patientIds = [...new Set(bookingsRaw.map((b: any) => b.patientId).filter(Boolean))]

    const [reports, patients] = await Promise.all([
      Report.find({
        $or: [
          { bookingId: { $in: bookingIds } },
          { _id: { $in: bookingsRaw.map((b: any) => b.reportId).filter(Boolean) } }
        ],
        isDeleted: { $ne: true }
      }).lean(),
      Patient.find({ _id: { $in: patientIds } }).lean()
    ])

    const reportMap = new Map<string, any>()
    for (const r of reports) {
      if (r.bookingId) reportMap.set(r.bookingId.toString(), r)
      reportMap.set((r as any)._id.toString(), r)
    }

    const patientMap = new Map<string, any>()
    for (const p of patients) {
      patientMap.set((p as any)._id.toString(), p)
    }

    const bookings = bookingsRaw.map((b: any) => {
      const bIdStr = b._id.toString()
      const rep = (b.reportId ? reportMap.get(b.reportId.toString()) : null) || reportMap.get(bIdStr) || null
      const pat = b.patientId ? patientMap.get(b.patientId.toString()) : null

      return {
        ...b,
        id: bIdStr,
        patient: pat,
        report: rep ? {
          ...rep,
          id: (rep as any)._id.toString(),
        } : null,
      }
    })

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
      'requested', 'confirmed', 'sample_collected', 'sample_received',
      'processing', 'report_pending', 'under_review', 'verified',
      'report_ready', 'ready', 'patient_notified', 'completed', 'cancelled'
    ]

    if (!body.id || !body.status) {
      return Response.json({ error: 'id and status are required' }, { status: 400 })
    }

    if (!validStatuses.includes(body.status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }

    const booking = await Booking.findById(body.id)
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 })
    }

    const oldStatus = booking.status
    booking.status = body.status

    if (body.notes) {
      booking.notes = body.notes
    }

    if (!booking.timeline) booking.timeline = []
    const adminName = admin.name || admin.email || 'Admin'
    booking.timeline.push({
      stage: body.status,
      timestamp: new Date(),
      performedBy: adminName,
      note: body.note || `Status updated to ${body.status.replace(/_/g, ' ')}`,
    })

    await booking.save()

    // Log audit
    await logAudit(
      admin.id,
      'BOOKING_STATUS_CHANGE',
      'booking',
      booking._id.toString(),
      `Status changed from ${oldStatus} to ${body.status}`,
      oldStatus,
      body.status
    )

    // If marked as patient_notified, trigger notification
    if (body.status === 'patient_notified' && booking.patientId) {
      try {
        const patient = await Patient.findById(booking.patientId).lean()
        const email = (patient as any)?.verifiedEmail || (patient as any)?.email || booking.patientEmail
        if (email) {
          await sendEmail(
            email,
            'Your Report is Ready - Absolute Diagnostic',
            `<!DOCTYPE html><html><body><h3>Dear ${(patient as any)?.name || booking.patientName},</h3><p>Your diagnostic test reports for Booking #${booking.bookingId} are ready.</p><p><a href="https://lab-app-green.vercel.app/reports">View Report Online</a></p></body></html>`
          )
        }
        await Notification.create({
          bookingId: booking.bookingId,
          type: 'report_ready',
          title: 'Your Diagnostic Report is Ready',
          message: `Your reports for Booking #${booking.bookingId} are available to download.`,
          isRead: false,
        })
      } catch (err) {
        console.warn('Patient notification error:', err)
      }
    }

    return Response.json({
      success: true,
      booking: {
        ...booking.toObject(),
        id: booking._id.toString(),
      }
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update booking status error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
