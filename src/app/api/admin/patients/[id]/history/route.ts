import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth'
import { Sample } from '@/models'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(request, 'patients:read')
    const { id } = await params

    const patient = await prisma.patient.findUnique({ where: { id } })
    if (!patient) {
      return Response.json({ error: 'Patient not found' }, { status: 404 })
    }

    const [bookings, reports, samples] = await Promise.all([
      prisma.booking.findMany({
        where: { patientId: id },
        sort: { createdAt: -1 },
      }),
      prisma.report.findMany({
        where: { patientId: id },
        sort: { reportDate: -1 },
      }),
      Sample.find({ patientId: id }).sort({ createdAt: -1 }).lean(),
    ])

    const timeline = [
      ...bookings.map((b: any) => ({
        type: 'booking',
        date: b.createdAt,
        title: `Booking ${b.bookingId}`,
        status: b.status,
        details: { items: b.items, totalAmount: b.totalAmount },
      })),
      ...reports.map((r: any) => ({
        type: 'report',
        date: r.reportDate || r.uploadedAt,
        title: r.testName,
        status: r.status,
        details: { fileName: r.fileName },
      })),
      ...samples.map((s: any) => ({
        type: 'sample',
        date: s.createdAt,
        title: `Sample ${s.sampleId}`,
        status: s.status,
        details: { tests: s.tests },
      })),
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return Response.json({
      patient: { id: patient._id?.toString() || patient.id, name: patient.name, phone: patient.phone, age: patient.age, source: (patient as any).source },
      bookings: bookings.length,
      reports: reports.length,
      samples: samples.length,
      timeline,
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Patient history error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
