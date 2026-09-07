import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth'
import { Report } from '@/models'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'reports:read')
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const filter = {
      $or: [
        { matchConfidence: { $in: ['low', 'none'] } },
        { patientId: null },
        { matchConfidence: { $exists: false } },
      ],
      status: { $nin: ['completed', 'report_ready'] },
    }

    const total = await Report.countDocuments(filter)
    const reports = await Report.find(filter)
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return Response.json({ reports, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Unmatched reports error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
