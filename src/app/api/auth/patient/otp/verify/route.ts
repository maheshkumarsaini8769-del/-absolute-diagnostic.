import { NextResponse } from 'next/server'
import { verifyPatientOTP } from '@/lib/otp'
import { generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Collect all patient IDs associated with this email or phone
    const normalizedEmail = email.toLowerCase().trim()
    const patientIds = [result.patient.id]
    const relatedPatients = await prisma.patient.findMany({
      where: {
        OR: [
          { email: normalizedEmail },
          { verifiedEmail: normalizedEmail },
          ...(result.patient.phone ? [{ phone: result.patient.phone }] : [])
        ]
      },
      select: { id: true, name: true, phone: true }
    })
    relatedPatients.forEach((p: any) => {
      if (p.id && !patientIds.includes(p.id)) patientIds.push(p.id)
    })

    // Find all bookings for these patients, email, or phone
    const patientBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { patientId: { in: patientIds } },
          { patientEmail: normalizedEmail },
          ...(result.patient.phone ? [{ patientPhone: { contains: result.patient.phone.slice(-10) } }] : [])
        ]
      },
      select: { id: true, bookingId: true, createdAt: true }
    })
    const bookingIds = patientBookings.map((b: any) => b.id).filter(Boolean)
    const bookingMap = new Map(patientBookings.map((b: any) => [b.id, b]))

    // Build comprehensive report query
    const reportOrConditions: any[] = [
      { patientId: { in: patientIds } },
      { matchedPatientId: { in: patientIds } }
    ]
    if (bookingIds.length > 0) {
      reportOrConditions.push({ bookingId: { in: bookingIds } })
    }
    if (result.patient.phone) {
      reportOrConditions.push({ extractedMobile: { contains: result.patient.phone.slice(-10) } })
      reportOrConditions.push({ patientPhone: { contains: result.patient.phone.slice(-10) } })
    }

    const reports = await prisma.report.findMany({
      where: {
        OR: reportOrConditions,
        isDeleted: { not: true }
      },
      orderBy: { reportDate: 'desc' }
    })

    const reportList = reports.map((r: any) => {
      const booking = r.bookingId ? bookingMap.get(r.bookingId) : null
      return {
        id: r.id,
        testName: r.testName,
        reportDate: r.reportDate,
        status: r.status,
        fileName: r.fileName,
        fileUrl: r.fileUrl,
        analysisData: r.analysisData || null,
        bookingId: (booking as any)?.bookingId || null,
        collectionDate: (booking as any)?.createdAt || null,
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
