import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await context.params

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        bookings: { include: { items: true }, orderBy: { createdAt: 'desc' } },
        reports: { orderBy: { uploadedAt: 'desc' } }
      }
    })

    if (!patient) {
      return Response.json({ error: 'Patient not found' }, { status: 404 })
    }

    return Response.json({ patient })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get patient error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params
    const body = await request.json()

    const patient = await prisma.patient.findUnique({ where: { id } })
    if (!patient) {
      return Response.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (body.action === 'correct_email') {
      const { newEmail } = body
      if (!newEmail || typeof newEmail !== 'string') {
        return Response.json({ error: 'New email is required' }, { status: 400 })
      }

      const normalizedEmail = newEmail.toLowerCase().trim()
      const oldEmail = patient.verifiedEmail || patient.email

      await prisma.patient.update({
        where: { id },
        data: {
          email: normalizedEmail,
          verifiedEmail: normalizedEmail,
          emailVerifiedAt: new Date()
        }
      })

      await prisma.booking.updateMany({
        where: { patientId: id },
        data: { patientEmail: normalizedEmail }
      })

      await logAudit(admin.id, 'email_corrected', 'patient', id, `Email changed from ${oldEmail} to ${normalizedEmail}`)

      return Response.json({ success: true, message: 'Email updated successfully' })
    }

    if (body.name !== undefined || body.phone !== undefined || body.address !== undefined || body.age !== undefined || body.gender !== undefined) {
      const updated = await prisma.patient.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(body.address !== undefined && { address: body.address }),
          ...(body.age !== undefined && { age: body.age }),
          ...(body.gender !== undefined && { gender: body.gender }),
        }
      })

      await logAudit(admin.id, 'patient_updated', 'patient', id, `Updated patient: ${updated.name}`)

      return Response.json({ patient: updated })
    }

    return Response.json({ error: 'No valid action specified' }, { status: 400 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update patient error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
