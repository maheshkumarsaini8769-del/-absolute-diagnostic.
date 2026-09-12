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
        select: { id: true, name: true, phone: true }
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
          status: r.status,
          fileName: r.fileName,
          fileUrl: r.fileUrl,
          analysisData: r.analysisData || null,
          bookingId: (booking as any)?.bookingId || null,
          collectionDate: (booking as any)?.createdAt || null,
        }
      })

      return Response.json({ success: true, reports: reportList, patientName: patient.name, patientPhone: patient.phone })
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Report verify error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
