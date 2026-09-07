import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const { isActive, name } = body

    const authorized = await prisma.authorizedAdmin.findUnique({ where: { id } })
    if (!authorized) {
      return Response.json({ error: 'Authorized admin not found' }, { status: 404 })
    }

    const updated = await prisma.authorizedAdmin.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : authorized.isActive,
        name: name !== undefined ? name : authorized.name,
      }
    })

    await logAudit(admin.id, 'authorized_admin_updated', 'authorized_admin', id, `${authorized.email} - ${isActive ? 'enabled' : 'disabled'}`)

    return Response.json({ authorized: updated })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update authorized admin error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await params

    const authorized = await prisma.authorizedAdmin.findUnique({ where: { id } })
    if (!authorized) {
      return Response.json({ error: 'Authorized admin not found' }, { status: 404 })
    }

    await prisma.authorizedAdmin.delete({ where: { id } })

    await logAudit(admin.id, 'authorized_admin_removed', 'authorized_admin', id, authorized.email)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete authorized admin error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
