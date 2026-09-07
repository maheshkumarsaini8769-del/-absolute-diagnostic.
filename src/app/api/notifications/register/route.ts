import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    if (!body.deviceName || !body.endpoint || !body.p256dh || !body.auth) {
      return Response.json(
        { error: 'deviceName, endpoint, p256dh, and auth are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.adminDevice.findFirst({
      where: { adminId: admin.id, endpoint: body.endpoint }
    })

    let device
    if (existing) {
      device = await prisma.adminDevice.update({
        where: { id: existing.id },
        data: {
          deviceName: body.deviceName,
          p256dh: body.p256dh,
          auth: body.auth,
          isActive: true,
          lastActive: new Date()
        }
      })
    } else {
      device = await prisma.adminDevice.create({
        data: {
          adminId: admin.id,
          deviceName: body.deviceName,
          endpoint: body.endpoint,
          p256dh: body.p256dh,
          auth: body.auth
        }
      })
    }

    return Response.json({ device }, { status: existing ? 200 : 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Register subscription error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
