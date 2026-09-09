import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Report, Patient } from '@/models'
import { verifySessionToken } from '@/lib/zenuxs-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    let phone = searchParams.get('phone')

    if (!phone) {
      const cookieHeader = request.headers.get('Cookie')
      const match = cookieHeader?.match(/session_token=([^;]+)/)
      const token = match?.[1]
      if (token) {
        const payload = verifySessionToken(token)
        if (payload?.patientId) {
          const p = await Patient.findById(payload.patientId)
          if (p) phone = p.phone
        }
      }
    }

    if (!phone) {
      return NextResponse.json({ error: 'Phone number or active session required' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10)

    // Find all published reports for this patient
    const reports = await Report.find({
      $or: [
        { patientPhone: cleanPhone },
        { extractedMobile: cleanPhone },
      ],
      isDeleted: { $ne: true },
      status: { $in: ['published', 'approved', 'verified', 'report_ready'] }
    })
      .sort({ reportDate: 1 })
      .lean()

    // Biomarkers to track
    const biomarkers = [
      { key: 'hemoglobin', name: 'Hemoglobin', unit: 'g/dL', normalMin: 12.0, normalMax: 16.5, regex: /hemo[a-z]*\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i },
      { key: 'glucose_fasting', name: 'Fasting Glucose', unit: 'mg/dL', normalMin: 70, normalMax: 100, regex: /(?:glucose|sugar)\s*(?:fasting|f)?\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i },
      { key: 'cholesterol', name: 'Total Cholesterol', unit: 'mg/dL', normalMin: 125, normalMax: 200, regex: /(?:total\s*)?cholesterol\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i },
      { key: 'tsh', name: 'Thyroid (TSH)', unit: 'uIU/mL', normalMin: 0.4, normalMax: 4.5, regex: /tsh\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i },
      { key: 'platelets', name: 'Platelet Count', unit: 'lakh/mcL', normalMin: 1.5, normalMax: 4.5, regex: /platelet[a-z]*\s*[:\-]?\s*([0-9]+\.?[0-9]*)/i },
    ]

    const trendResults: Record<string, any> = {}

    for (const bio of biomarkers) {
      trendResults[bio.key] = {
        name: bio.name,
        unit: bio.unit,
        normalRange: `${bio.normalMin} - ${bio.normalMax}`,
        data: [] as Array<{ date: string; value: number; status: 'normal' | 'low' | 'high'; reportName: string }>
      }
    }

    for (const r of reports) {
      const dateStr = r.reportDate ? new Date(r.reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'
      const textToSearch = `${r.testName || ''} ${r.rawExtractedText || ''} ${JSON.stringify(r.analysisData || {})}`

      for (const bio of biomarkers) {
        let val: number | null = null

        // 1. Check analysisData if structured
        if (r.analysisData?.parameters && Array.isArray(r.analysisData.parameters)) {
          const found = r.analysisData.parameters.find((p: any) => p.name?.toLowerCase().includes(bio.key.replace('_', ' ')))
          if (found && !isNaN(Number(found.value))) {
            val = Number(found.value)
          }
        }

        // 2. Fallback regex
        if (val === null) {
          const match = textToSearch.match(bio.regex)
          if (match && match[1] && !isNaN(Number(match[1]))) {
            const parsed = parseFloat(match[1])
            if (parsed > 0 && parsed < 2000) {
              val = parsed
            }
          }
        }

        if (val !== null) {
          let status: 'normal' | 'low' | 'high' = 'normal'
          if (val < bio.normalMin) status = 'low'
          else if (val > bio.normalMax) status = 'high'

          trendResults[bio.key].data.push({
            date: dateStr,
            value: val,
            status,
            reportName: r.testName || 'Diagnostic Report'
          })
        }
      }
    }

    // Filter out biomarkers that have 0 data points
    const activeTrends = Object.entries(trendResults)
      .filter(([_, info]) => info.data.length > 0)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})

    return NextResponse.json({
      success: true,
      totalReports: reports.length,
      trends: activeTrends
    })
  } catch (error: any) {
    console.error('Trends API error:', error)
    return NextResponse.json({ error: 'Failed to generate health trends' }, { status: 500 })
  }
}
