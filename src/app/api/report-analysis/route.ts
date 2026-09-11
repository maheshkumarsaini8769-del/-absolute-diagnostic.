import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { ReportAnalysis, Test, ITest } from '@/models'
import { processPrescriptionDocument } from '@/lib/prescription-analyzer'
import { matchDetectedWithCatalog } from '@/lib/test-matcher'

export const dynamic = 'force-dynamic'

// POST /api/report-analysis: Upload document & detect tests & match with DB catalog
export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const { fileData, fileName, mimeType, patientName, patientPhone, providedText } = body

    if (!fileData) {
      return NextResponse.json({ error: 'fileData (base64 string) is required' }, { status: 400 })
    }

    const safeFileName = (fileName || `prescription-${Date.now()}.jpg`).replace(/[^\w\.-]/g, '_')
    const safeMimeType = mimeType || 'image/jpeg'

    // Clean base64 data URL
    const base64Data = fileData.includes(';base64,')
      ? fileData.split(';base64,')[1]
      : fileData

    const fileBuffer = Buffer.from(base64Data, 'base64')

    // Document quality check
    if (fileBuffer.length > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 15MB' }, { status: 400 })
    }
    if (fileBuffer.length < 100) {
      return NextResponse.json({ error: 'File appears corrupt or empty' }, { status: 400 })
    }

    // Process document through OCR / Text extraction & Medical catalog matcher
    const analysisResult = await processPrescriptionDocument(fileBuffer, safeMimeType, safeFileName, providedText)

    // Calculate server-side total
    const matchedTests = analysisResult.matchedResults
    const subtotal = matchedTests
      .filter(t => t.isConfirmedByUser && t.price)
      .reduce((sum, t) => sum + (t.price || 0), 0)

    // Save Analysis Record to MongoDB with safe fallback
    let analysisId = `temp-${Date.now()}`
    try {
      const analysis = await ReportAnalysis.create({
        patientName: patientName ? String(patientName).trim() : undefined,
        patientPhone: patientPhone ? String(patientPhone).replace(/\D/g, '').slice(-10) : undefined,
        sourceFileName: safeFileName,
        fileData: fileData.slice(0, 100000), // retain light preview
        mimeType: safeMimeType,
        status: matchedTests.length > 0 ? 'READY_FOR_CONFIRMATION' : 'EXTRACTED',
        extractedText: analysisResult.rawText,
        extractedTests: analysisResult.detectedTests,
        matchedTests: matchedTests,
        subtotal,
        discount: 0,
        finalTotal: subtotal,
        confidence: analysisResult.confidence,
      })
      analysisId = analysis._id.toString()
    } catch (saveErr) {
      console.warn('ReportAnalysis save note (proceeding with in-memory analysis):', saveErr)
    }

    return NextResponse.json({
      success: true,
      analysisId,
      status: matchedTests.length > 0 ? 'READY_FOR_CONFIRMATION' : 'EXTRACTED',
      extractedText: analysisResult.rawText,
      detectedTests: analysisResult.detectedTests,
      matchedTests: matchedTests,
      subtotal,
      finalTotal: subtotal,
      confidence: analysisResult.confidence,
    })
  } catch (error: any) {
    console.error('Report analysis error:', error)
    return NextResponse.json({ error: error.message || 'Failed to analyze report' }, { status: 500 })
  }
}

// GET /api/report-analysis?id=... (Fetch analysis status & catalog matches)
export async function GET(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 })
    }

    const analysis = await ReportAnalysis.findById(id).lean()
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis record not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: (analysis._id as any).toString(),
        patientName: analysis.patientName,
        patientPhone: analysis.patientPhone,
        sourceFileName: analysis.sourceFileName,
        status: analysis.status,
        matchedTests: analysis.matchedTests,
        subtotal: analysis.subtotal,
        finalTotal: analysis.finalTotal,
        confidence: analysis.confidence,
        confirmedTests: analysis.confirmedTests,
        bookingCode: analysis.bookingCode,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
