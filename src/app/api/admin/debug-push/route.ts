import { prisma } from '@/lib/prisma'

export async function GET() {

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL

  const devices = await prisma.adminDevice.findMany({
    where: { isActive: true }
  })

  const devicesInfo = devices.map((d: any) => ({
    name: d.deviceName,
    hasPush: !!(d.endpoint && d.p256dh && d.auth),
    endpointPreview: d.endpoint ? d.endpoint.slice(0, 40) + '...' : null,
  }))

  return Response.json({
    vapidPublicKey: vapidPublicKey ? '✅ SET (' + vapidPublicKey.slice(0, 10) + '...)' : '❌ MISSING',
    vapidPrivateKey: vapidPrivateKey ? '✅ SET' : '❌ MISSING',
    vapidEmail: vapidEmail ? '✅ SET (' + vapidEmail + ')' : '❌ MISSING',
    totalActiveDevices: devices.length,
    devicesWithPushSubscription: devicesInfo.filter((d: any) => d.hasPush).length,
    devices: devicesInfo,
  })
}
