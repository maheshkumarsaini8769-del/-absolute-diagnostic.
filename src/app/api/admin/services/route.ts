import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { serviceSchema } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const services = await prisma.service.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    return Response.json({ services })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List services error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = serviceSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const service = await prisma.service.create({ data: parsed.data })

    await logAudit(admin.id, 'CREATE', 'service', service.id, service.title)

    return Response.json({ service }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create service error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
