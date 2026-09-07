import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sendPushNotification } from '@/lib/notifications'

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params
    const body = await request.json()

    const device = await prisma.adminDevice.findUnique({ where: { id } })
    if (!device) {
      return Response.json({ error: 'Device not found' }, { status: 404 })
    }
    if (device.adminId !== admin.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (body.action === 'revoke') {
      await prisma.adminDevice.update({
        where: { id },
        data: { isActive: false, isTrusted: false }
      })
      await logAudit(admin.id, 'device_revoked', 'device', id, device.deviceName)
      return Response.json({ success: true, message: 'Device revoked' })
    }

    if (body.action === 'send_test') {
      if (device.endpoint && device.p256dh && device.auth) {
        const success = await sendPushNotification(
          device.endpoint,
          device.p256dh,
          device.auth,
          {
            title: 'Test Notification',
            body: 'Admin notification system is working.',
            url: '/admin',
            tag: 'test-notification',
            priority: 'high'
          }
        )
        await logAudit(admin.id, 'test_notification_sent', 'device', id, device.deviceName)
        return Response.json({ success, message: success ? 'Test notification sent' : 'Failed to send notification' })
      }
      return Response.json({ success: false, message: 'Device has no push subscription' })
    }

    if (body.deviceName !== undefined) {
      await prisma.adminDevice.update({
        where: { id },
        data: { deviceName: body.deviceName }
      })
      await logAudit(admin.id, 'device_renamed', 'device', id, body.deviceName)
    }

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update device error:', error)
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

    const existing = await prisma.adminDevice.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Device not found' }, { status: 404 })
    }

    if (existing.adminId !== admin.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.adminDevice.delete({ where: { id } })

    await logAudit(admin.id, 'device_deleted', 'device', id, existing.deviceName)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete device error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
