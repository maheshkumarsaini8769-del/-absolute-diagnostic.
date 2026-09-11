import os from 'os'
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
  // Blood / Hematology
  'cbc', 'complete blood count', 'haemogram', 'hemogram', 'hb', 'haemoglobin', 'hemoglobin',
  'tlc', 'dlc', 'esr', 'platelet', 'platelet count', 'wbc', 'rbc', 'pcv', 'mcv', 'mch', 'mchc',
  'blood group', 'rh typing', 'reticulocyte', 'peripheral smear', 'aec',

  // Liver
  'lft', 'liver function test', 'liver function', 'sgot', 'sgpt', 'bilirubin', 'total bilirubin',
  'direct bilirubin', 'alkaline phosphatase', 'alp', 'ggtp', 'serum albumin', 'total protein',

  // Kidney
  'kft', 'rft', 'kidney function test', 'renal function test', 'kidney function', 'renal function',
  'creatinine', 'serum creatinine', 'blood urea', 'bun', 'uric acid', 'serum uric acid',

  // Lipids / Heart
  'lipid profile', 'lipid panel', 'cholesterol', 'total cholesterol', 'triglycerides', 'hdl', 'ldl', 'vldl',
  'troponin', 'cpk-mb', 'd-dimer',

  // Diabetes
  'sugar', 'blood sugar', 'glucose', 'fbs', 'ppbs', 'rbs', 'fasting blood sugar', 'post prandial',
  'hba1c', 'glycated haemoglobin', 'glycated hemoglobin', 'insulin',

  // Thyroid & Hormones
  'tsh', 't3', 't4', 'thyroid profile', 'thyroid', 'ft3', 'ft4', 'anti tpo',
  'prolactin', 'lh', 'fsh', 'testosterone', 'psa', 'beta hcg', 'cortisol', 'amh',

  // Vitamins & Minerals
  'vitamin d', 'vit d', 'vit d3', '25-oh vit d', 'vitamin b12', 'vit b12', 'b12',
  'ferritin', 'serum iron', 'tibc', 'iron profile', 'iron studies',
  'calcium', 'serum calcium', 'phosphorus', 'electrolytes', 'sodium', 'potassium', 'chloride',

  // Infectious & Fever
  'widal', 'typhoid', 'widal test', 'dengue', 'dengue ns1', 'dengue igg', 'dengue igm',
  'malaria', 'malaria antigen', 'mp', 'smear for mp', 'chikungunya',
  'hiv', 'hbsag', 'hcv', 'vdrl', 'tpha', 'covid-19', 'mantoux', 'crp', 'c-reactive protein',
  'ra factor', 'rheumatoid factor', 'aso titer', 'ana',

  // Urine & Stool
  'urine r/m', 'urine routine', 'urinalysis', 'urine culture', 'urine pregnancy test',
  'stool routine', 'stool occult blood', 'semen analysis'
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

    // Skip doctor header/footer noise unless contains test/investigation
    if (
      lowerLine.includes('dr.') ||
      lowerLine.includes('mbbs') ||
      lowerLine.includes('hospital') ||
      lowerLine.includes('clinic') ||
      lowerLine.includes('reg no') ||
      lowerLine.startsWith('tab.') ||
      lowerLine.startsWith('cap.') ||
      lowerLine.startsWith('syp.') ||
      lowerLine.startsWith('inj.')
    ) {
      if (!lowerLine.includes('advise') && !lowerLine.includes('test') && !lowerLine.includes('investigation') && !lowerLine.includes('rx')) {
        continue
      }
    }

    for (const kw of KNOWN_MEDICAL_KEYWORDS) {
      const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i')
      if (regex.test(lowerLine)) {
        detected.add(kw.toUpperCase())
      }
    }
  }

  // Full body search for comma-separated or tabbed values
  const lowerFull = clean.toLowerCase()
  for (const kw of KNOWN_MEDICAL_KEYWORDS) {
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i')
    if (regex.test(lowerFull)) {
      detected.add(kw.toUpperCase())
    }
  }

  return Array.from(detected)
}

function extractNameFromPrescription(text: string): string | undefined {
  const patterns = [
    /(?:patient\s*name|pt\.?\s*name|name\s*[:=])\s*[:\-]?\s*([A-Z][A-Za-z\s.]{2,30})/i,
    /(?:mr|ms|mrs|shri|smt)\.?\s+([A-Z][A-Za-z\s.]{2,30})/i,
    /patient\s*[:\-]\s*([A-Z][A-Za-z\s.]{2,30})/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1]) {
      const clean = m[1].replace(/\b(age|sex|gender|date|phone|mobile)\b.*$/i, '').trim()
      if (clean.length >= 3 && !/^(hospital|clinic|doctor|patient|report)$/i.test(clean)) {
        return clean
      }
    }
  }
  return undefined
}

export async function processPrescriptionDocument(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  providedText?: string
): Promise<DocumentAnalysisOutput> {
  let extractedText = providedText || ''

  if (!extractedText.trim()) {
    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      extractedText = await extractPDFText(fileBuffer)
    } else {
      // 1. Process image using Sharp for contrast & grayscale optimization
      let ocrBuffer = fileBuffer
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sharp = require('sharp')
        ocrBuffer = await sharp(fileBuffer)
          .resize({ width: 1600, height: 2400, fit: 'inside', withoutEnlargement: true })
          .grayscale()
          .normalize()
          .png()
          .toBuffer()
      } catch (sharpErr) {
        console.warn('Sharp optimization note:', sharpErr)
        ocrBuffer = fileBuffer
      }

      // 2. Real OCR text extraction via Tesseract.js with writable tmp cache for serverless environments
      let worker: any = null
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Tesseract = require('tesseract.js')
        worker = await Tesseract.createWorker('eng', 1, {
          cachePath: os.tmpdir(),
          errorHandler: (e: any) => console.warn('Tesseract worker error:', e),
        })
        const ocrPromise = worker.recognize(ocrBuffer)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OCR Timeout')), 25000)
        )
        const ocrRes: any = await Promise.race([ocrPromise, timeoutPromise])
        if (ocrRes?.data?.text) {
          extractedText = ocrRes.data.text
        }
      } catch (ocrErr) {
        console.warn('Tesseract OCR note:', ocrErr)
      } finally {
        if (worker && typeof worker.terminate === 'function') {
          await worker.terminate().catch(() => {})
        }
      }
    }
  }

  const detectedPatientName = extractNameFromPrescription(extractedText)
  const detectedTests = extractTestsFromText(extractedText)

  // Catalog Matching with MongoDB
  const matchedResults = await matchDetectedWithCatalog(detectedTests)

  const hasMatches = matchedResults.some(m => m.matchedCatalogTestId)
  const confidence = hasMatches ? 0.92 : (detectedTests.length > 0 ? 0.65 : 0.20)

  return {
    rawText: extractedText.slice(0, 4000),
    detectedPatientName,
    detectedTests,
    matchedResults,
    confidence
  }
}

