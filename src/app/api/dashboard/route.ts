import { prisma } from '@/lib/prisma'
import { verifySessionToken } from '@/lib/zenuxs-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.sessionCheck) {
      const cookieHeader = request.headers.get('Cookie')
      const match = cookieHeader?.match(/session_token=([^;]+)/)
      const token = match?.[1]
      if (!token) return Response.json({ error: 'No session' }, { status: 401 })

      const payload = verifySessionToken(token)
      if (!payload || payload.type !== 'patient' || !payload.patientId) {
        return Response.json({ error: 'Invalid session' }, { status: 401 })
      }

      const patient = await prisma.patient.findUnique({ where: { id: payload.patientId } })
      if (!patient) return Response.json({ error: 'Patient not found' }, { status: 404 })

      return await fetchDashboardData(patient)
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Dashboard error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function fetchDashboardData(patient: any) {
  const bookings = await prisma.booking.findMany({
    where: { patientId: patient.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  })

  const reports = await prisma.report.findMany({
    where: { patientId: patient.id },
    orderBy: { reportDate: 'desc' }
  })

  const reportBookingIds = reports.map((r: any) => r.bookingId).filter(Boolean) as string[]
  const reportBookings = reportBookingIds.length > 0 ? await prisma.booking.findMany({
    where: { id: { in: reportBookingIds } },
    select: { id: true, bookingId: true }
  }) : []
  const reportBookingMap = new Map(reportBookings.map((b: any) => [b.id, b.bookingId]))

  const reportList = reports.map((r: any) => ({
    id: r.id,
    testName: r.testName,
    reportDate: r.reportDate,
    status: r.status,
    fileName: r.fileName,
    bookingId: reportBookingMap.get(r.bookingId || '') || null,
    collectionDate: null,
  }))

  return Response.json({
    success: true,
    patientName: patient.name,
    bookings: bookings.map((b: any) => ({
      id: b.id,
      bookingId: b.bookingId,
      patientName: b.patientName,
      collectionType: b.collectionType,
      preferredDate: b.preferredDate,
      status: b.status,
      totalAmount: b.totalAmount,
      isNightBooking: b.isNightBooking,
      createdAt: b.createdAt,
      items: b.items.map((i: any) => ({ testName: i.testName, testPrice: i.testPrice })),
    })),
    reports: reportList
  })
}
