import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { branchSchema } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return Response.json({ branches })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List branches error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = branchSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const branch = await prisma.branch.create({ data: parsed.data })

    await logAudit(admin.id, 'CREATE', 'branch', branch.id, branch.name)

    return Response.json({ branch }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create branch error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
