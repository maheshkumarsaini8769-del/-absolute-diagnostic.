import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { Report, Booking, ReportFile } from '@/models'
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

function getReportQuery(id: string) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { _id: id }] }
  }
  return { _id: id }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    await connectDB()
    const body = await request.json()

    const { reportId, patientId, action } = body

    if (!reportId || !action) {
      return NextResponse.json({ error: 'reportId and action required' }, { status: 400 })
    }

    let report = null
    if (mongoose.Types.ObjectId.isValid(reportId)) {
      report = await Report.findById(reportId)
    }
    if (!report) {
      report = await Report.findOne(getReportQuery(reportId))
    }
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (action === 'confirm_link') {
      if (!patientId) {
        return NextResponse.json({ error: 'patientId required for confirm_link' }, { status: 400 })
      }

      report.patientId = new mongoose.Types.ObjectId(patientId)
      report.status = 'under_review'
      report.matchConfidence = 'CONFIRMED_BY_ADMIN'
      await report.save()

      await logAudit(admin.id, 'report_confirmed', 'report', reportId,
        `Report confirmed and linked to patient ${patientId}`)

      return NextResponse.json({ report: { ...report.toObject(), id: report._id.toString() }, action: 'linked' })
    }

    if (action === 'choose_different') {
      if (!patientId) {
        return NextResponse.json({ error: 'patientId required' }, { status: 400 })
      }

      const previousPatient = report.patientId
      report.patientId = new mongoose.Types.ObjectId(patientId)
      report.status = 'under_review'
      report.matchConfidence = 'REASSIGNED_BY_ADMIN'
      report.matchMethod = 'admin_reassign'
      await report.save()

      await logAudit(admin.id, 'report_reassigned', 'report', reportId,
        `Report reassigned from patient ${previousPatient} to patient ${patientId}`)

      return NextResponse.json({ report: { ...report.toObject(), id: report._id.toString() }, action: 'reassigned' })
    }

    if (action === 'keep_unmatched') {
      report.status = 'unmatched'
      await report.save()

      await logAudit(admin.id, 'report_kept_unmatched', 'report', reportId,
        `Report kept as unmatched by admin`)

      return NextResponse.json({ report: { ...report.toObject(), id: report._id.toString() }, action: 'unmatched' })
    }

    if (action === 'update_status') {
      const { status } = body
      if (!status) {
        return NextResponse.json({ error: 'status required' }, { status: 400 })
      }

      report.status = status
      if (status === 'verified') {
        report.verifiedBy = admin.name || admin.email || 'Admin'
        report.verifiedAt = new Date()
      } else if (status === 'ready' || status === 'published') {
        report.publishedAt = new Date()
      }
      await report.save()

      // If attached to booking, also sync booking status
      if (report.bookingId) {
        await Booking.updateOne(
          { _id: report.bookingId },
          {
            $set: { status: status === 'ready' || status === 'published' ? 'report_ready' : status },
            $push: {
              timeline: {
                stage: `report_${status}`,
                timestamp: new Date(),
                performedBy: admin.name || admin.email || 'Admin',
                note: `Report status updated to ${status}.`,
              }
            }
          }
        )
      }

      await logAudit(admin.id, 'report_status_changed', 'report', reportId,
        `Report status changed to ${status}`)

      return NextResponse.json({ report: { ...report.toObject(), id: report._id.toString() }, action: 'status_updated' })
    }

    if (action === 'delete') {
      // Also delete the physical file safely
      if (report.fileUrl) {
        try {
          const cleanPath = report.fileUrl.replace(/^\/api\/reports\/file\//, '').replace(/^\/uploads\/reports\//, '')
          const possiblePaths = [
            path.resolve(process.cwd(), 'public', 'uploads', 'reports', cleanPath),
            path.resolve(process.cwd(), 'uploads', 'reports', cleanPath),
            path.resolve('/tmp', 'uploads', 'reports', cleanPath),
          ]
          for (const p of possiblePaths) {
            if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
              fs.unlinkSync(/*turbopackIgnore: true*/ p)
              break
            }
          }
        } catch (fileErr) {
          console.warn('Could not unlink physical file on confirm delete:', fileErr)
        }
      }

      // Unlink from booking if linked
      if (report.bookingId) {
        try {
          await Booking.updateOne(
            { _id: report.bookingId },
            {
              $unset: { reportId: 1 },
              $push: {
                timeline: {
                  stage: 'report_deleted',
                  timestamp: new Date(),
                  performedBy: admin.name || admin.email || 'Admin',
                  note: `Report "${report.fileName}" deleted.`,
                }
              }
            }
          )
        } catch (bErr) {
          console.warn('Booking unlink error on report delete:', bErr)
        }
      }

      // Soft delete flag immediately
      try {
        report.isDeleted = true
        await report.save()
      } catch (sErr) {
        console.warn('Could not set isDeleted on confirm delete:', sErr)
      }

      // Delete binary file from MongoDB Atlas
      try {
        await ReportFile.deleteMany({ reportId: report._id })
      } catch (rfErr) {
        console.warn('Could not delete ReportFile on confirm delete:', rfErr)
      }

      await Report.deleteOne({ _id: report._id })

      try {
        await logAudit(admin.id, 'report_deleted', 'report', reportId,
          `Report "${report.fileName}" deleted`)
      } catch {
        // Non-critical audit log
      }

      return NextResponse.json({ action: 'deleted', success: true, deletedId: reportId })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Report confirm error:', error)
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
