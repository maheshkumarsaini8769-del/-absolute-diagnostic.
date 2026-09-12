import { NextResponse } from 'next/server'
import { verifyPatientOTP } from '@/lib/otp'
import { generateToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = (body.email || '').trim()
    const otp = (body.otp || body.code || '').trim()
    const type = body.type

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    if (typeof otp !== 'string' || otp.length !== 6) {
      return NextResponse.json({ error: 'OTP must be 6 digits' }, { status: 400 })
    }

    const otpType = (type === 'booking' || type === 'report') ? type : 'report'
    const result = await verifyPatientOTP(email, otp, otpType)

    if (!result.success || !result.patient) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    // Create patient session token
    const token = generateToken(result.patient.id, 'patient')

    // Fetch patient's reports
    const { prisma } = await import('@/lib/prisma')
    const reports = await prisma.report.findMany({
      where: { patientId: result.patient.id },
      orderBy: { reportDate: 'desc' }
    })

    const reportBookingIds = reports.map((r: any) => r.bookingId).filter(Boolean) as string[]
    const reportBookings = reportBookingIds.length > 0 ? await prisma.booking.findMany({
      where: { id: { in: reportBookingIds } },
      select: { id: true, bookingId: true, createdAt: true }
    }) : []
    const bookingMap = new Map(reportBookings.map((b: any) => [b.id, b]))

    const reportList = reports.map((r: any) => {
      const booking = r.bookingId ? bookingMap.get(r.bookingId) : null
      return {
        id: r.id,
        testName: r.testName,
        reportDate: r.reportDate,
        status: r.status,
        fileName: r.fileName,
        bookingId: booking?.bookingId || null,
        collectionDate: booking?.createdAt || null,
      }
    })

    return NextResponse.json({
      success: true,
      token,
      patientName: result.patient.name,
      patientId: result.patient.id,
      reports: reportList,
      expiresIn: 1800
    }, {
      headers: {
        'Set-Cookie': `session_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800`
      }
    })
  } catch (error) {
    console.error('Patient OTP verify error:', error)
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}
