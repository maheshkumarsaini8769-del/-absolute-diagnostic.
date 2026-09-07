import crypto from 'crypto'
import { prisma } from './prisma'
import { sendOTPEmail } from './email'

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 5
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_SECONDS = 60

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

export async function sendAdminOTP(email: string): Promise<{ success: boolean; error?: string; cooldown?: number }> {
  const normalizedEmail = email.toLowerCase().trim()

  // Check if email is authorized
  const authorized = await prisma.authorizedAdmin.findUnique({
    where: { email: normalizedEmail }
  })
  if (!authorized || !authorized.isActive) {
    return { success: false, error: 'Email not authorized for admin access' }
  }

  // Check resend cooldown
  const recentOTP = await prisma.adminOTP.findFirst({
    where: { email: normalizedEmail },
    orderBy: { createdAt: 'desc' }
  })
  if (recentOTP) {
    const secondsSince = Math.floor((Date.now() - new Date(recentOTP.createdAt).getTime()) / 1000)
    if (secondsSince < RESEND_COOLDOWN_SECONDS) {
      return { success: false, error: `Please wait ${RESEND_COOLDOWN_SECONDS - secondsSince} seconds before requesting a new OTP`, cooldown: RESEND_COOLDOWN_SECONDS - secondsSince }
    }
  }

  // Invalidate previous unused OTPs
  await prisma.adminOTP.updateMany({
    where: { email: normalizedEmail, isUsed: false },
    data: { isUsed: true }
  })

  // Generate and store OTP
  const otp = generateOTP()
  const otpHash = hashOTP(otp)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  // Find admin if exists
  const admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } })

  await prisma.adminOTP.create({
    data: {
      adminId: admin?.id || null,
      email: normalizedEmail,
      otpHash,
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
      type: 'login',
    }
  })

  // Send email
  const sent = await sendOTPEmail(normalizedEmail, otp, 'admin_login')
  if (!sent) {
    return { success: false, error: 'Failed to send OTP email. Please try again.' }
  }

  return { success: true }
}

export async function verifyAdminOTP(email: string, otp: string): Promise<{ success: boolean; error?: string; admin?: any }> {
  const normalizedEmail = email.toLowerCase().trim()
  const otpHash = hashOTP(otp)

  const record = await prisma.adminOTP.findFirst({
    where: { email: normalizedEmail, isUsed: false },
    orderBy: { createdAt: 'desc' }
  })

  if (!record) {
    return { success: false, error: 'No valid OTP found. Please request a new one.' }
  }

  // Check expiry
  if (new Date() > new Date(record.expiresAt)) {
    return { success: false, error: 'OTP has expired. Please request a new one.' }
  }

  // Check attempts
  if (record.attempts >= record.maxAttempts) {
    await prisma.adminOTP.update({ where: { id: record.id }, data: { isUsed: true } })
    return { success: false, error: 'Too many failed attempts. Please request a new OTP.' }
  }

  // Increment attempts
  await prisma.adminOTP.update({
    where: { id: record.id },
    data: { attempts: record.attempts + 1 }
  })

  // Verify hash
  if (record.otpHash !== otpHash) {
    return { success: false, error: `Invalid OTP. ${record.maxAttempts - record.attempts - 1} attempts remaining.` }
  }

  // Mark as used
  await prisma.adminOTP.update({
    where: { id: record.id },
    data: { isUsed: true }
  })

  // Find or create admin
  let admin = record.adminId ? await prisma.admin.findUnique({ where: { id: record.adminId } }) : null
  if (!admin) {
    admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } })
  }
  if (!admin) {
    // Get the authorized admin record for the name
    const authAdmin = await prisma.authorizedAdmin.findUnique({ where: { email: normalizedEmail } })
    admin = await prisma.admin.create({
      data: {
        email: normalizedEmail,
        passwordHash: 'otp-auth',
        name: authAdmin?.name || normalizedEmail.split('@')[0],
        role: 'admin',
      }
    })
  }

  if (!admin.isActive) {
    return { success: false, error: 'Account is disabled' }
  }

  return { success: true, admin }
}

