import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { Patient } from '@/models'
import bcrypt from 'bcryptjs'

function getPasswordStatus(patient: any): 'not_created' | 'active' | 'temporary' | 'reset_required' | 'disabled' {
  if (patient.isAccountDisabled) return 'disabled'
  if (!patient.passwordHash) return 'not_created'
  if (patient.passwordResetRequired) return 'reset_required'
  if (patient.isPasswordTemporary) return 'temporary'
  return 'active'
}

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

    // Sanitize patient object: do not expose passwordHash
    const { passwordHash, ...safePatient } = patient as any

    const passwordStatus = getPasswordStatus(patient)

    return Response.json({
      patient: {
        ...safePatient,
        passwordStatus,
        hasPassword: !!passwordHash,
      }
    })
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

    const patient = await Patient.findById(id)
    if (!patient) {
      return Response.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Action 1: Generate Temporary Password (per opencode/new1.md Section 8)
    if (body.action === 'generate_temporary_password') {
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      const year = new Date().getFullYear()
      const tempPassword = `Lab@${randomDigits}#${year}`

      const passwordHash = await bcrypt.hash(tempPassword, 12)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      patient.passwordHash = passwordHash
      patient.isPasswordTemporary = true
      patient.temporaryPasswordExpiresAt = expiresAt
      patient.passwordResetRequired = true
      patient.failedLoginAttempts = 0
      patient.lockoutUntil = undefined
      patient.lastPasswordChangeAt = new Date()
      await patient.save()

      await logAudit(admin.id, 'temporary_password_generated', 'patient', id, `Generated 24h temporary password for patient ${patient.name}`)

      // Return temporary password once to admin to convey to patient
      return Response.json({
        success: true,
        temporaryPassword: tempPassword,
        expiresAt,
        message: 'Temporary password generated. Patient must change password on next login.'
      })
    }

    // Action 2: Force Password Reset
    if (body.action === 'force_password_reset') {
      patient.passwordResetRequired = true
      await patient.save()

      await logAudit(admin.id, 'force_password_reset', 'patient', id, `Forced password reset for patient ${patient.name}`)

      return Response.json({
        success: true,
        message: 'Password reset flag set. Patient will be required to change password on next login.'
      })
    }

    // Action 3: Toggle Account Disabled
    if (body.action === 'toggle_disabled') {
      patient.isAccountDisabled = !patient.isAccountDisabled
      await patient.save()

      await logAudit(
        admin.id,
        patient.isAccountDisabled ? 'patient_account_disabled' : 'patient_account_enabled',
        'patient',
        id,
        `Patient account ${patient.isAccountDisabled ? 'disabled' : 'enabled'}`
      )

      return Response.json({
        success: true,
        isAccountDisabled: patient.isAccountDisabled,
        message: `Patient account ${patient.isAccountDisabled ? 'disabled' : 'enabled'} successfully.`
      })
    }

    // Action 4: Email Correction
    if (body.action === 'correct_email') {
      const { newEmail } = body
      if (!newEmail || typeof newEmail !== 'string') {
        return Response.json({ error: 'New email is required' }, { status: 400 })
      }

      const normalizedEmail = newEmail.toLowerCase().trim()
      const oldEmail = patient.verifiedEmail || patient.email

      patient.email = normalizedEmail
      patient.verifiedEmail = normalizedEmail
      patient.emailVerifiedAt = new Date()
      await patient.save()

      await prisma.booking.updateMany({
        where: { patientId: id },
        data: { patientEmail: normalizedEmail }
      })

      await logAudit(admin.id, 'email_corrected', 'patient', id, `Email changed from ${oldEmail} to ${normalizedEmail}`)

      return Response.json({ success: true, message: 'Email updated successfully' })
    }

    // Action 5: Profile Demographics Update
    if (body.name !== undefined || body.phone !== undefined || body.address !== undefined || body.age !== undefined || body.gender !== undefined) {
      if (body.name !== undefined) patient.name = body.name
      if (body.phone !== undefined) patient.phone = body.phone
      if (body.address !== undefined) patient.address = body.address
      if (body.age !== undefined) patient.age = body.age
      if (body.gender !== undefined) patient.gender = body.gender

      await patient.save()

      await logAudit(admin.id, 'patient_updated', 'patient', id, `Updated patient: ${patient.name}`)

      const { passwordHash, ...safe } = patient.toObject()
      return Response.json({ patient: safe })
    }

    return Response.json({ error: 'No valid action specified' }, { status: 400 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update patient error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
