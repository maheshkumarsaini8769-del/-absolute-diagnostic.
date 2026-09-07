import { prisma } from '@/lib/prisma'
import { verifyWalkInPatient } from '@/lib/patient-matching'
import { generateToken } from '@/lib/auth'

const MAX_ATTEMPTS = 5
const RATE_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return Response.json({ error: 'Mobile number and password are required' }, { status: 400 })
    }

    const normalizedPhone = phone.trim()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Rate limiting: check recent failed attempts
    const recentAttempts = await prisma.walkInLoginAttempt.findMany({
      where: {
        phone: normalizedPhone,
        createdAt: { gt: new Date(Date.now() - RATE_WINDOW_MS) }
      },
      orderBy: { createdAt: 'desc' }
    })

    const failedAttempts = recentAttempts.filter(a => !a.success).length
    if (failedAttempts >= MAX_ATTEMPTS) {
      return Response.json({
        error: 'Too many failed attempts. Please try again after 15 minutes.'
      }, { status: 429 })
    }

    // Parse password: first 4 letters + age
    const passwordMatch = password.trim().match(/^([A-Za-z\u0900-\u097F]+?)(\d+)$/)
    if (!passwordMatch) {
      await prisma.walkInLoginAttempt.create({
        data: { phone: normalizedPhone, success: false, ipAddress, userAgent }
      })
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const namePart = passwordMatch[1]
    const age = parseInt(passwordMatch[2], 10)

    if (isNaN(age) || age < 1 || age > 150) {
      await prisma.walkInLoginAttempt.create({
        data: { phone: normalizedPhone, success: false, ipAddress, userAgent }
      })
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Find matching patient
    const patient = await verifyWalkInPatient(normalizedPhone, namePart, age)

    if (!patient) {
      await prisma.walkInLoginAttempt.create({
        data: { phone: normalizedPhone, success: false, ipAddress, userAgent }
      })
      // Generic error message to prevent account enumeration
      return Response.json({
        error: 'Details match नहीं हुईं. कृपया अपना registered mobile number, name और age check करें.'
      }, { status: 401 })
    }

    // Success - log attempt
    await prisma.walkInLoginAttempt.create({
      data: { phone: normalizedPhone, success: true, ipAddress, userAgent }
    })

    // Generate session token (valid for 30 minutes)
    const token = generateToken(patient.id, 'patient')

    // Fetch reports
    const reports = await prisma.report.findMany({
      where: { patientId: patient.id },
      orderBy: { reportDate: 'desc' }
    })

    const reportBookingIds = reports.map(r => r.bookingId).filter(Boolean) as string[]
    const reportBookings = reportBookingIds.length > 0 ? await prisma.booking.findMany({
      where: { id: { in: reportBookingIds } },
      select: { id: true, bookingId: true, createdAt: true }
    }) : []
    const bookingMap = new Map(reportBookings.map(b => [b.id, b]))

    const reportList = reports.map(r => {
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

    return Response.json({
      success: true,
      token,
      patientName: patient.name,
      patientId: patient.id,
      reports: reportList,
      expiresIn: 1800 // 30 minutes
    })
  } catch (error) {
    console.error('Walk-in login error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
