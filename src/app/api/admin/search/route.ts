import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth'
import { Sample } from '@/models'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'bookings:read')
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return Response.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
    }

    const regex = { $regex: q, $options: 'i' }
    const results: Record<string, unknown[]> = {}

    const patients = await prisma.patient.findMany({
      where: {
        OR: [{ name: regex }, { phone: regex }],
      },
      take: 10,
    })
    results.patients = patients.map((p: any) => ({ id: p._id?.toString() || p.id, name: p.name, phone: p.phone, type: 'patient' }))

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { bookingId: regex },
          { patientName: regex },
          { patientPhone: regex },
        ],
      },
      take: 10,
    })
    results.bookings = bookings.map((b: any) => ({ id: b._id?.toString() || b.id, bookingId: b.bookingId, patientName: b.patientName, status: b.status, type: 'booking' }))

    const reports = await prisma.report.findMany({
      where: {
        OR: [
          { testName: regex },
          { fileName: regex },
          { extractedPatientId: regex },
        ],
      },
      take: 10,
    })
    results.reports = reports.map((r: any) => ({ id: r._id?.toString() || r.id, testName: r.testName, fileName: r.fileName, status: r.status, type: 'report' }))

    const samples = await Sample.find({
      $or: [
        { sampleId: regex },
        { patientName: regex },
        { patientPhone: regex },
      ],
    }).limit(10).lean()
    results.samples = samples.map((s: any) => ({ id: s._id?.toString(), sampleId: s.sampleId, patientName: s.patientName, status: s.status, type: 'sample' }))

    const tests = await prisma.test.findMany({
      where: {
        OR: [{ name: regex }, { slug: regex }],
      },
      take: 10,
    })
    results.tests = tests.map((t: any) => ({ id: t._id?.toString() || t.id, name: t.name, price: t.price, type: 'test' }))

    const packages = await prisma.package.findMany({
      where: {
        OR: [{ name: regex }, { slug: regex }],
      },
      take: 10,
    })
    results.packages = packages.map((p: any) => ({ id: p._id?.toString() || p.id, name: p.name, price: p.price, type: 'package' }))

    return Response.json(results)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Global search error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
