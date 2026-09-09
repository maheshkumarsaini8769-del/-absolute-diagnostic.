import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { ReportAnalysis, Test, ITest } from '@/models'

export const dynamic = 'force-dynamic'

// POST /api/report-analysis/confirm: Patient confirms selected tests -> server calculates strict DB price snapshot
export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const { analysisId, selectedCatalogTestIds } = body

    if (!analysisId || !Array.isArray(selectedCatalogTestIds) || selectedCatalogTestIds.length === 0) {
      return NextResponse.json({ error: 'analysisId and at least one selectedCatalogTestId are required' }, { status: 400 })
    }

    const analysis = await ReportAnalysis.findById(analysisId)
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis session not found' }, { status: 404 })
    }

    // Strict security check: Load ACTUAL prices from DB to avoid any frontend manipulation
    const dbTests: ITest[] = await Test.find({
      _id: { $in: selectedCatalogTestIds },
      isActive: true
    }).lean()

    if (dbTests.length === 0) {
      return NextResponse.json({ error: 'None of the selected tests were found in active catalog' }, { status: 400 })
    }

    // Build price snapshot
    const priceSnapshot = dbTests.map((t: any) => ({
      catalogTestId: t._id.toString(),
      testName: t.name,
      priceAtConfirmation: t.price
    }))

    const calculatedSubtotal = priceSnapshot.reduce((sum, item) => sum + item.priceAtConfirmation, 0)
    const discount = 0
    const finalTotal = calculatedSubtotal - discount

    // Update ReportAnalysis record
    analysis.confirmedTests = priceSnapshot
    analysis.subtotal = calculatedSubtotal
    analysis.discount = discount
    analysis.finalTotal = finalTotal
    analysis.status = 'CONFIRMED'
    analysis.confirmedAt = new Date()

    await analysis.save()

    return NextResponse.json({
      success: true,
      analysisId: analysis._id.toString(),
      confirmedTests: priceSnapshot,
      subtotal: calculatedSubtotal,
      finalTotal,
      // URL to seamless existing booking flow with pre-selected tests
      bookingUrl: `/booking?tests=${encodeURIComponent(selectedCatalogTestIds.join(','))}&fromAnalysis=${analysis._id.toString()}`
    })
  } catch (error: any) {
    console.error('Report confirmation error:', error)
    return NextResponse.json({ error: error.message || 'Confirmation failed' }, { status: 500 })
  }
}
