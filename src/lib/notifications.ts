import webPush from 'web-push'
import { prisma } from './prisma'

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidEmail = process.env.VAPID_EMAIL

if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
  webPush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey)
}

export async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: { title: string; body: string; url?: string; tag?: string; priority?: string }
): Promise<boolean> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) return false

    await webPush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        data: { url: payload.url || '/' },
        tag: payload.tag,
        priority: payload.priority || 'high'
      })
    )
    return true
  } catch {
    return false
  }
}

export async function notifyAdminDevices(adminId: string, payload: {
  title: string
  body: string
  url?: string
  tag?: string
  priority?: string
}): Promise<number> {
  const devices = await prisma.adminDevice.findMany({
    where: { adminId, isActive: true }
  })

  let successCount = 0

  for (const device of devices) {
    if (device.endpoint && device.p256dh && device.auth) {
      const success = await sendPushNotification(
        device.endpoint,
        device.p256dh,
        device.auth,
        payload
      )
      if (success) successCount++
    }
  }

  return successCount
}
