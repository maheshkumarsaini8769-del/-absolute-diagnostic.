import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const unread = searchParams.get('unread')

    const where: Record<string, unknown> = {}
    if (unread === 'true') where.isRead = false

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return Response.json({ notifications })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List notifications error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    if (!body.id || body.isRead === undefined) {
      return Response.json({ error: 'id and isRead are required' }, { status: 400 })
    }

    const notification = await prisma.notification.update({
      where: { id: body.id },
      data: { isRead: body.isRead }
    })

    await logAudit(admin.id, 'notification_read', 'notification', notification.id, `Notification marked as ${body.isRead ? 'read' : 'unread'}`)

    return Response.json({ notification })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update notification error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
