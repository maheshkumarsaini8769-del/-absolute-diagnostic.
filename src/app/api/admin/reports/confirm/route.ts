import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    const { reportId, patientId, action } = body

    if (!reportId || !action) {
      return NextResponse.json({ error: 'reportId and action required' }, { status: 400 })
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (action === 'confirm_link') {
      if (!patientId) {
        return NextResponse.json({ error: 'patientId required for confirm_link' }, { status: 400 })
      }

      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          patientId,
          status: 'ready',
          matchConfidence: 'CONFIRMED_BY_ADMIN',
        }
      })

      await logAudit(admin.id, 'report_confirmed', 'report', reportId,
        `Report confirmed and linked to patient ${patientId}`)

      return NextResponse.json({ report: updated, action: 'linked' })
    }

    if (action === 'choose_different') {
      if (!patientId) {
        return NextResponse.json({ error: 'patientId required' }, { status: 400 })
      }

      const previousPatient = report.patientId
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          patientId,
          status: 'ready',
          matchConfidence: 'REASSIGNED_BY_ADMIN',
          matchMethod: 'admin_reassign',
        }
      })

      await logAudit(admin.id, 'report_reassigned', 'report', reportId,
        `Report reassigned from patient ${previousPatient} to patient ${patientId}`)

      return NextResponse.json({ report: updated, action: 'reassigned' })
    }

    if (action === 'keep_unmatched') {
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'unmatched',
        }
      })

      await logAudit(admin.id, 'report_kept_unmatched', 'report', reportId,
        `Report kept as unmatched by admin`)

      return NextResponse.json({ report: updated, action: 'unmatched' })
    }

    if (action === 'update_status') {
      const { status } = body
      if (!status) {
        return NextResponse.json({ error: 'status required' }, { status: 400 })
      }

      const updated = await prisma.report.update({
        where: { id: reportId },
        data: { status }
      })

      await logAudit(admin.id, 'report_status_changed', 'report', reportId,
        `Report status changed to ${status}`)

      return NextResponse.json({ report: updated, action: 'status_updated' })
    }

    if (action === 'delete') {
      // Also delete the physical file
      const reportAny = report as any
      if (reportAny.fileUrl && reportAny.fileUrl.startsWith('/api/reports/file/')) {
        const filePath = reportAny.fileUrl.replace('/api/reports/file/', '')
        const fullPath = path.resolve('uploads', filePath)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }
      }

      await prisma.report.delete({ where: { id: reportId } })

      await logAudit(admin.id, 'report_deleted', 'report', reportId,
        `Report "${report.fileName}" deleted`)

      return NextResponse.json({ action: 'deleted' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Report confirm error:', error)
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
