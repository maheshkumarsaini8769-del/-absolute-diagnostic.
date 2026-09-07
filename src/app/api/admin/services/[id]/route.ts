import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { serviceSchema } from '@/lib/validators'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await context.params

    const service = await prisma.service.findUnique({ where: { id } })

    if (!service) {
      return Response.json({ error: 'Service not found' }, { status: 404 })
    }

    return Response.json({ service })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get service error:', error)
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
    const parsed = serviceSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.service.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Service not found' }, { status: 404 })
    }

    const service = await prisma.service.update({
      where: { id },
      data: parsed.data
    })

    await logAudit(admin.id, 'UPDATE', 'service', id, service.title)

    return Response.json({ service })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update service error:', error)
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

    const existing = await prisma.service.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Service not found' }, { status: 404 })
    }

    await prisma.service.update({
      where: { id },
      data: { isActive: false }
    })

    await logAudit(admin.id, 'DELETE', 'service', id, existing.title)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete service error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
