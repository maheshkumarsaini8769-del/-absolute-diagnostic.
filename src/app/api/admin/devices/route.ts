import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request)

    const devices = await prisma.adminDevice.findMany({
      where: { adminId: admin.id },
      orderBy: { lastActive: 'desc' }
    })

    return Response.json({ devices })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List devices error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    if (!body.deviceName) {
      return Response.json({ error: 'deviceName is required' }, { status: 400 })
    }

    let device

    if (body.endpoint) {
      const existing = await prisma.adminDevice.findFirst({
        where: { adminId: admin.id, endpoint: body.endpoint }
      })

      if (existing) {
        device = await prisma.adminDevice.update({
          where: { id: existing.id },
          data: {
            deviceName: body.deviceName,
            deviceType: body.deviceType || existing.deviceType,
            browser: body.browser || existing.browser,
            p256dh: body.p256dh || existing.p256dh,
            auth: body.auth || existing.auth,
            isActive: true,
            isTrusted: existing.isTrusted || body.isTrusted || false,
            lastActive: new Date()
          }
        })
      } else {
        device = await prisma.adminDevice.create({
          data: {
            adminId: admin.id,
            deviceName: body.deviceName,
            deviceType: body.deviceType || null,
            browser: body.browser || null,
            endpoint: body.endpoint,
            p256dh: body.p256dh,
            auth: body.auth,
            isTrusted: body.isTrusted || false,
          }
        })
      }
    } else {
      device = await prisma.adminDevice.create({
        data: {
          adminId: admin.id,
          deviceName: body.deviceName,
          deviceType: body.deviceType || null,
          browser: body.browser || null,
          isTrusted: body.isTrusted || false,
        }
      })
    }

    await logAudit(admin.id, 'device_registered', 'device', device.id, device.deviceName)

    return Response.json({ device }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Register device error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
