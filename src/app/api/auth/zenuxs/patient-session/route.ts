import { createOAuth, generateSessionToken, createSessionCookie } from '@/lib/zenuxs-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accessToken, redirectUrl } = body

    if (!accessToken) {
      return Response.json({ error: 'Access token required' }, { status: 400 })
    }

    const oauth = createOAuth()
    oauth.importSession({ access_token: accessToken } as any)
    const userInfo = await oauth.getUserInfo()

    if (!userInfo.email) {
      return Response.json({ error: 'No email in user info' }, { status: 400 })
    }

    const normalizedEmail = userInfo.email.toLowerCase().trim()

    let patient = await prisma.patient.findFirst({
      where: { verifiedEmail: normalizedEmail }
    })

    if (!patient) {
      patient = await prisma.patient.findFirst({
        where: { email: normalizedEmail }
      })
    }

    if (!patient && userInfo.phone) {
      const cleanPhone = userInfo.phone.replace(/\D/g, '').slice(-10)
      if (cleanPhone.length === 10) {
        patient = await prisma.patient.findFirst({
          where: { phone: cleanPhone }
        })
      }
    }

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: userInfo.name || normalizedEmail.split('@')[0],
          phone: userInfo.phone ? userInfo.phone.replace(/\D/g, '').slice(-10) : '',
          email: normalizedEmail,
          verifiedEmail: normalizedEmail,
          emailVerifiedAt: new Date(),
          zenuxsSub: userInfo.sub,
          isActivated: true,
          activatedAt: new Date(),
        }
      })
    } else {
      const updates: Record<string, any> = {}
      if (!patient.verifiedEmail) updates.verifiedEmail = normalizedEmail
      if (!patient.emailVerifiedAt) updates.emailVerifiedAt = new Date()
      if (!patient.zenuxsSub) updates.zenuxsSub = userInfo.sub
      if (userInfo.name && !patient.name) updates.name = userInfo.name
      if (!patient.isActivated) {
        updates.isActivated = true
        updates.activatedAt = new Date()
      }
      if (Object.keys(updates).length > 0) {
        await prisma.patient.update({ where: { id: patient.id }, data: updates })
      }
    }

    const sessionToken = generateSessionToken({
      patientId: patient.id,
      email: normalizedEmail,
      name: patient.name,
      type: 'patient',
      zenuxsSub: userInfo.sub,
    })

    const reports = await prisma.report.findMany({
      where: { patientId: patient.id, isDeleted: { ne: true } },
      orderBy: { reportDate: 'desc' }
    })

    const sanitizedReports = reports.map((r: any) => ({
      id: r.id,
      testName: r.testName,
      reportDate: r.reportDate || r.uploadedAt,
      status: r.status,
      fileName: r.fileName,
      bookingId: r.bookingId || null,
      analysisData: r.analysisData,
    }))

    const response = Response.json({
      success: true,
      redirectUrl: redirectUrl || '/reports',
      token: sessionToken,
      patientId: patient.id,
      patientName: patient.name,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
      },
      reports: sanitizedReports,
    })
    response.headers.set('Set-Cookie', createSessionCookie(sessionToken))

    return response
  } catch (error: any) {
    console.error('Zenuxs patient session error:', error)
    return Response.json({
      error: error?.message || 'Authentication with Zenuxs SSO failed. Please verify provider credentials or try another login method.'
    }, { status: 500 })
  }
}
