import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { LabWorklist, Sample, Report, Notification } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'reports:approve')
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'results_entered'

    const filter: Record<string, any> = {}
    if (status !== 'all') {
      filter.status = status
    }

    const queue = await LabWorklist.find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean()

    const pendingCount = await LabWorklist.countDocuments({ status: 'results_entered' })
    const criticalCount = await LabWorklist.countDocuments({ criticalAlert: true, status: 'results_entered' })

    return NextResponse.json({ queue, pendingCount, criticalCount })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List pathologist queue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'reports:approve')
    const body = await request.json()
    const { worklistId, action, pathologistNotes, reason, amendedParameters } = body

    if (!worklistId || !action) {
      return NextResponse.json({ error: 'Missing worklistId or action' }, { status: 400 })
    }

    const worklist = await LabWorklist.findById(worklistId)
    if (!worklist) {
      return NextResponse.json({ error: 'Worklist entry not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Approve and publish
      worklist.status = 'verified'
      worklist.pathologistName = admin.name || 'Dr. Pathologist, MD'
      worklist.pathologistNotes = pathologistNotes || 'Verified and approved for release.'
      await worklist.save()

      // Update sample status to report_ready
      const sample = await Sample.findOne({ sampleId: worklist.sampleId })
      if (sample) {
        sample.status = 'report_ready'
        await sample.save()
      }

      // Create/Publish Report in database so patient can immediately see it!
      const reportTitle = `${worklist.testName} Report`
      const report = await Report.create({
        patientId: worklist.patientId ? worklist.patientId.toString() : undefined,
        bookingId: worklist.bookingId ? worklist.bookingId.toString() : undefined,
        testName: worklist.testName,
        status: 'published',
        fileName: `${worklist.sampleId}-${worklist.testName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        fileUrl: `/api/reports/view/${worklist._id}`,
        reportDate: new Date(),
        uploadedBy: admin.name,
        approvedBy: admin.name,
        approvedAt: new Date(),
        extractedName: worklist.patientName,
        extractedAge: worklist.patientAge,
        extractedGender: worklist.patientGender,
        rawExtractedText: JSON.stringify(worklist.parameters),
      })

      // Send patient notification
      await Notification.create({
        title: 'Diagnostic Report Ready',
        message: `Your test report for ${worklist.testName} is now ready and available in your patient dashboard.`,
        type: 'report_ready',
        isRead: false,
      })

      return NextResponse.json({
        success: true,
        message: 'Report approved and published to patient',
        reportId: report._id,
        worklist
      })
    }

    if (action === 'reject') {
      worklist.status = 'rejected'
      worklist.pathologistNotes = pathologistNotes || 'Sample re-run requested due to value discrepancy.'
      await worklist.save()

      const sample = await Sample.findOne({ sampleId: worklist.sampleId })
      if (sample) {
        sample.status = 'processing'
        await sample.save()
      }

      return NextResponse.json({ success: true, message: 'Report returned to technician for re-run' })
    }

    if (action === 'amend') {
      // Record amendment history
      const previousParams = [...worklist.parameters]
      worklist.parameters = amendedParameters || worklist.parameters
      worklist.status = 'amended'
      worklist.pathologistNotes = pathologistNotes || 'Amended report'
      
      if (!worklist.amendmentHistory) worklist.amendmentHistory = []
      worklist.amendmentHistory.push({
        amendedAt: new Date(),
        amendedBy: admin.name,
        reason: reason || 'Value correction after clinical review',
        previousParameters: previousParams,
      })

      await worklist.save()

      return NextResponse.json({ success: true, message: 'Report amended and logged in audit history' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Pathologist review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
