import { verifyToken } from '@/lib/auth'
import { Report, ReportAccessLog } from '@/models'
import mongoose from 'mongoose'

function getReportQuery(id: string) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { _id: id }] }
  }
  return { _id: id }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('Authorization')
    let token: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      const cookieHeader = request.headers.get('Cookie')
      const match = cookieHeader?.match(/session_token=([^;]+)/)
      if (match) token = match[1]
    }

    if (!token) {
      return Response.json({ error: 'Authorization required' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return Response.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const requestorId = payload.adminId || payload.patientId
    if (!requestorId) {
      return Response.json({ error: 'Invalid session' }, { status: 401 })
    }

    const report = await Report.findOne({ ...getReportQuery(id), isDeleted: { $ne: true } })
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    const isAdmin = payload.type === 'admin'
    const isOwner = report.patientId && requestorId === report.patientId.toString()

    if (!isAdmin && !isOwner) {
      await ReportAccessLog.create({
        reportId: report._id,
        patientId: requestorId || undefined,
        verificationMethod: 'unauthorized_attempt',
        success: false,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      })
      return Response.json({ error: 'Access denied: You can only view your own reports' }, { status: 403 })
    }

    const isReadyStatus = ['ready', 'published', 'uploaded', 'report_ready'].includes(report.status)
    if (!isAdmin && !isReadyStatus) {
      return Response.json({
        error: 'Report is under clinical review and not ready yet',
        status: report.status
      }, { status: 400 })
    }

    const tempUrl = `${report.fileUrl}?expires=${Date.now() + 15 * 60 * 1000}`

    await ReportAccessLog.create({
      reportId: report._id,
      patientId: requestorId || undefined,
      verificationMethod: isAdmin ? 'admin_token' : 'patient_session',
      success: true,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return Response.json({
      report: {
        id: report._id.toString(),
        testName: report.testName,
        reportDate: report.reportDate,
        fileName: report.fileName,
        status: report.status,
        analysisData: report.analysisData,
        tempUrl,
        expiresIn: 900,
      }
    })
  } catch (error) {
    console.error('Secure report access error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
