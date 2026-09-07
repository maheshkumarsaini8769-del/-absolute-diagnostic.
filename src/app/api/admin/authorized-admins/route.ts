import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const admins = await prisma.authorizedAdmin.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ admins })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List authorized admins error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const { email, name } = body

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existing = await prisma.authorizedAdmin.findUnique({
      where: { email: normalizedEmail }
    })

    if (existing) {
      return Response.json({ error: 'This email is already authorized' }, { status: 409 })
    }

    const authorized = await prisma.authorizedAdmin.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        addedBy: admin.id,
      }
    })

    await logAudit(admin.id, 'authorized_admin_added', 'authorized_admin', authorized.id, normalizedEmail)

    return Response.json({ authorized }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Add authorized admin error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
