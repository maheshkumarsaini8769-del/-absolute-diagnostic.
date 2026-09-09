import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Patient, PatientPasswordResetToken, Report } from '@/models'
import { validatePasswordPolicy } from '@/lib/password-policy'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024-change-in-production'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { resetToken, password, confirmPassword } = body

    if (!resetToken || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Reset token, new password, and confirmation are required.' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }

    // Validate password policy per opencode/new1.md
    const policyResult = validatePasswordPolicy(password)
    if (!policyResult.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet laboratory security requirements.',
          details: policyResult.errors,
        },
        { status: 400 }
      )
    }

    // Lookup reset token in DB
    const tokenDoc = await PatientPasswordResetToken.findOne({ token: resetToken })
    if (!tokenDoc) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset authorization.' },
        { status: 400 }
      )
    }

    if (tokenDoc.isUsed) {
      return NextResponse.json(
        { error: 'This password reset authorization has already been used. Please request a new verification.' },
        { status: 400 }
      )
    }

    if (new Date(tokenDoc.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This password reset authorization has expired. Please verify again.' },
        { status: 400 }
      )
    }

    const patient = await Patient.findById(tokenDoc.patientId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient account not found.' }, { status: 404 })
    }

    if (patient.isAccountDisabled) {
      return NextResponse.json(
        { error: 'This account has been disabled. Please contact the laboratory.' },
        { status: 403 }
      )
    }

    // Hash new password securely
    const passwordHash = await bcrypt.hash(password, 12)

    // Invalidate reset token
    tokenDoc.isUsed = true
    await tokenDoc.save()

    // Update patient password
    patient.passwordHash = passwordHash
    patient.isActivated = true
    patient.activatedAt = patient.activatedAt || new Date()
    patient.isPasswordTemporary = false
    patient.passwordResetRequired = false
    patient.failedLoginAttempts = 0
    patient.lockoutUntil = undefined
    patient.lastPasswordChangeAt = new Date()
    await patient.save()

    // Create session token for auto-login
    const token = jwt.sign(
      {
        patientId: patient._id.toString(),
        type: 'patient',
        authMethod: 'password_reset',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Fetch reports
    const reports = await Report.find({
      patientId: patient._id,
      isDeleted: { $ne: true },
    }).sort({ reportDate: -1, uploadedAt: -1 }).lean()

    const sanitizedReports = reports.map((r: any) => ({
      id: r._id.toString(),
      testName: r.testName,
      reportDate: r.reportDate || r.uploadedAt,
      status: r.status,
      fileName: r.fileName,
      bookingId: r.bookingId ? r.bookingId.toString() : null,
      analysisData: r.analysisData,
    }))

    const response = NextResponse.json({
      success: true,
      message: 'Password reset successfully. You are now logged in.',
      token,
      patientId: patient._id.toString(),
      patientName: patient.name,
      reports: sanitizedReports,
    })

    // Set HTTP-only cookie
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
