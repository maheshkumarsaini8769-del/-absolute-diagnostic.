import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { testSchema } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    const where: Record<string, unknown> = {}
    if (active === 'true') where.isActive = true
    if (active === 'false') where.isActive = false

    const tests = await prisma.test.findMany({
      where,
      include: { category: true },
      orderBy: { displayOrder: 'asc' }
    })

    return Response.json({ tests })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List tests error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = testSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const test = await prisma.test.create({
      data: parsed.data,
      include: { category: true }
    })

    await logAudit(admin.id, 'CREATE', 'test', test.id, test.name)

    return Response.json({ test }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create test error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
