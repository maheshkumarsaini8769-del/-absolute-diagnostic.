import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { Report, Patient, Booking, Notification } from '@/models'
import mongoose from 'mongoose'

function getReportQuery(id: string) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { _id: id }] }
  }
  return { _id: id }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const { reportId, action, reason, notes } = body

    const validActions = ['verify', 'publish', 'approve', 'reject']
    if (!reportId || !validActions.includes(action)) {
      return Response.json({ error: `reportId and valid action (${validActions.join('|')}) required` }, { status: 400 })
    }

    const report = await Report.findOne(getReportQuery(reportId))
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    const oldStatus = report.status
    const adminIdentifier = admin.name || admin.email || 'Admin'

    if (action === 'verify') {
      report.status = 'verified'
      report.verifiedBy = adminIdentifier
      report.verifiedAt = new Date()
      if (notes) {
        if (!report.analysisData) report.analysisData = {}
        report.analysisData.pathologistNotes = notes
        report.markModified('analysisData')
      }
    } else if (action === 'publish' || action === 'approve') {
      report.status = 'ready'
      if (!report.verifiedBy) {
        report.verifiedBy = adminIdentifier
        report.verifiedAt = new Date()
      }
      report.approvedBy = adminIdentifier
      report.approvedAt = new Date()
      report.publishedAt = new Date()
    } else if (action === 'reject') {
      report.status = 'rejected'
      report.rejectedAt = new Date()
      report.rejectReason = reason || 'Rejected by admin'
    }

    await report.save()

    // Keep audit history
    await logAudit(
      admin.id,
      `REPORT_${action.toUpperCase()}`,
      'report',
      report._id.toString(),
      `Report "${report.testName}" marked as ${report.status}`,
      oldStatus,
      report.status
    )

    // Update booking status & timeline if attached
    if (report.bookingId) {
      const bookingStatus = (action === 'publish' || action === 'approve')
        ? 'report_ready'
        : (action === 'verify' ? 'verified' : report.status)

      await Booking.updateOne(
        { _id: report.bookingId },
        {
          $set: { status: bookingStatus, reportId: report._id },
          $push: {
            timeline: {
              stage: `report_${action}ed`,
              timestamp: new Date(),
              performedBy: adminIdentifier,
              note: `Report ${action}ed by ${adminIdentifier}. Status: ${report.status}`,
            }
          }
        }
      )
    }

    // Patient Notification on Publish / Ready
    if ((action === 'publish' || action === 'approve') && report.patientId) {
      try {
        const patient = await Patient.findById(report.patientId).lean()
        const patientEmail = (patient as any)?.verifiedEmail || (patient as any)?.email

        if (patientEmail) {
          await sendEmail(
            patientEmail,
            'Your Report is Ready - Absolute Diagnostic',
            `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#0052CC,#003380);border-radius:12px;padding:25px;text-align:center;"><h2 style="color:white;margin:0 0 8px;">Absolute Diagnostic</h2><p style="color:rgba(255,255,255,0.8);margin:0;font-size:13px;">Diagnostic Report Ready</p></div><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:24px;text-align:left;"><p style="color:#334155;font-size:14px;margin:0 0 16px;">Dear <strong>${(patient as any)?.name || 'Patient'}</strong>,</p><p style="color:#475569;font-size:14px;margin:0 0 20px;">Your test report for <strong>${report.testName}</strong> has been verified by our clinical pathologist and is ready for viewing.</p><div style="text-align:center;margin:24px 0;"><a href="https://lab-app-green.vercel.app/reports" style="display:inline-block;padding:12px 24px;background:#0052CC;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">View Your Report</a></div><p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">You can access your report using your registered mobile number or email login.</p></div></body></html>`
          )
        }

        // Log notification in Notification collection
        await Notification.create({
          bookingId: report.bookingId ? report.bookingId.toString() : undefined,
          type: 'report_ready',
          title: 'Your Diagnostic Report is Ready',
          message: `Your report for ${report.testName} is now ready to download.`,
          isRead: false,
        })

        report.notifiedAt = new Date()
        await report.save()
      } catch (notifErr) {
        console.warn('Notification trigger warning:', notifErr)
      }
    }

    return Response.json({
      success: true,
      report: {
        id: report._id.toString(),
        status: report.status,
        verifiedBy: report.verifiedBy,
        verifiedAt: report.verifiedAt,
        approvedAt: report.approvedAt,
      }
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Report approval error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
