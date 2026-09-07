import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    if (!payload) {
      return Response.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const requestorId = payload.adminId || payload.patientId
    if (!requestorId) {
      return Response.json({ error: 'Invalid session' }, { status: 401 })
    }

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    const isAdmin = payload.type === 'admin'
    const isOwner = requestorId === report.patientId

    if (!isAdmin && !isOwner) {
      await prisma.reportAccessLog.create({
        data: {
          reportId: id,
          patientId: requestorId,
          verificationMethod: 'walkin_token',
          success: false,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        }
      })
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    if (report.status !== 'ready' && report.status !== 'uploaded') {
      return Response.json({
        error: 'Report is not ready yet',
        status: report.status
      }, { status: 400 })
    }

    const tempUrl = `${report.fileUrl}?expires=${Date.now() + 15 * 60 * 1000}`

    await prisma.reportAccessLog.create({
      data: {
        reportId: id,
        patientId: requestorId,
        verificationMethod: isAdmin ? 'admin_token' : 'walkin_token',
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
    console.error('Secure report access error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
