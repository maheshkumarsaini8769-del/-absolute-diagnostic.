import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { testSchema } from '@/lib/validators'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await context.params

    const test = await prisma.test.findUnique({
      where: { id },
      include: { category: true }
    })

    if (!test) {
      return Response.json({ error: 'Test not found' }, { status: 404 })
    }

    return Response.json({ test })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get test error:', error)
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
    const parsed = testSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.test.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Test not found' }, { status: 404 })
    }

    const test = await prisma.test.update({
      where: { id },
      data: parsed.data,
      include: { category: true }
    })

    await logAudit(admin.id, 'UPDATE', 'test', id, test.name)

    return Response.json({ test })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update test error:', error)
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

    const existing = await prisma.test.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Test not found' }, { status: 404 })
    }

    const test = await prisma.test.update({
      where: { id },
      data: { isActive: false }
    })

    await logAudit(admin.id, 'DELETE', 'test', id, test.name)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete test error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
