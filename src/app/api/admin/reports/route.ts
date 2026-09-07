import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const bookingId = searchParams.get('bookingId')

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (bookingId) where.bookingId = bookingId

    const reports = await prisma.report.findMany({
      where,
      orderBy: { uploadedAt: 'desc' }
    })

    // Manually populate patient (skip reports without patientId)
    const patientIds = [...new Set(reports.map((r: any) => r.patientId).filter(Boolean))]
    const patients = patientIds.length > 0
      ? await prisma.patient.findMany({ where: { id: { in: patientIds } } })
      : []
    const patientMap = new Map(patients.map((p: any) => [p.id, p]))

    const enriched = reports.map((r: any) => ({
      ...r,
      patient: patientMap.get(r.patientId) || null,
    }))

    return Response.json({ reports: enriched })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List reports error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    if (!body.patientId || !body.testName || !body.fileUrl || !body.fileName) {
      return Response.json(
        { error: 'patientId, testName, fileUrl, and fileName are required' },
        { status: 400 }
      )
    }

    const report = await prisma.report.create({
      data: {
        patientId: body.patientId,
        bookingId: body.bookingId || null,
        testName: body.testName,
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        status: body.status || 'uploaded'
      },
      include: { patient: true }
    })

    await logAudit(admin.id, 'CREATE', 'report', report.id, report.testName)

    return Response.json({ report }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create report error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
