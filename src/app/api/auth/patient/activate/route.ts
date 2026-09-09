import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Patient, Booking, Report } from '@/models'
import { validatePasswordPolicy } from '@/lib/password-policy'
import { verificationService } from '@/lib/verification'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024-change-in-production'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { action } = body

    // ═════════════════════════════════════════════════════
    // STEP 1: VERIFY PATIENT RECORD BY MOBILE NUMBER
    // ═════════════════════════════════════════════════════
    if (action === 'verify_record') {
      const rawInput = body.phone || body.identifier || body.email || ''
      const cleanPhone = rawInput.replace(/\D/g, '').slice(-10)

      if (!cleanPhone && !rawInput.includes('@')) {
        return NextResponse.json(
          { error: 'Registered 10-digit mobile number is required.' },
          { status: 400 }
        )
      }

      let patient: any = null

      // Find patient strictly by mobile number (no Patient ID needed)
      if (cleanPhone && cleanPhone.length === 10) {
        patient = await Patient.findOne({
          $or: [
            { phone: cleanPhone },
            { phone: `+91${cleanPhone}` },
            { phone: `91${cleanPhone}` },
          ]
        })
      }

      // Fallback for email or identifier if provided
      if (!patient && rawInput.includes('@')) {
        const cleanEmail = rawInput.toLowerCase().trim()
        patient = await Patient.findOne({
          $or: [{ email: cleanEmail }, { verifiedEmail: cleanEmail }]
        })
      }

      if (!patient && rawInput) {
        const cleanId = rawInput.trim()
        if (mongoose.Types.ObjectId.isValid(cleanId)) {
          patient = await Patient.findById(cleanId)
        }
        if (!patient) {
          patient = await Patient.findOne({ patientIdUHID: cleanId })
        }
      }

      if (!patient) {
        return NextResponse.json(
          { error: `No patient record found for mobile number "${cleanPhone || rawInput}". Please check your registered number or contact the laboratory.` },
          { status: 404 }
        )
      }

      // Check account disabled
      if (patient.isAccountDisabled) {
        return NextResponse.json(
          { error: 'This patient account has been disabled by the laboratory. Please contact support.' },
          { status: 403 }
        )
      }

      // If already activated, notify user to use password login
      if (patient.isActivated || patient.passwordHash) {
        return NextResponse.json(
          {
            error: 'This account is already activated. Please login using your Mobile Number and Password.',
            alreadyActivated: true,
            phone: patient.phone,
          },
          { status: 400 }
        )
      }

      const uhid = patient.patientIdUHID || `UHID-${patient._id.toString().slice(-6).toUpperCase()}`

      return NextResponse.json({
        verified: true,
        patientId: patient._id.toString(),
        patientName: patient.name,
        uhid,
        phone: patient.phone,
        phoneMasked: patient.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
        hasPassword: !!patient.passwordHash,
        isActivated: false,
      })
    }

    // ═════════════════════════════════════════════════════
    // STEP 2: TRUECALLER VERIFICATION
    // ═════════════════════════════════════════════════════
    if (action === 'truecaller_verify') {
      let { patientId, phone, payload } = body

      if (!patientId && phone) {
        const cleanPhone = phone.replace(/\D/g, '').slice(-10)
        const p = await Patient.findOne({
          $or: [
            { phone: cleanPhone },
            { phone: `+91${cleanPhone}` },
            { phone: `91${cleanPhone}` },
          ]
        })
        if (p) patientId = p._id.toString()
      }

      if (!patientId || !payload) {
        return NextResponse.json(
          { error: 'Patient ID or Phone and Truecaller payload are required.' },
          { status: 400 }
        )
      }

      const result = await verificationService.processRecoveryVerification(patientId, 'truecaller', payload)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Identity verified successfully via Truecaller.',
        verifiedToken: result.resetToken,
        patient: result.patient,
      })
    }

    // ═════════════════════════════════════════════════════
    // STEP 3: CREATE PASSWORD, ACTIVATE & DIRECT DASHBOARD
    // ═════════════════════════════════════════════════════
    if (action === 'create_password') {
      let { patientId, phone, password, confirmPassword } = body

      if (!patientId && phone) {
        const cleanPhone = phone.replace(/\D/g, '').slice(-10)
        const p = await Patient.findOne({
          $or: [
            { phone: cleanPhone },
            { phone: `+91${cleanPhone}` },
            { phone: `91${cleanPhone}` },
          ]
        })
        if (p) patientId = p._id.toString()
      }

      if (!patientId || !password || !confirmPassword) {
        return NextResponse.json(
          { error: 'Patient ID or Phone, Password, and Confirm Password are required.' },
          { status: 400 }
        )
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: 'New password and confirm password do not match.' },
          { status: 400 }
        )
      }

      // Enforce password policy
      const validation = validatePasswordPolicy(password)
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Password does not meet the laboratory security requirements.',
            details: validation.errors
          },
          { status: 400 }
        )
      }

      const patient = await Patient.findById(patientId)
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found.' }, { status: 404 })
      }

      if (patient.isAccountDisabled) {
        return NextResponse.json(
          { error: 'This patient account has been disabled. Please contact the laboratory.' },
          { status: 403 }
        )
      }

      // Hash password securely
      const passwordHash = await bcrypt.hash(password, 12)

      patient.passwordHash = passwordHash
      patient.isActivated = true
      patient.activatedAt = new Date()
      patient.isPasswordTemporary = false
      patient.passwordResetRequired = false
      patient.failedLoginAttempts = 0
      patient.lockoutUntil = undefined
      patient.lastPasswordChangeAt = new Date()
      await patient.save()

      // Create secure session token
      const token = jwt.sign(
        {
          patientId: patient._id.toString(),
          type: 'patient',
          authMethod: 'truecaller_activated',
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      // Fetch patient's authorized reports
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
        message: 'Password created successfully! Account activated.',
        token,
        patientId: patient._id.toString(),
        patientName: patient.name,
        patient: {
          id: patient._id.toString(),
          name: patient.name,
          phone: patient.phone,
          email: patient.email || null,
        },
        reports: sanitizedReports,
      })

      // Set secure HTTP-only cookie
      response.cookies.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600,
        path: '/',
      })

      return response
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: verify_record, truecaller_verify, create_password' },
      { status: 400 }
    )
  } catch (err) {
    console.error('Patient activation error:', err)
    return NextResponse.json({ error: 'Internal server error during account activation.' }, { status: 500 })
  }
}
