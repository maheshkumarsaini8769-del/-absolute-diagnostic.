import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { ReportAnalysis } from '@/models'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/report-analysis - Admin list all report analysis sessions
export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const query = searchParams.get('q')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (query) {
      where.$or = [
        { patientName: { $regex: query, $options: 'i' } },
        { patientPhone: { $regex: query, $options: 'i' } },
        { sourceFileName: { $regex: query, $options: 'i' } }
      ]
    }

    const analyses = await ReportAnalysis.find(where)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return NextResponse.json({
      success: true,
      analyses: analyses.map((a: any) => ({
        id: a._id.toString(),
        patientName: a.patientName || 'Guest Patient',
        patientPhone: a.patientPhone || 'N/A',
        sourceFileName: a.sourceFileName,
        status: a.status,
        confidence: a.confidence,
        extractedTests: a.extractedTests || [],
        matchedTests: a.matchedTests || [],
        confirmedTests: a.confirmedTests || [],
        subtotal: a.subtotal || 0,
        finalTotal: a.finalTotal || 0,
        bookingCode: a.bookingCode || null,
        error: a.error || null,
        createdAt: a.createdAt,
      }))
    })
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Admin list report analysis error:', error)
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 500 })
  }
}

// PATCH /api/admin/report-analysis - Admin manual match correction
export async function PATCH(request: Request) {
  try {
    await requireAdmin(request)
    await connectDB()

    const body = await request.json()
    const { analysisId, detectedIndex, newCatalogTestId, newTestName, newPrice } = body

    if (!analysisId || detectedIndex === undefined) {
      return NextResponse.json({ error: 'analysisId and detectedIndex are required' }, { status: 400 })
    }

    const record = await ReportAnalysis.findById(analysisId)
    if (!record) {
      return NextResponse.json({ error: 'Analysis record not found' }, { status: 404 })
    }

    if (record.matchedTests && record.matchedTests[detectedIndex]) {
      record.matchedTests[detectedIndex].matchedCatalogTestId = newCatalogTestId
      record.matchedTests[detectedIndex].catalogName = newTestName
      record.matchedTests[detectedIndex].price = newPrice
      record.matchedTests[detectedIndex].matchStatus = 'EXACT_MATCH'
      record.matchedTests[detectedIndex].confidence = 1.0
      record.matchedTests[detectedIndex].isConfirmedByUser = true

      // Recalculate totals
      record.subtotal = record.matchedTests
        .filter(t => t.isConfirmedByUser && t.price)
        .reduce((sum, t) => sum + (t.price || 0), 0)
      record.finalTotal = record.subtotal - (record.discount || 0)

      await record.save()
    }

    return NextResponse.json({ success: true, analysis: record })
  } catch (error: any) {
    if (error instanceof Response) return error
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 })
  }
}
