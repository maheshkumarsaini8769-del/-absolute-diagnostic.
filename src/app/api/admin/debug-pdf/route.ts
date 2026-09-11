import fs from 'fs'
import { extractPDFText } from '@/lib/pdf-extraction'
import { extractTestsFromText } from '@/lib/prescription-analyzer'
import { matchDetectedWithCatalog } from '@/lib/test-matcher'

export async function GET() {
  const sampleText = `DOCTOR PRESCRIPTION — SOFTWARE TEST DEMO
DEMO DOCUMENT — NOT A REAL MEDICAL PRESCRIPTION
Patient Name Demo Patient
Age 35 Years
Date 11/09/2026
Investigations / Tests Advised
1 Complete Blood Count (CBC)
2 HbA1c
3 Liver Function Test (LFT)
4 Vitamin D Total`

  let pdfParseError: string | null = null
  let pdfParseType: string | null = null

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParseMod = require('pdf-parse')
    pdfParseType = typeof pdfParseMod + ' | ' + Object.keys(pdfParseMod).join(',')
  } catch (err: any) {
    pdfParseError = err?.message || String(err)
  }

  const detected = extractTestsFromText(sampleText)
  const matched = await matchDetectedWithCatalog(detected)

  return Response.json({
    pdfParseType,
    pdfParseError,
    detected,
    matchedCount: matched.length,
    matched: matched.map(m => ({
      detected: m.detectedName,
      matchedCatalog: m.catalogName,
      price: m.price,
      status: m.matchStatus,
      id: m.matchedCatalogTestId
    }))
  })
}
