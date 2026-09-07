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

    const report = await prisma.report.findUnique({
      where: { id }
    })

    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    // Populate patient manually
    const patient = report.patientId
      ? await prisma.patient.findUnique({ where: { id: report.patientId } })
      : null

    return Response.json({ report: { ...report, patient } })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get report error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params
    const body = await request.json()

    const existing = await prisma.report.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.status) data.status = body.status
    if (body.fileUrl) data.fileUrl = body.fileUrl
    if (body.fileName) data.fileName = body.fileName

    const report = await prisma.report.update({
      where: { id },
      data,
    })

    const patient = report.patientId
      ? await prisma.patient.findUnique({ where: { id: report.patientId } })
      : null

    await logAudit(admin.id, 'UPDATE', 'report', id, JSON.stringify(data))

    return Response.json({ report: { ...report, patient } })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update report error:', error)
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

    const existing = await prisma.report.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    await prisma.report.delete({ where: { id } })

    await logAudit(admin.id, 'DELETE', 'report', id, existing.testName)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete report error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
