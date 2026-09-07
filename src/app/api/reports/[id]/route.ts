import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    const authHeader = request.headers.get('Authorization')
    let verificationToken = token

    if (!verificationToken && authHeader?.startsWith('Bearer ')) {
      verificationToken = authHeader.substring(7)
    }

    if (!verificationToken) {
      return Response.json({ error: 'Verification token required' }, { status: 401 })
    }

    const payload = verifyToken(verificationToken)
    if (!payload) {
      await prisma.reportAccessLog.create({
        data: {
          reportId: id,
          verificationMethod: 'token',
          success: false,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        }
      })
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    const requestorId = payload.adminId || payload.patientId
    if (!requestorId) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const isAdmin = payload.type === 'admin'
    const isOwner = requestorId === report.patientId

    if (!isAdmin && !isOwner) {
      await prisma.reportAccessLog.create({
        data: {
          reportId: id,
          verificationMethod: 'token',
          success: false,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        }
      })
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const tempUrl = `${report.fileUrl}?expires=${Date.now() + 15 * 60 * 1000}`

    await prisma.reportAccessLog.create({
      data: {
        reportId: id,
        verificationMethod: 'token',
        success: true,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    })

    return Response.json({
      report: {
        id: report.id,
        testName: report.testName,
        reportDate: report.reportDate,
        fileName: report.fileName,
        status: report.status,
        tempUrl,
        expiresIn: 900
      }
    })
  } catch (error) {
    console.error('Get report error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
