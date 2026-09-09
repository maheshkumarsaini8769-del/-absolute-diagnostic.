import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { extractPDFText, computeFileHash, getUploadPath, analyzeReportData } from '@/lib/pdf-extraction'
import { matchPatient, findOrCreatePatient } from '@/lib/patient-matching'
import { Booking, Report, Patient, ReportFile } from '@/models'
import { safeDate } from '@/lib/date-parser'
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)

    const formData = await request.formData()
    const file = (formData.get('report') || formData.get('file')) as File | null

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No report file provided' }, { status: 400 })
    }

    const filename = file.name || 'report.pdf'
    const ext = path.extname(filename).toLowerCase()
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg']
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'Only PDF and image (PNG, JPG) files are allowed' }, { status: 400 })
    }

    const MAX_SIZE = 25 * 1024 * 1024 // 25MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check duplicate via file hash
    const fileHash = computeFileHash(buffer)
    const existingReport = await Report.findOne({ fileHash, isDeleted: { $ne: true } })
    if (existingReport) {
      return NextResponse.json({
        error: 'duplicate',
        message: 'A report with this exact file already exists.',
        existingReport: {
          id: existingReport._id.toString(),
          patientId: existingReport.patientId?.toString() || null,
          testName: existingReport.testName,
          uploadedAt: existingReport.uploadedAt,
        }
      }, { status: 409 })
    }

    // Save file locally (cache)
    let fullPath: string
    try {
      fullPath = getUploadPath(filename)
      fs.mkdirSync(path.dirname(fullPath), { recursive: true })
      fs.writeFileSync(fullPath, buffer)
    } catch {
      // Fallback for restricted serverless environments
      const tmpDir = path.join('/tmp', 'uploads', 'reports')
      fs.mkdirSync(tmpDir, { recursive: true })
      fullPath = path.join(tmpDir, `${Date.now()}-${filename}`)
      fs.writeFileSync(fullPath, buffer)
    }

    // Compute relative path for URL serving
    const relativeUrl = fullPath.includes('reports')
      ? fullPath.substring(fullPath.indexOf('reports') + 'reports'.length).replace(/^[\\/]+/, '').replace(/\\/g, '/')
      : path.basename(fullPath)
    const fileUrl = `/api/reports/file/${relativeUrl}`

    // Extract text from PDF / document
    let rawText = ''
    let extractionError: string | null = null
    if (ext === '.pdf') {
      try {
        rawText = await extractPDFText(buffer)
      } catch (e: any) {
        extractionError = e.message
        rawText = buffer.toString('utf-8').substring(0, 1000)
      }
    } else {
      rawText = `Image Report: ${filename}\nUploaded: ${new Date().toISOString()}`
    }

    // Fast automatic analysis with filename heuristic
    const analysis = analyzeReportData(rawText, filename)
    const extracted = analysis.patient

    // Get form parameters / overrides
    let targetBookingId = formData.get('bookingId') as string | null
    let targetPatientId = formData.get('patientId') as string | null
    const manualName = (formData.get('patientName') as string | null) || null
    const manualMobile = (formData.get('mobile') as string | null) || null
    const manualAgeStr = formData.get('age') as string | null
    const manualAge = manualAgeStr ? parseInt(manualAgeStr, 10) : null
    const manualTest = (formData.get('testName') as string | null) || null

    // If bookingId was provided, look up booking
    let linkedBooking: any = null
    if (targetBookingId) {
      if (mongoose.Types.ObjectId.isValid(targetBookingId)) {
        linkedBooking = await Booking.findById(targetBookingId)
      }
      if (!linkedBooking) {
        linkedBooking = await Booking.findOne({ bookingId: targetBookingId })
      }
      if (linkedBooking) {
        targetBookingId = linkedBooking._id.toString()
        if (!targetPatientId && linkedBooking.patientId) {
          targetPatientId = linkedBooking.patientId.toString()
        }
      }
    }

    const name = manualName || (linkedBooking?.patientName) || extracted.name
    const mobile = manualMobile || (linkedBooking?.patientPhone) || extracted.mobile
    const age = manualAge !== null && manualAge !== undefined ? manualAge : extracted.age
    const testName = manualTest || (linkedBooking?.items?.[0]?.testName) || extracted.testName || 'Diagnostic Report'

    // Patient matching if no explicit patientId
    let matchResult = null
    let autoLinked = false

    if (targetPatientId) {
      autoLinked = true
    } else if (mobile || name) {
      matchResult = await matchPatient({
        name: name || '',
        mobile,
        age,
        gender: extracted.gender,
        patientId: extracted.patientId,
        patientUHID: extracted.patientUHID,
        bookingId: targetBookingId || extracted.bookingId,
        testName,
        sampleType: extracted.sampleType,
        reportDate: extracted.reportDate,
        collectionDate: extracted.collectionDate,
        rawText: rawText.substring(0, 5000),
        confidence: extracted.confidence,
      })

      if (matchResult.confidence === 'HIGH' && matchResult.patientId) {
        targetPatientId = matchResult.patientId
        if (!targetBookingId && matchResult.bookingId) {
          targetBookingId = matchResult.bookingId
        }
        autoLinked = true
      } else if (matchResult.confidence === 'MEDIUM' && name && mobile && matchResult.candidates.length === 1) {
        targetPatientId = matchResult.patientId
        autoLinked = true
      }
    }

    // Auto-create patient if not found but name and mobile exist
    if (!targetPatientId && name && mobile) {
      targetPatientId = await findOrCreatePatient({
        name,
        mobile,
        age,
        gender: extracted.gender,
      })
      autoLinked = true
    }

    // Status: ready for review/verification
    const reportStatus = 'under_review'

    // Safe date parsing to guarantee NEVER "Invalid Date"
    const parsedReportDate = safeDate(extracted.reportDate, new Date()) || new Date()
    const parsedCollectionDate = safeDate(extracted.collectionDate, parsedReportDate) || parsedReportDate

    const reportDoc = await Report.create({
      patientId: targetPatientId ? new mongoose.Types.ObjectId(targetPatientId) : undefined,
      bookingId: targetBookingId && mongoose.Types.ObjectId.isValid(targetBookingId) ? new mongoose.Types.ObjectId(targetBookingId) : undefined,
      testName,
      reportDate: parsedReportDate,
      fileUrl,
      fileName: filename,
      status: reportStatus,
      uploadedAt: new Date(),
      uploadedBy: admin.name || admin.email || 'Admin',
      fileHash,
      patientName: name || extracted.name || undefined,
      patientPhone: mobile || extracted.mobile || undefined,
      patientAge: age !== null && age !== undefined ? age : undefined,
      patientGender: extracted.gender || undefined,
      patientUHID: extracted.patientUHID || extracted.patientId || undefined,
      sampleType: extracted.sampleType || undefined,
      receivedDate: parsedCollectionDate,
      extractedName: extracted.name || name || undefined,
      extractedMobile: extracted.mobile || mobile || undefined,
      extractedAge: extracted.age !== null && extracted.age !== undefined ? extracted.age : (age || undefined),
      extractedGender: extracted.gender || undefined,
      extractedPatientId: extracted.patientId || undefined,
      extractedTestName: extracted.testName || testName,
      rawExtractedText: rawText.substring(0, 5000),
      matchConfidence: matchResult?.confidence || (autoLinked ? 'HIGH' : 'NONE'),
      matchMethod: targetBookingId ? 'booking_link' : (matchResult?.matchMethod || (autoLinked ? 'manual' : 'no_match')),
      matchScore: matchResult?.score || (autoLinked ? 100 : 0),
      matchedPatientId: targetPatientId ? new mongoose.Types.ObjectId(targetPatientId) : undefined,
      collectionDate: parsedCollectionDate,
      analysisData: {
        parameters: analysis.parameters,
        criticalFlags: analysis.criticalFlags,
        pathologist: analysis.pathologist,
        summary: analysis.summary,
        hasAbnormal: analysis.hasAbnormal,
      },
      isDeleted: false,
    })

    // Store binary buffer permanently in MongoDB Atlas (ReportFile) to eliminate Vercel serverless 404s!
    try {
      const contentType = ext === '.png' ? 'image/png' : (ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/pdf')
      await ReportFile.findOneAndUpdate(
        { reportId: reportDoc._id },
        {
          reportId: reportDoc._id,
          fileName: filename,
          contentType,
          data: buffer,
          size: buffer.length,
          fileHash,
          uploadedAt: new Date(),
        },
        { upsert: true, new: true }
      )
    } catch (saveErr) {
      console.error('Failed to persist ReportFile to MongoDB:', saveErr)
    }

    // If attached to a booking, update booking status and timeline
    if (linkedBooking) {
      linkedBooking.reportId = reportDoc._id
      linkedBooking.status = 'under_review'
      if (!linkedBooking.timeline) linkedBooking.timeline = []
      linkedBooking.timeline.push({
        stage: 'report_uploaded',
        timestamp: new Date(),
        performedBy: admin.name || admin.email || 'Admin',
        note: `Report "${filename}" uploaded & analyzed (${analysis.parameters.length} parameters extracted).`,
      })
      await linkedBooking.save()
    }

    // Audit log
    await logAudit(
      admin.id,
      'report_uploaded',
      'report',
      reportDoc._id.toString(),
      `Report "${filename}" uploaded for ${name || 'unknown'}. Status: under_review`
    )

    return NextResponse.json({
      success: true,
      report: {
        id: reportDoc._id.toString(),
        fileName: reportDoc.fileName,
        testName: reportDoc.testName,
        status: reportDoc.status,
        patientId: reportDoc.patientId?.toString() || null,
        bookingId: reportDoc.bookingId?.toString() || null,
        fileUrl: reportDoc.fileUrl,
      },
      extraction: {
        name: extracted.name || null,
        mobile: extracted.mobile || null,
        age: extracted.age !== undefined && extracted.age !== null ? extracted.age : null,
        gender: extracted.gender || null,
        testName: extracted.testName || testName,
        confidence: extracted.confidence || 0,
        patientId: extracted.patientId || null,
        bookingId: extracted.bookingId || null,
        reportDate: extracted.reportDate || null,
        error: extractionError,
      },
      match: matchResult ? {
        confidence: matchResult.confidence,
        score: matchResult.score,
        patientId: matchResult.patientId,
        patientName: matchResult.patientName,
        patientMobile: matchResult.patientMobile,
        patientAge: matchResult.patientAge,
        matchMethod: matchResult.matchMethod,
        candidates: matchResult.candidates || [],
      } : (targetPatientId ? {
        confidence: 'HIGH',
        score: 100,
        patientId: targetPatientId,
        patientName: name,
        patientMobile: mobile,
        patientAge: age,
        matchMethod: targetBookingId ? 'booking_link' : 'direct',
        candidates: [{
          id: targetPatientId,
          name: name || '',
          phone: mobile || '',
          age: age || undefined,
          score: 100,
          matchReason: 'Direct or linked booking match'
        }]
      } : null),
      analysis: {
        patient: extracted,
        parameters: analysis.parameters,
        criticalFlags: analysis.criticalFlags,
        summary: analysis.summary,
        pathologist: analysis.pathologist,
        error: extractionError,
      },
      autoLinked,
      bookingUpdated: !!linkedBooking,
    })
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Report upload error:', error)
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 })
  }
}
