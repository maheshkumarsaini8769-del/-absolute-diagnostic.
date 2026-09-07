import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { Sample, SampleStatusHistory } from '@/models'

const SAMPLE_STATUS_FLOW = [
  'booked', 'collection_assigned', 'collected', 'received',
  'processing', 'report_under_review', 'report_ready', 'completed'
]

function generateSampleId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const seq = Math.floor(Math.random() * 999999).toString().padStart(7, '0')
  return `APC-${year}-${seq}`
}

export async function GET(request: Request) {
  try {
    const admin = await requirePermission(request, 'samples:read')
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (source) filter.source = source
    if (search) {
      filter.$or = [
        { sampleId: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { patientPhone: { $regex: search, $options: 'i' } },
      ]
    }

    if (!admin.isMaster && admin.role === 'collection_center' && admin.source) {
      filter.source = admin.source
    }

    const total = await Sample.countDocuments(filter)
    const samples = await Sample.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return Response.json({ samples, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List samples error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'samples:write')
    const body = await request.json()

    const sampleId = body.sampleId || generateSampleId()
    const sample = await Sample.create({
      sampleId,
      bookingId: body.bookingId,
      patientId: body.patientId,
      patientName: body.patientName,
      patientPhone: body.patientPhone,
      source: body.source || admin.source,
      branchId: body.branchId,
      status: body.status || 'booked',
      tests: body.tests || [],
    })

    await SampleStatusHistory.create({
      sampleId: sample._id,
      oldStatus: '',
      newStatus: sample.status,
      changedBy: admin._id,
      changedByName: admin.name,
      notes: 'Sample created',
    })

    await logAudit(admin.id, 'CREATE', 'sample', sample._id.toString(), `Sample ${sampleId} created`, undefined, JSON.stringify({ sampleId, status: sample.status }))

    return Response.json({ sample }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create sample error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
