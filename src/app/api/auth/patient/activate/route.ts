import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Patient, Booking, Report } from '@/models'
import { validatePasswordPolicy } from '@/lib/password-policy'
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
    // STEP 1: VERIFY PATIENT RECORD
    // ═════════════════════════════════════════════════════
    if (action === 'verify_record') {
      const { identifier, phone, email, name, age } = body

      // STRICT SECURITY CHECK per opencode/new1.md:
      // "Name + Age alone must NEVER be enough to access a report."
      if (!identifier && !phone && !email) {
        return NextResponse.json(
          { error: 'Patient ID, UHID, or registered Mobile / Email is required. Name and age alone are not sufficient to access records.' },
          { status: 400 }
        )
      }

      let patient: any = null

      // Search by Patient ID / UHID / Booking ID if provided
      if (identifier) {
        const cleanIdentifier = identifier.trim()
        if (mongoose.Types.ObjectId.isValid(cleanIdentifier)) {
          patient = await Patient.findById(cleanIdentifier)
        }
        if (!patient) {
          patient = await Patient.findOne({ patientIdUHID: cleanIdentifier })
        }
        if (!patient) {
          // Check if identifier is a bookingId
          const booking = await Booking.findOne({ bookingId: cleanIdentifier })
          if (booking && booking.patientId) {
            patient = await Patient.findById(booking.patientId)
          }
        }
      }

      // If not found by identifier, verify by registered phone / email
      if (!patient && phone) {
        const cleanPhone = phone.replace(/\D/g, '').slice(-10)
        if (cleanPhone.length === 10) {
          patient = await Patient.findOne({ phone: cleanPhone })
        }
      }

      if (!patient && email) {
        const cleanEmail = email.toLowerCase().trim()
        patient = await Patient.findOne({
          $or: [{ email: cleanEmail }, { verifiedEmail: cleanEmail }]
        })
      }

      if (!patient) {
        return NextResponse.json(
          { error: 'No patient record found matching the provided details. Please verify your Patient ID or Mobile Number.' },
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

      // STRICT REQUIREMENT per opencode/new1.md:
      // "After successful activation: isActivated = true. First-Time Activation must no longer be usable for that patient."
      // "Try First-Time Activation again: It must NOT allow another activation because the account is already activated."
      if (patient.isActivated) {
        return NextResponse.json(
          {
            error: 'This account is already activated. First-Time Activation cannot be reused. Please login using your Mobile Number / Email and Password.',
            alreadyActivated: true,
          },
          { status: 400 }
        )
      }

      // If phone was provided, verify it matches
      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '').slice(-10)
        const patientPhone = patient.phone.replace(/\D/g, '').slice(-10)
        if (cleanPhone !== patientPhone) {
          return NextResponse.json(
            { error: 'The provided mobile number does not match this patient record.' },
            { status: 400 }
          )
        }
      }

      // If name was provided, ensure reasonable match
      if (name && name.trim()) {
        const inputName = name.toLowerCase().trim()
        const storedName = (patient.name || '').toLowerCase().trim()
        if (!storedName.includes(inputName) && !inputName.includes(storedName)) {
          return NextResponse.json(
            { error: 'The provided patient name does not match the record on file.' },
            { status: 400 }
          )
        }
      }

      // Ensure UHID is present
      const uhid = patient.patientIdUHID || `UHID-${patient._id.toString().slice(-6).toUpperCase()}`

      return NextResponse.json({
        verified: true,
        patientId: patient._id.toString(),
        patientName: patient.name,
        uhid,
        phoneMasked: patient.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
        hasPassword: !!patient.passwordHash,
      })
    }

    // ═════════════════════════════════════════════════════
    // STEP 2: CREATE STRONG PASSWORD & ACTIVATE
    // ═════════════════════════════════════════════════════
    if (action === 'create_password') {
      const { patientId, password, confirmPassword } = body

      if (!patientId || !password || !confirmPassword) {
        return NextResponse.json(
          { error: 'Patient ID, Password, and Confirm Password are required.' },
          { status: 400 }
        )
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: 'New password and confirm password do not match.' },
          { status: 400 }
        )
      }

      // Enforce strict password policy per opencode/new1.md
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

      if (patient.isActivated) {
        return NextResponse.json(
          {
            error: 'This account has already completed first-time activation. Please login using your password.',
            alreadyActivated: true,
          },
          { status: 400 }
        )
      }

      // Secure bcrypt hashing
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
          authMethod: 'password_activated',
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
        message: 'Password created successfully. Account activated.',
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
      { error: 'Invalid action. Supported actions: verify_record, create_password' },
      { status: 400 }
    )
  } catch (err) {
    console.error('Patient activation error:', err)
    return NextResponse.json({ error: 'Internal server error during account activation.' }, { status: 500 })
  }
}
