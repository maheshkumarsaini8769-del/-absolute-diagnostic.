import { prisma } from '@/lib/prisma'
import { notifyAdminDevices } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name || !body.phone || !body.position) {
      return Response.json(
        { error: 'Name, phone, and position applied for are required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        title: `Career Application: ${body.position}`,
        message: `Applicant: ${body.name} | Phone: ${body.phone} | Email: ${body.email || 'N/A'} | Exp: ${body.experience || 'N/A'} | Notes: ${body.notes || 'None'}`,
        type: 'career'
      }
    })

    try {
      await notifyAdminDevices('admin', {
        title: `New Job Application: ${body.position}`,
        body: `${body.name} (${body.phone}) applied for ${body.position}`,
        url: '/admin',
        tag: 'career-application'
      })
    } catch {
      // Non-critical
    }

    return Response.json({ success: true, notification, message: 'Application submitted successfully' })
  } catch (error) {
    console.error('Career application error:', error)
    return Response.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
