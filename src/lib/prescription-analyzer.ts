import { extractPDFText } from './pdf-extraction'
import { matchDetectedWithCatalog, CatalogMatchResult } from './test-matcher'

export interface DocumentAnalysisOutput {
  rawText: string
  detectedPatientName?: string
  detectedPatientPhone?: string
  detectedTests: string[]
  matchedResults: CatalogMatchResult[]
  confidence: number
}

// Medical keywords identifying diagnostic tests in prescriptions or lab slips
const KNOWN_MEDICAL_KEYWORDS = [
  'cbc', 'complete blood count', 'haemogram', 'hemogram', 'hb', 'haemoglobin', 'hemoglobin',
  'tlc', 'dlc', 'esr', 'platelet', 'wbc', 'rbc',
  'lft', 'liver function', 'sgot', 'sgpt', 'bilirubin', 'alkaline phosphatase',
  'kft', 'rft', 'kidney function', 'renal function', 'creatinine', 'blood urea', 'bun', 'uric acid',
  'lipid profile', 'cholesterol', 'triglycerides', 'hdl', 'ldl', 'vldl',
  'sugar', 'glucose', 'fbs', 'ppbs', 'rbs', 'hba1c', 'glycated haemoglobin',
  'tsh', 't3', 't4', 'thyroid', 'ft3', 'ft4', 'anti tpo',
  'vitamin d', 'vit d', '25-oh vit d', 'vitamin b12', 'vit b12', 'b12',
  'ferritin', 'serum iron', 'tibc', 'iron profile',
  'calcium', 'phosphorus', 'electrolytes', 'sodium', 'potassium', 'chloride',
  'crp', 'c-reactive protein', 'ra factor', 'rheumatoid factor', 'aso titer',
  'urine r/m', 'urine routine', 'urinalysis', 'stool routine', 'semen analysis',
  'widal', 'typhoid', 'dengue ns1', 'dengue igg', 'dengue igm', 'malaria antigen', 'mp',
  'hiv', 'hbsag', 'hcv', 'vdrl', 'tpha',
  'prolactin', 'lh', 'fsh', 'testosterone', 'psa', 'beta hcg', 'cortisol'
]

export function extractTestsFromText(text: string): string[] {
  if (!text) return []

  const detected = new Set<string>()
  const clean = text.replace(/[\r\n]+/g, '\n')
  const lines = clean.split('\n')

  // Line-by-line inspection
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.length < 2) continue

    const lowerLine = trimmed.toLowerCase()

    // Skip doctor header/footer noise
    if (
      lowerLine.includes('dr.') ||
      lowerLine.includes('mbbs') ||
      lowerLine.includes('hospital') ||
      lowerLine.includes('clinic') ||
      lowerLine.includes('qualification') ||
      lowerLine.includes('reg no') ||
      lowerLine.includes('address:') ||
      lowerLine.includes('phone:') ||
      lowerLine.startsWith('tab.') ||
      lowerLine.startsWith('cap.') ||
      lowerLine.startsWith('syp.') ||
      lowerLine.startsWith('inj.')
    ) {
      // Medicines or headers - but could have "Advised: CBC, LFT"
      if (!lowerLine.includes('advise') && !lowerLine.includes('test') && !lowerLine.includes('investigation')) {
        continue
      }
    }

    for (const kw of KNOWN_MEDICAL_KEYWORDS) {
      // Word boundary regex
      const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'i')
      if (regex.test(lowerLine)) {
        detected.add(kw.toUpperCase())
      }
    }
  }

  // Full body search for comma-separated or tabbed values
  const lowerFull = clean.toLowerCase()
  for (const kw of KNOWN_MEDICAL_KEYWORDS) {
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'i')
    if (regex.test(lowerFull)) {
      detected.add(kw.toUpperCase())
    }
  }

  return Array.from(detected)
}

export async function processPrescriptionDocument(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<DocumentAnalysisOutput> {
  let extractedText = ''

  if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    extractedText = await extractPDFText(fileBuffer)
  } else {
    // For images, extract any embedded ASCII/text or EXIF/OCR hints
    // If text extraction is empty, we fall back to keyword scanning on file buffer
    const rawStr = fileBuffer.toString('latin1')
    const asciiMatches = rawStr.match(/[A-Za-z0-9\s\.\,\:\-\_\/]{4,100}/g) || []
    extractedText = asciiMatches.slice(0, 50).join(' ')
  }

  const detectedTests = extractTestsFromText(extractedText)

  // Catalog Matching with DB
  const matchedResults = await matchDetectedWithCatalog(detectedTests)

  const hasMatches = matchedResults.some(m => m.matchedCatalogTestId)
  const confidence = hasMatches ? 0.90 : (detectedTests.length > 0 ? 0.65 : 0.20)

  return {
    rawText: extractedText.slice(0, 3000),
    detectedTests,
    matchedResults,
    confidence
  }
}
