import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { extractPDFText, extractPatientData, computeFileHash, getUploadPath } from '@/lib/pdf-extraction'
import { matchPatient, findOrCreatePatient } from '@/lib/patient-matching'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function parseMultipartForm(buffer: Buffer, boundary: string) {
  const parts: Record<string, { data: Buffer; filename?: string; contentType?: string }> = {}
  const boundaryBuffer = Buffer.from(`--${boundary}`)

  let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length + 2
  let end = buffer.indexOf(boundaryBuffer, start)

  while (start > 1 && end > start) {
    const part = buffer.subarray(start, end)
    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd === -1) { start = end + boundaryBuffer.length + 2; end = buffer.indexOf(boundaryBuffer, start); continue }

    const headers = part.subarray(0, headerEnd).toString()
    const body = part.subarray(headerEnd + 4, part.length - 2) // strip trailing \r\n

    const nameMatch = headers.match(/name="([^"]+)"/)
    const filenameMatch = headers.match(/filename="([^"]+)"/)
    const contentTypeMatch = headers.match(/Content-Type:\s*(.+)/i)

    if (nameMatch) {
      parts[nameMatch[1]] = {
        data: body,
        filename: filenameMatch?.[1],
        contentType: contentTypeMatch?.[1]?.trim(),
      }
    }

    start = end + boundaryBuffer.length + 2
    end = buffer.indexOf(boundaryBuffer, start)
  }
  return parts
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
    }

    const boundaryMatch = contentType.match(/boundary=(.+)/)
    if (!boundaryMatch) {
      return NextResponse.json({ error: 'Missing boundary' }, { status: 400 })
    }

    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const boundary = boundaryMatch[1]
    const parts = parseMultipartForm(buffer, boundary)

    const filePart = parts['report']
    if (!filePart || !filePart.filename) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 })
    }

    if (!filePart.filename.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    if (filePart.data.length > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
    }

    // Check duplicate via file hash
    const fileHash = computeFileHash(filePart.data)
    const existingReport = await prisma.report.findFirst({ where: { fileHash } })
    if (existingReport) {
      return NextResponse.json({
        error: 'duplicate',
        message: 'A report with this exact file already exists.',
        existingReport: {
          id: existingReport.id,
          patientId: existingReport.patientId,
          testName: existingReport.testName,
          uploadedAt: existingReport.uploadedAt,
        }
      }, { status: 409 })
    }

    // Save file securely
    const filePath = getUploadPath(filePart.filename)
    const fullPath = path.resolve(filePath)
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, filePart.data)

    // Extract text from PDF
    let rawText = ''
    let extractionError: string | null = null
    try {
      rawText = await extractPDFText(filePart.data)
    } catch (e: any) {
      extractionError = e.message
    }

    // Extract patient data from text
    const extracted = extractPatientData(rawText)

    // Get manual overrides from form fields
    const manualName = parts['patientName']?.data?.toString() || null
    const manualMobile = parts['mobile']?.data?.toString() || null
    const manualAge = parts['age']?.data?.toString() ? parseInt(parts['age'].data.toString()) : null
    const manualTest = parts['testName']?.data?.toString() || null

    // Merge manual overrides
    const name = manualName || extracted.name
    const mobile = manualMobile || extracted.mobile
    const age = manualAge || extracted.age
    const testName = manualTest || extracted.testName || 'Unknown Test'

    // Match patient
    let matchResult = null
    let patientId: string | null = null
    let autoLinked = false

    if (mobile || name) {
      matchResult = await matchPatient({
        name: name || '',
        mobile,
        age,
        gender: extracted.gender,
        patientId: extracted.patientId,
        testName,
        reportDate: extracted.reportDate,
        collectionDate: extracted.collectionDate,
        rawText: rawText.substring(0, 5000),
        confidence: extracted.confidence,
      })

      // Auto-link if HIGH confidence
      if (matchResult.confidence === 'HIGH' && matchResult.patientId) {
        patientId = matchResult.patientId
        autoLinked = true
      }
      // For MEDIUM confidence with clear name+mobile+age, also auto-link
      else if (matchResult.confidence === 'MEDIUM' && name && mobile && age && matchResult.candidates.length === 1) {
        patientId = matchResult.patientId
        autoLinked = true
      }
    }

    // If no match found and we have name+mobile, create patient
    if (!patientId && name && mobile) {
      patientId = await findOrCreatePatient({
        name,
        mobile,
        age,
        gender: extracted.gender,
      })
      autoLinked = true
      matchResult = {
        confidence: 'HIGH' as const,
        score: 100,
        patientId,
        patientName: name,
        patientMobile: mobile,
        patientAge: age,
        matchMethod: 'auto_created',
        candidates: [{ id: patientId, name, mobile, age, score: 100 }],
      }
    }

    // Create report record
    const reportData: any = {
      testName: testName || 'Unknown',
      reportDate: new Date(),
      fileUrl: `/api/reports/file/${path.relative(path.resolve('uploads'), fullPath).replace(/\\/g, '/')}`,
      fileName: filePart.filename,
      status: autoLinked ? 'ready' : 'unmatched',
      uploadedBy: admin.id,
      fileHash,
      extractedName: extracted.name,
      extractedMobile: extracted.mobile,
      extractedAge: extracted.age,
      extractedGender: extracted.gender,
      extractedPatientId: extracted.patientId,
      extractedTestName: extracted.testName,
      rawExtractedText: rawText.substring(0, 5000),
      matchConfidence: matchResult?.confidence || 'NONE',
      matchMethod: matchResult?.matchMethod || 'no_match',
      matchScore: matchResult?.score || 0,
      matchedPatientId: matchResult?.patientId || null,
      collectionDate: extracted.collectionDate ? new Date(extracted.collectionDate) : null,
    }

    if (patientId) {
      reportData.patientId = patientId
    }

    const report = await prisma.report.create({ data: reportData })

    // Audit log
    await logAudit(
      admin.id,
      autoLinked ? 'report_auto_linked' : 'report_uploaded',
      'report',
      report.id,
      `Report "${filePart.filename}" ${autoLinked ? 'auto-linked to patient ' + (matchResult?.patientName || patientId) : 'uploaded as unmatched'}. Confidence: ${matchResult?.confidence || 'NONE'}`
    )

    return NextResponse.json({
      report: {
        id: report.id,
        fileName: report.fileName,
        testName: report.testName,
        status: report.status,
        patientId: report.patientId,
      },
      extraction: {
        name: extracted.name,
        mobile: extracted.mobile,
        age: extracted.age,
        gender: extracted.gender,
        testName: extracted.testName,
        confidence: extracted.confidence,
        error: extractionError,
      },
      match: matchResult ? {
        confidence: matchResult.confidence,
        score: matchResult.score,
        patientName: matchResult.patientName,
        patientMobile: matchResult.patientMobile,
        patientAge: matchResult.patientAge,
        matchMethod: matchResult.matchMethod,
        candidates: matchResult.candidates,
      } : null,
      autoLinked,
    })
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Report upload error:', error)
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 })
  }
}
