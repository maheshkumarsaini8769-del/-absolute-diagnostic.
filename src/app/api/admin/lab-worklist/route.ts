import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { LabWorklist, Sample, SampleStatusHistory, Notification } from '@/models'

export const dynamic = 'force-dynamic'

// Critical reference ranges checker
function evaluateFlag(name: string, valStr: string): { flag: 'normal' | 'high' | 'low' | 'critical'; isCritical: boolean } {
  const val = parseFloat(valStr)
  if (isNaN(val)) return { flag: 'normal', isCritical: false }

  const lowerName = name.toLowerCase()

  // Critical Panic Thresholds
  if (lowerName.includes('glucose') || lowerName.includes('sugar')) {
    if (val < 50 || val > 400) return { flag: 'critical', isCritical: true }
    if (val > 140) return { flag: 'high', isCritical: false }
    if (val < 70) return { flag: 'low', isCritical: false }
  }

  if (lowerName.includes('hemoglobin') || lowerName.includes('hb')) {
    if (val < 7.0 || val > 20.0) return { flag: 'critical', isCritical: true }
    if (val < 12.0) return { flag: 'low', isCritical: false }
    if (val > 17.5) return { flag: 'high', isCritical: false }
  }

  if (lowerName.includes('potassium')) {
    if (val < 2.8 || val > 6.2) return { flag: 'critical', isCritical: true }
    if (val < 3.5) return { flag: 'low', isCritical: false }
    if (val > 5.1) return { flag: 'high', isCritical: false }
  }

  if (lowerName.includes('platelet')) {
    if (val < 30000 || val > 1000000) return { flag: 'critical', isCritical: true }
    if (val < 150000) return { flag: 'low', isCritical: false }
    if (val > 450000) return { flag: 'high', isCritical: false }
  }

  if (lowerName.includes('creatinine')) {
    if (val > 5.0) return { flag: 'critical', isCritical: true }
    if (val > 1.3) return { flag: 'high', isCritical: false }
  }

  return { flag: 'normal', isCritical: false }
}

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'worklist:read')
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const criticalOnly = searchParams.get('critical') === 'true'

    const filter: Record<string, any> = {}
    if (status && status !== 'all') filter.status = status
    if (criticalOnly) filter.criticalAlert = true

    const worklists = await LabWorklist.find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean()

    const criticalCount = await LabWorklist.countDocuments({ criticalAlert: true })
    const pendingCount = await LabWorklist.countDocuments({ status: 'pending_entry' })

    return NextResponse.json({
      worklists,
      criticalCount,
      pendingCount,
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List worklist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'worklist:write')
    const body = await request.json()

    const {
      sampleId,
      bookingId,
      patientId,
      patientName,
      patientAge,
      patientGender,
      testName,
      parameters = [],
      technicianNotes,
      status = 'results_entered'
    } = body

    if (!sampleId || !patientName || !testName) {
      return NextResponse.json({ error: 'Missing required worklist fields' }, { status: 400 })
    }

    // Process parameters & evaluate flags
    let hasCritical = false
    const evaluatedParams = parameters.map((p: any) => {
      const evaluation = evaluateFlag(p.name, p.value)
      if (evaluation.isCritical) hasCritical = true
      return {
        ...p,
        flag: evaluation.flag,
        isCritical: evaluation.isCritical,
      }
    })

    const worklist = await LabWorklist.findOneAndUpdate(
      { sampleId, testName },
      {
        $set: {
          bookingId: bookingId || undefined,
          patientId: patientId || undefined,
          patientName,
          patientAge,
          patientGender,
          testName,
          parameters: evaluatedParams,
          technicianName: admin.name,
          technicianNotes,
          status,
          criticalAlert: hasCritical,
        }
      },
      { upsert: true, returnDocument: 'after' }
    )

    // Also update associated Sample status to report_under_review
    if (status === 'results_entered') {
      const sample = await Sample.findOne({ sampleId })
      if (sample) {
        const oldStatus = sample.status
        sample.status = 'report_under_review'
        sample.processedAt = new Date()
        await sample.save()

        await SampleStatusHistory.create({
          sampleId: sample._id,
          oldStatus,
          newStatus: 'report_under_review',
          changedBy: admin._id,
          changedByName: admin.name,
          notes: `Results entered by ${admin.name} for ${testName}. Sent to Pathologist.`,
        })
      }
    }

    // If critical alert detected, generate urgent notification
    if (hasCritical) {
      await Notification.create({
        title: 'CRITICAL VALUE ALERT',
        message: `Panic value detected for patient ${patientName} on ${testName} (Sample: ${sampleId}). Immediate clinical review required!`,
        type: 'critical_alert',
        isRead: false,
      })
    }

    return NextResponse.json({ success: true, worklist, isCritical: hasCritical }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Submit worklist results error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
