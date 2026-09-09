import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Report, Patient, Booking, ReportFile } from '@/models'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

async function findReportById(id: string) {
  if (!id) return null
  if (mongoose.Types.ObjectId.isValid(id)) {
    const doc = await Report.findById(id)
    if (doc) return doc
  }
  return await Report.findOne({ _id: id })
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    await connectDB()
    const { id } = await context.params

    const reportDoc = await findReportById(id)
    if (!reportDoc) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const report = reportDoc.toObject ? reportDoc.toObject() : reportDoc

    const patient = report.patientId
      ? await Patient.findById(report.patientId).lean()
      : null

    return NextResponse.json({
      report: {
        ...report,
        id: (report as any)._id.toString(),
        patient,
      }
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    await connectDB()
    const { id } = await context.params
    const body = await request.json()

    const report = await findReportById(id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
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

    return NextResponse.json({
      report: {
        ...report.toObject(),
        id: report._id.toString(),
        patient,
      }
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    await connectDB()
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
    }

    const existing = await findReportById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const reportIdStr = existing._id.toString()
    const reportFileName = existing.fileName || 'report.pdf'

    // 1. Soft delete flag immediately to remove from all lists
    try {
      existing.isDeleted = true
      await existing.save()
    } catch (sErr) {
      console.warn('Could not set isDeleted flag:', sErr)
    }

    // 2. Try deleting physical file safely
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

    // 3. Unlink from booking if linked
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
                note: `Report "${reportFileName}" was deleted.`,
              }
            }
          }
        )
      } catch (bErr) {
        console.warn('Could not unlink report from booking:', bErr)
      }
    }

    // 4. Delete binary file from MongoDB Atlas
    try {
      await ReportFile.deleteMany({ reportId: existing._id })
    } catch (rfErr) {
      console.warn('Could not delete ReportFile records:', rfErr)
    }

    // 5. Permanently delete report record from DB
    await Report.deleteOne({ _id: existing._id })

    try {
      await logAudit(admin.id, 'DELETE', 'report', reportIdStr, `Report "${reportFileName}" deleted`)
    } catch {
      // Non-critical audit log
    }

    return NextResponse.json({ success: true, deletedId: reportIdStr })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