export async function sendPatientOTP(email: string, type: 'booking' | 'report' = 'report'): Promise<{ success: boolean; error?: string; cooldown?: number }> {
  const normalizedEmail = email.toLowerCase().trim()

  // Check resend cooldown
  const recentOTP = await prisma.patientOTP.findFirst({
    where: { email: normalizedEmail, type },
    orderBy: { createdAt: 'desc' }
  })
  if (recentOTP) {
    const secondsSince = Math.floor((Date.now() - new Date(recentOTP.createdAt).getTime()) / 1000)
    if (secondsSince < RESEND_COOLDOWN_SECONDS) {
      return { success: false, error: `Please wait ${RESEND_COOLDOWN_SECONDS - secondsSince} seconds before requesting a new OTP`, cooldown: RESEND_COOLDOWN_SECONDS - secondsSince }
    }
  }

  // Find patient by verified email — reject if not found
  const patient = await prisma.patient.findFirst({
    where: { verifiedEmail: normalizedEmail }
  })
  if (!patient) {
    return { success: false, error: 'No patient account found with this email. Please check your email or register first.' }
  }

  // Invalidate previous unused OTPs
  await prisma.patientOTP.updateMany({
    where: { email: normalizedEmail, type, isUsed: false },
    data: { isUsed: true }
  })

  // Generate and store OTP
  const otp = generateOTP()
  const otpHash = hashOTP(otp)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.patientOTP.create({
    data: {
      patientId: patient?.id || null,
      email: normalizedEmail,
      otpHash,
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
      type,
    }
  })

  // Determine email type
  const emailType = type === 'report' ? 'patient_report' : 'patient_booking'

  // Send email
  const sent = await sendOTPEmail(normalizedEmail, otp, emailType)
  if (!sent) {
    return { success: false, error: 'Failed to send OTP email. Please try again.' }
  }

  return { success: true }
}

export async function verifyPatientOTP(email: string, otp: string, type: 'booking' | 'report' = 'report'): Promise<{ success: boolean; error?: string; patient?: any }> {
  const normalizedEmail = email.toLowerCase().trim()
  const otpHash = hashOTP(otp)

  const record = await prisma.patientOTP.findFirst({
    where: { email: normalizedEmail, type, isUsed: false },
    orderBy: { createdAt: 'desc' }
  })

  if (!record) {
    return { success: false, error: 'No valid OTP found. Please request a new one.' }
  }

  if (new Date() > new Date(record.expiresAt)) {
    return { success: false, error: 'OTP has expired. Please request a new one.' }
  }

  if (record.attempts >= record.maxAttempts) {
    await prisma.patientOTP.update({ where: { id: record.id }, data: { isUsed: true } })
    return { success: false, error: 'Too many failed attempts. Please request a new OTP.' }
  }

  await prisma.patientOTP.update({
    where: { id: record.id },
    data: { attempts: record.attempts + 1 }
  })

  if (record.otpHash !== otpHash) {
    return { success: false, error: `Invalid OTP. ${record.maxAttempts - record.attempts - 1} attempts remaining.` }
  }

  await prisma.patientOTP.update({
    where: { id: record.id },
    data: { isUsed: true }
  })

  // Find patient
  let patient = record.patientId ? await prisma.patient.findUnique({ where: { id: record.patientId } }) : null
  if (!patient) {
    patient = await prisma.patient.findFirst({ where: { verifiedEmail: normalizedEmail } })
  }

  if (!patient) {
    return { success: false, error: 'No patient account found with this email' }
  }

  return { success: true, patient }
}

export async function generatePairingCode(adminId: string): Promise<{ code: string; expiresIn: number }> {
  // Invalidate previous unused codes for this admin
  await prisma.devicePairingCode.updateMany({
    where: { adminId, isUsed: false },
    data: { isUsed: true }
  })

  const code = crypto.randomInt(100000, 999999).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.devicePairingCode.create({
    data: {
      code,
      adminId,
      expiresAt,
    }
  })

  return { code, expiresIn: 600 }
}

export async function verifyPairingCode(code: string, adminId: string): Promise<{ success: boolean; error?: string }> {
  const record = await prisma.devicePairingCode.findFirst({
    where: { code, isUsed: false }
  })

  if (!record) {
    return { success: false, error: 'Invalid pairing code' }
  }

  if (new Date() > new Date(record.expiresAt)) {
    await prisma.devicePairingCode.update({ where: { id: record.id }, data: { isUsed: true } })
    return { success: false, error: 'Pairing code has expired' }
  }

  if (record.adminId !== adminId) {
    return { success: false, error: 'Pairing code does not belong to this admin' }
  }

  await prisma.devicePairingCode.update({
    where: { id: record.id },
    data: { isUsed: true }
  })

  return { success: true }
}
