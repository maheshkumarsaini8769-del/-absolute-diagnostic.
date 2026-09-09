import { Report, Patient, Booking, ReportFile } from '@/models'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

function getReportQuery(id: string) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { _id: id }] }
  }
  return { _id: id }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await context.params

    const report = await Report.findOne(getReportQuery(id)).lean()
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    const patient = report.patientId
      ? await Patient.findById(report.patientId).lean()
      : null

    return Response.json({
      report: {
        ...report,
        id: (report as any)._id.toString(),
        patient,
      }
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get report error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params
    const body = await request.json()

    const report = await Report.findOne(getReportQuery(id))
    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    if (body.status) report.status = body.status
    if (body.fileUrl) report.fileUrl = body.fileUrl
    if (body.fileName) report.fileName = body.fileName
    if (body.testName) report.testName = body.testName
    if (body.patientId && mongoose.Types.ObjectId.isValid(body.patientId)) {
      report.patientId = new mongoose.Types.ObjectId(body.patientId)
    }

    await report.save()

    const patient = report.patientId ? await Patient.findById(report.patientId).lean() : null

    await logAudit(admin.id, 'UPDATE', 'report', id, JSON.stringify(body))

    return Response.json({
      report: {
        ...report.toObject(),
        id: report._id.toString(),
        patient,
      }
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update report error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params

    const existing = await Report.findOne(getReportQuery(id))
    if (!existing) {
      return Response.json({ error: 'Report not found' }, { status: 404 })
    }

    // Try deleting physical file safely
    if (existing.fileUrl) {
      try {
        const cleanPath = existing.fileUrl.replace(/^\/api\/reports\/file\//, '').replace(/^\/uploads\/reports\//, '')
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
        console.warn('Could not unlink physical report file:', fileErr)
      }
    }

    // Unlink from booking if linked
    if (existing.bookingId) {
      try {
        await Booking.updateOne(
          { _id: existing.bookingId },
          {
            $unset: { reportId: 1 },
            $push: {
              timeline: {
                stage: 'report_deleted',
                timestamp: new Date(),
                performedBy: admin.name || admin.email || 'Admin',
                note: `Report "${existing.fileName}" was deleted.`,
              }
            }
          }
        )
      } catch (bErr) {
        console.warn('Could not unlink report from booking:', bErr)
      }
    }

    // Delete binary file from MongoDB Atlas
    try {
      await ReportFile.deleteMany({ reportId: existing._id })
    } catch (rfErr) {
      console.warn('Could not delete ReportFile records:', rfErr)
    }

    // Delete report record
    await Report.deleteOne(getReportQuery(id))

    await logAudit(admin.id, 'DELETE', 'report', id, `Report "${existing.fileName}" deleted`)

    return Response.json({ success: true, deletedId: id })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete report error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
