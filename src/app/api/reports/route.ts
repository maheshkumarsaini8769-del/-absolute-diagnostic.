import { prisma } from '@/lib/prisma'
import { getPatientFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const patient = await getPatientFromRequest(request)
    if (!patient) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Collect all patient IDs associated with this patient's email or phone
    const email = patient.verifiedEmail || patient.email || ''
    const patientIds = [patient.id]
    const relatedPatients = await prisma.patient.findMany({
      where: {
        OR: [
          ...(email ? [{ email }, { verifiedEmail: email }] : []),
          ...(patient.phone ? [{ phone: patient.phone }] : [])
        ]
      },
      select: { id: true }
    })
    relatedPatients.forEach((p: any) => {
      if (p.id && !patientIds.includes(p.id)) patientIds.push(p.id)
    })

    // Find all bookings for these patients, email, or phone
    const patientBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { patientId: { in: patientIds } },
          ...(email ? [{ patientEmail: email }] : []),
          ...(patient.phone ? [{ patientPhone: { contains: patient.phone.slice(-10) } }] : [])
        ]
      },
      select: { id: true, bookingId: true, createdAt: true }
    })
    const bookingIds = patientBookings.map((b: any) => b.id).filter(Boolean)
    const bookingMap = new Map(patientBookings.map((b: any) => [b.id, b]))

    // Build comprehensive report query
    const reportOrConditions: any[] = [
      { patientId: { in: patientIds } },
      { matchedPatientId: { in: patientIds } }
    ]
    if (bookingIds.length > 0) {
      reportOrConditions.push({ bookingId: { in: bookingIds } })
    }
    if (patient.phone) {
      reportOrConditions.push({ extractedMobile: { contains: patient.phone.slice(-10) } })
      reportOrConditions.push({ patientPhone: { contains: patient.phone.slice(-10) } })
    }

    const reports = await prisma.report.findMany({
      where: {
        OR: reportOrConditions,
        isDeleted: { not: true }
      },
      orderBy: { reportDate: 'desc' }
    })

    const reportList = reports.map((r: any) => {
      const booking = r.bookingId ? bookingMap.get(r.bookingId) : null
      return {
        id: r.id,
        testName: r.testName,
        reportDate: r.reportDate,
        fileName: r.fileName,
        fileUrl: r.fileUrl,
        status: r.status,
        uploadedAt: r.uploadedAt,
        analysisData: r.analysisData || null,
        bookingId: (booking as any)?.bookingId || null,
        collectionDate: (booking as any)?.createdAt || null,
      }
    })

    return Response.json({ reports: reportList })
  } catch (error) {
    console.error('List public reports error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
