import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { ADMIN_ROLES, ROLE_PERMISSIONS } from '@/models'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'admin:manage')
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true, name: true, role: true, isMaster: true, isActive: true, source: true },
    })
    return Response.json({
      roles: Object.values(ADMIN_ROLES),
      permissions: ROLE_PERMISSIONS,
      admins,
    })
  } catch (error) {
    if (error instanceof Response) return error
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requirePermission(request, 'admin:manage')
    const body = await request.json()
    const { adminId, role, source } = body

    if (!adminId || !role) {
      return Response.json({ error: 'adminId and role required' }, { status: 400 })
    }

    if (!Object.values(ADMIN_ROLES).includes(role as any)) {
      return Response.json({ error: `Invalid role. Valid: ${Object.values(ADMIN_ROLES).join(', ')}` }, { status: 400 })
    }

    const targetAdmin = await prisma.admin.findUnique({ where: { id: adminId } })
    if (!targetAdmin) {
      return Response.json({ error: 'Admin not found' }, { status: 404 })
    }

    const oldRole = targetAdmin.role
    await prisma.admin.update({
      where: { id: adminId },
      data: { role, source: source || targetAdmin.source },
    })

    await logAudit(admin.id, 'ROLE_CHANGE', 'admin', adminId, `Role changed: ${oldRole} → ${role}`, oldRole, role)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
