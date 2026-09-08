import { prisma } from '@/lib/prisma'
import { notifyAdminDevices } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const name = body.name || body.fullName
    const phone = body.phone || body.mobile
    const position = body.position || body.jobTitle || body.role

    if (!name || !phone || !position) {
      return Response.json(
        { error: 'Name, phone, and position applied for are required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        title: `Career Application: ${position}`,
        message: `Applicant: ${name} | Phone: ${phone} | Email: ${body.email || 'N/A'} | Exp: ${body.experience || 'N/A'} | Notes: ${body.notes || 'None'}`,
        type: 'career'
      }
    })

    try {
      await notifyAdminDevices('admin', {
        title: `New Job Application: ${position}`,
        body: `${name} (${phone}) applied for ${position}`,
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
