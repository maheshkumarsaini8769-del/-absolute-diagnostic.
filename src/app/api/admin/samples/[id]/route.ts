import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { Sample, SampleStatusHistory } from '@/models'

const VALID_TRANSITIONS: Record<string, string[]> = {
  booked: ['collection_assigned', 'collected'],
  collection_assigned: ['collected', 'rejected'],
  collected: ['received', 'rejected'],
  received: ['processing', 'rejected', 'recollection_requested'],
  processing: ['report_under_review', 'rejected', 'received'],
  report_under_review: ['report_ready', 'processing'],
  report_ready: ['completed', 'report_under_review'],
  rejected: ['recollection_requested'],
  recollection_requested: ['collection_assigned', 'collected'],
  completed: [],
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requirePermission(request, 'samples:write')
    const { id } = await params
    const body = await request.json()

    const sample = await Sample.findById(id)
    if (!sample) {
      return Response.json({ error: 'Sample not found' }, { status: 404 })
    }

    if (body.status) {
      const allowed = VALID_TRANSITIONS[sample.status] || []
      if (!allowed.includes(body.status) && body.status !== sample.status) {
        return Response.json({
          error: `Invalid status transition: ${sample.status} → ${body.status}`,
          allowedTransitions: allowed,
        }, { status: 400 })
      }

      const oldStatus = sample.status
      sample.status = body.status

      if (body.status === 'collected') sample.collectedAt = new Date()
      if (body.status === 'received') sample.receivedAt = new Date()
      if (body.status === 'processing') sample.processedAt = new Date()

      await sample.save()

      await SampleStatusHistory.create({
        sampleId: sample._id,
        oldStatus,
        newStatus: body.status,
        changedBy: new (require('mongoose').Types.ObjectId)(admin.id),
        changedByName: admin.name,
        notes: body.notes,
      })

      await logAudit(admin.id, 'STATUS_CHANGE', 'sample', sample._id.toString(), `Sample ${sample.sampleId}: ${oldStatus} → ${body.status}`, oldStatus, body.status)
    }

    if (body.tests) sample.tests = body.tests
    if (body.barcode) sample.barcode = body.barcode
    await sample.save()

    return Response.json({ sample })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update sample error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(request, 'samples:read')
    const { id } = await params

    const sample = await Sample.findById(id).lean()
    if (!sample) {
      return Response.json({ error: 'Sample not found' }, { status: 404 })
    }

    const history = await SampleStatusHistory.find({ sampleId: id })
      .sort({ createdAt: -1 })
      .lean()

    return Response.json({ sample, history })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get sample error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
