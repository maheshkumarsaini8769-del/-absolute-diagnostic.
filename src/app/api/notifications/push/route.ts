import { requireAdmin } from '@/lib/auth'
import { notifyAdminDevices } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    const title = body.title || 'Test Notification'
    const message = body.message || 'This is a test notification from the admin panel.'

    const successCount = await notifyAdminDevices(admin.id, {
      title,
      body: message,
      url: body.url || '/admin',
      tag: 'test-notification',
      priority: 'high'
    })

    return Response.json({
      success: true,
      message: `Notification sent to ${successCount} device(s)`
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Push notification error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
