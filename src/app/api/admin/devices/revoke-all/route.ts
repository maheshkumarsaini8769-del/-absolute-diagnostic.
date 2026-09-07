import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)

    const result = await prisma.adminDevice.updateMany({
      where: { adminId: admin.id, isActive: true },
      data: { isActive: false, isTrusted: false }
    })

    await logAudit(admin.id, 'all_devices_revoked', 'device', undefined, `${result.count} devices revoked`)

    return Response.json({ success: true, message: `${result.count} device(s) revoked` })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Revoke all devices error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
