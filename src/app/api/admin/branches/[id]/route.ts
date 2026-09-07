import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { branchSchema } from '@/lib/validators'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await context.params

    const branch = await prisma.branch.findUnique({ where: { id } })

    if (!branch) {
      return Response.json({ error: 'Branch not found' }, { status: 404 })
    }

    return Response.json({ branch })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get branch error:', error)
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
    const parsed = branchSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.branch.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Branch not found' }, { status: 404 })
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: parsed.data
    })

    await logAudit(admin.id, 'UPDATE', 'branch', id, branch.name)

    return Response.json({ branch })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update branch error:', error)
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

    const existing = await prisma.branch.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Branch not found' }, { status: 404 })
    }

    await prisma.branch.update({
      where: { id },
      data: { isActive: false }
    })

    await logAudit(admin.id, 'DELETE', 'branch', id, existing.name)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete branch error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
