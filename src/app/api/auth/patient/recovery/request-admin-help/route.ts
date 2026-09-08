import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Patient, PatientRecoveryRequest, Notification } from '@/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { patientId, phone, name, reason } = body

    if (!phone && !patientId) {
      return NextResponse.json({ error: 'Phone number or Patient ID is required.' }, { status: 400 })
    }

    let patient: any = null
    if (patientId) {
      patient = await Patient.findById(patientId)
    }
    if (!patient && phone) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)
      patient = await Patient.findOne({ phone: cleanPhone })
    }

    if (!patient) {
      return NextResponse.json({ error: 'Patient account not found.' }, { status: 404 })
    }

    // Create recovery request
    const recoveryRequest = await PatientRecoveryRequest.create({
      patientId: patient._id,
      phone: patient.phone,
      name: name || patient.name,
      reason: reason || 'Truecaller verification unavailable / manual password reset assistance requested',
      status: 'pending',
    })

    // Create admin notification
    await Notification.create({
      type: 'patient_recovery_request',
      title: 'Password Reset Request',
      message: `Patient ${patient.name} (${patient.phone}) requested laboratory assistance to reset their account password.`,
      isRead: false,
    })

    return NextResponse.json({
      success: true,
      requestId: recoveryRequest._id.toString(),
      message: 'Password reset request submitted. Laboratory staff will verify and assist you shortly.',
      labContact: {
        phone: '0141-2345678',
        whatsapp: '+91 77427 35762',
        email: 'support@absolutediagnostic.com',
      }
    })
  } catch (err) {
    console.error('Request admin help error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
