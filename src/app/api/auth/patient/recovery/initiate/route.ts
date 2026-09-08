import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Patient } from '@/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const identifier = (body.identifier || body.phone || body.email || '').trim()

    if (!identifier) {
      return NextResponse.json({ error: 'Please enter your registered mobile number or email.' }, { status: 400 })
    }

    const isEmail = identifier.includes('@')
    let patient: any = null

    if (isEmail) {
      const cleanEmail = identifier.toLowerCase()
      patient = await Patient.findOne({
        $or: [{ email: cleanEmail }, { verifiedEmail: cleanEmail }]
      })
    } else {
      const cleanPhone = identifier.replace(/\D/g, '').slice(-10)
      if (cleanPhone.length === 10) {
        patient = await Patient.findOne({
          $or: [
            { phone: cleanPhone },
            { phone: `+91${cleanPhone}` },
            { phone: `91${cleanPhone}` },
          ]
        })
      }
    }

    if (!patient) {
      return NextResponse.json(
        { error: 'No patient record found for this mobile number or email.' },
        { status: 404 }
      )
    }

    if (patient.isAccountDisabled) {
      return NextResponse.json(
        { error: 'Your account has been disabled. Please contact the laboratory for assistance.' },
        { status: 403 }
      )
    }

    const maskedPhone = patient.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2')

    return NextResponse.json({
      success: true,
      patientId: patient._id.toString(),
      patientName: patient.name,
      maskedPhone,
      recoveryMethods: ['truecaller', 'contact_lab'],
    })
  } catch (err) {
    console.error('Initiate recovery error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
