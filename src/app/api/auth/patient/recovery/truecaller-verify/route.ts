import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { verificationService } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { patientId, payload } = body

    if (!patientId || !payload) {
      return NextResponse.json(
        { error: 'Patient ID and Truecaller verification payload are required.' },
        { status: 400 }
      )
    }

    // Process Truecaller verification through VerificationService
    const result = await verificationService.processRecoveryVerification(patientId, 'truecaller', payload)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Identity verified successfully via Truecaller.',
      resetToken: result.resetToken,
      expiresAt: result.expiresAt,
      patient: result.patient,
    })
  } catch (err) {
    console.error('Truecaller verify error:', err)
    return NextResponse.json({ error: 'Internal server error during verification.' }, { status: 500 })
  }
}
