import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { Booking, Sample, SampleStatusHistory, Notification } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'bookings:read')
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Find bookings that are home_collection
    const filter: Record<string, any> = { collectionType: 'home_collection' }
    if (status && status !== 'all') {
      filter.status = status
    }

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const todayStr = new Date().toISOString().split('T')[0]
    const todayCount = await Booking.countDocuments({
      collectionType: 'home_collection',
      preferredDate: { $regex: todayStr }
    })
    const pendingCount = await Booking.countDocuments({
      collectionType: 'home_collection',
      status: { $in: ['requested', 'confirmed', 'assigned'] }
    })

    return NextResponse.json({ bookings, todayCount, pendingCount })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List collections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'bookings:write')
    const body = await request.json()
    const { bookingId, action, collectorName, barcode, failureReason, notes } = body

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'Missing bookingId or action' }, { status: 400 })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (action === 'assign') {
      booking.status = 'confirmed'
      booking.notes = `${booking.notes || ''} | Phlebotomist assigned: ${collectorName || admin.name}`
      await booking.save()

      // Also ensure Sample exists and is collection_assigned
      let sample = await Sample.findOne({ bookingId: booking._id })
      if (!sample) {
        sample = await Sample.create({
          sampleId: `APC-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`,
          bookingId: booking._id,
          patientId: booking.patientId,
          patientName: booking.patientName,
          patientPhone: booking.patientPhone,
          status: 'collection_assigned',
          tests: booking.items?.map((i: any) => i.testName) || [],
        })
      } else {
        sample.status = 'collection_assigned'
        await sample.save()
      }

      await Notification.create({
        title: 'Phlebotomist Assigned',
        message: `Phlebotomist ${collectorName || admin.name} assigned for booking ${booking.bookingId} (${booking.patientName}).`,
        type: 'booking_assigned',
        bookingId: booking.id,
      })

      return NextResponse.json({ success: true, message: 'Phlebotomist assigned successfully' })
    }

    if (action === 'on_the_way') {
      booking.notes = `${booking.notes || ''} | Phlebotomist on the way at ${new Date().toLocaleTimeString()}`
      await booking.save()

      await Notification.create({
        title: 'Sample Collector On The Way',
        message: `Our phlebotomist is on the way to your address for sample collection.`,
        type: 'collector_on_the_way',
        bookingId: booking.id,
      })

      return NextResponse.json({ success: true, message: 'Status updated: On the way' })
    }

    if (action === 'collected') {
      booking.status = 'sample_collected'
      await booking.save()

      let sample = await Sample.findOne({ bookingId: booking._id })
      if (sample) {
        const oldStatus = sample.status
        sample.status = 'collected'
        sample.barcode = barcode || `BC-${sample.sampleId.slice(-6)}`
        sample.collectedAt = new Date()
        await sample.save()

        await SampleStatusHistory.create({
          sampleId: sample._id,
          oldStatus,
          newStatus: 'collected',
          changedBy: admin._id,
          changedByName: admin.name,
          notes: notes || 'Blood sample successfully drawn at patient doorstep',
        })
      }

      await Notification.create({
        title: 'Sample Successfully Collected',
        message: `Sample for ${booking.patientName} has been collected and is in transit to the testing laboratory.`,
        type: 'sample_collected',
        bookingId: booking.id,
      })

      return NextResponse.json({ success: true, message: 'Sample collection confirmed' })
    }

    if (action === 'failed') {
      booking.status = 'cancelled'
      booking.notes = `${booking.notes || ''} | Collection failed: ${failureReason || 'Patient unavailable'}`
      await booking.save()

      let sample = await Sample.findOne({ bookingId: booking._id })
      if (sample) {
        sample.status = 'rejected'
        await sample.save()
      }

      return NextResponse.json({ success: true, message: 'Collection marked failed/rescheduled' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update collection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
