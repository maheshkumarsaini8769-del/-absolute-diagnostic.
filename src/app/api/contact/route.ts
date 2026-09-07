import { prisma } from '@/lib/prisma'
import { notifyAdminDevices } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name || !body.phone || !body.message) {
      return Response.json(
        { error: 'name, phone, and message are required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        title: 'Contact Form Submission',
        message: `New message from ${body.name} (${body.phone}): ${body.message.substring(0, 100)}`,
        type: 'contact'
      }
    })

    try {
      await notifyAdminDevices('admin', {
        title: 'Contact Form Submission',
        body: `New message from ${body.name} (${body.phone})`,
        url: '/admin',
        tag: 'contact-form'
      })
    } catch {
      // Push notification failure is non-critical
    }

    return Response.json({ success: true, notification })
  } catch (error) {
    console.error('Contact form error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
