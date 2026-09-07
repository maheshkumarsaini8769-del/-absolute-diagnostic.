import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { Report } from '@/models'

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'reports:approve')
    const body = await request.json()
    const { reportId, action, reason } = body

    if (!reportId || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'reportId and action (approve|reject) required' }, { status: 400 })
    }

    const report = await Report.findById(reportId)
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.status !== 'uploaded' && report.status !== 'report_under_review') {
      return Response.json({ error: `Cannot approve/reject report in status: ${report.status}` }, { status: 400 })
    }

    const oldStatus = report.status

    if (action === 'approve') {
      report.status = 'report_ready'
      report.approvedBy = admin.name
      report.approvedAt = new Date()
    } else {
      report.status = 'rejected'
      report.rejectedAt = new Date()
      report.rejectReason = reason || 'Rejected by admin'
    }

    await report.save()

    await logAudit(admin.id, action === 'approve' ? 'REPORT_APPROVE' : 'REPORT_REJECT', 'report', reportId, `Report ${report.testName} ${action}d`, oldStatus, report.status)

    if (action === 'approve' && report.patientId) {
      const patient = await prisma.patient.findUnique({ where: { id: report.patientId.toString() } })
      if (patient?.verifiedEmail) {
        await sendEmail(
          patient.verifiedEmail,
          'Your Report is Ready - Absolute Diagnostic',
          `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#7C3AED,#6D28D9);border-radius:12px;padding:30px;text-align:center;"><h2 style="color:white;margin:0 0 8px;">Absolute Diagnostic</h2><p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">Report Ready</p></div><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:30px;text-align:center;"><p style="color:#475569;font-size:14px;margin:0 0 20px;">Your diagnostic report for <strong>${report.testName}</strong> is ready.</p><p style="color:#475569;font-size:14px;margin:0 0 20px;">Please log in to view your report.</p><p style="color:#94a3b8;font-size:12px;margin:0;">This is an automated notification. Do not reply to this email.</p></div></body></html>`
        )
      }
    }

    return Response.json({ success: true, status: report.status })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Report approval error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
