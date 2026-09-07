import { requirePermission } from '@/lib/auth'
import { AuditLog } from '@/models'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'audit:read')
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const action = searchParams.get('action')
    const adminId = searchParams.get('adminId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const filter: Record<string, unknown> = {}
    if (entity) filter.entity = entity
    if (action) filter.action = action
    if (adminId) filter.adminId = adminId

    const total = await AuditLog.countDocuments(filter)
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return Response.json({ logs, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    if (error instanceof Response) return error
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
