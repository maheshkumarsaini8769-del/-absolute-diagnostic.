import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { parseReportDate } from './date-parser'

export interface ExtractedPatientData {
  name: string | null
  mobile: string | null
  age: number | null
  gender: string | null
  patientId: string | null
  patientUHID?: string | null
  bookingId?: string | null
  testName: string | null
  sampleType?: string | null
  reportDate: string | null
  collectionDate: string | null
  rawText: string
  confidence: number
}

export function extractTextFromPDF(buffer: Buffer): string {
  try {
    const raw = buffer.toString('latin1')
    const matches = raw.match(/\(([^()]{2,120})\)\s*Tj/g)
    if (matches && matches.length > 0) {
      return matches.map(m => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '')).join(' ')
    }
    return buffer.toString('utf-8').substring(0, 500)
  } catch {
    return ''
  }
}

export async function extractPDFText(buffer: Buffer): Promise<string> {
  // Polyfill DOMMatrix for Node.js / Vercel Serverless environment where browser DOM is absent
  if (typeof (globalThis as any).DOMMatrix === 'undefined') {
    ;(globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true;
      isIdentity = true;
      constructor(init?: any) {
        if (Array.isArray(init)) {
          this.a = init[0] ?? 1; this.b = init[1] ?? 0;
          this.c = init[2] ?? 0; this.d = init[3] ?? 1;
          this.e = init[4] ?? 0; this.f = init[5] ?? 0;
        }
      }
      multiply() { return this }
      translate() { return this }
      scale() { return this }
      rotate() { return this }
      transformPoint(p: any) { return p }
      inverse() { return this }
      toString() { return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})` }
    }
  }

  if (typeof (globalThis as any).Path2D === 'undefined') {
    ;(globalThis as any).Path2D = class Path2D {
      addPath() {}
      closePath() {}
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      arcTo() {}
      ellipse() {}
      rect() {}
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParseMod = require('pdf-parse')
    if (pdfParseMod.PDFParse) {
      const parser = new pdfParseMod.PDFParse({ data: buffer })
      const res = await parser.getText()
      if (typeof parser.destroy === 'function') {
        await parser.destroy().catch(() => {})
      }
      if (res && typeof res.text === 'string' && res.text.trim().length > 0) {
        return res.text
      }
    }
    if (typeof pdfParseMod === 'function') {
      const data = await pdfParseMod(buffer)
      if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
        return data.text
      }
    }
  } catch (err) {
    console.warn('extractPDFText: primary extraction failed, trying stream fallback:', err)
  }

  // Fallback: search for text blocks in raw buffer
  try {
    const raw = buffer.toString('latin1')
    const matches = raw.match(/\(([^()]{2,120})\)\s*Tj/g)
    if (matches && matches.length > 0) {
      return matches.map(m => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '')).join(' ')
    }
  } catch {
    // ignore
  }

  return ''
}

function cleanName(raw: string): string {
  return raw
    .replace(/[^\w\s.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatFilenameName(raw: string): string {
  const withPrefix = raw
    .replace(/^(Mr|Mrs|Ms|Miss|Dr|Shri|Smt)(?=[A-Z])/i, '$1 ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  return cleanName(withPrefix)
}

function extractName(text: string, filename?: string): string | null {
  const patterns = [
    /(?:patient\s*name|pt\.?\s*name|name\s*[:=])\s*[:\-]?\s*([A-Z][A-Za-z\t .]{2,40})/i,
    /(?:patient|pt\.?)\s*[:\-]\s*([A-Z][A-Za-z\t .]{2,40})/i,
    /(?:mr|ms|mrs|dr|shri|smt)\.?\s+([A-Z][A-Za-z\t .]{2,35})/i,
    /(?:name)\s*[:]\s*([A-Z][A-Za-z\t .]{2,35})/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      let raw = match[1]
      // Strip any accidental trailing field labels like "Age", "Sex", "Mobile", etc.
      raw = raw.replace(/\b(age|sex|gender|mobile|phone|date|test|uhid|pid|mrn|ref)\b.*$/i, '')
      const name = cleanName(raw)
      if (!/^(diagnostic|laboratory|pathology|hospital|clinic|report|center|centre|page|test|sample)$/i.test(name)) {
        if (name.length >= 2 && name.split(' ').length <= 6) return name
      }
    }
  }

  if (filename) {
    const base = path.basename(filename, path.extname(filename))
    const parts = base.split(/[-_]+/)
    for (const part of parts) {
      if (/^(?:Mr|Mrs|Ms|Miss|Dr|Shri|Smt)?[a-zA-Z]{3,30}$/i.test(part)) {
        if (!/^(report|lab|test|male|female|pdf|scan|patient|diagnostic|result)$/i.test(part)) {
          const formatted = formatFilenameName(part)
          if (formatted.length >= 3) return formatted
        }
      }
    }
  }

  return null
}

function extractMobile(text: string): string | null {
  const patterns = [
    /(?:mobile|phone|cell|contact|tel\.?|mo\.?|ph\.?)\s*[:\-]?\s*(?:\+91[\s-]?)?([6-9]\d{9})\b/i,
    /(?:\+91[\s-]?)?([6-9]\d{9})\b/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const num = match[1].replace(/[\s\-+]/g, '')
      if (num.length === 10 && /^[6-9]\d{9}$/.test(num)) {
        return num
      }
    }
  }
  return null
}

function extractAge(text: string): number | null {
  const patterns = [
    /(?:age|age\s*[:=]?)\s*[:\-]?\s*(\d{1,3})\s*(?:yrs?|years?|y\/o|y\.?o\.?)?/i,
    /(\d{1,3})\s*(?:yrs?|years?|y\/o|y\.?o\.\s*)\s*(?:male|female|m|f)?/i,
    /(?:age\s*\/\s*gender|age\s*\/\s*sex)\s*[:\-]?\s*(\d{1,3})/i,
    /(?:DOB|date\s*of\s*birth)\s*[:\-]?\s*(\d{1,3})/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const age = parseInt(match[1], 10)
      if (age > 0 && age <= 125) return age
    }
  }
  return null
}

function extractGender(text: string, filename?: string): string | null {
  const sexMatch = text.match(/(?:sex|gender)\s*[:\-]?\s*(male|female|other|transgender|m|f)\b/i)
  if (sexMatch) {
    const val = sexMatch[1].toLowerCase()
    if (val === 'male' || val === 'm') return 'Male'
    if (val === 'female' || val === 'f') return 'Female'
    if (val === 'other' || val === 'transgender') return 'Other'
  }

  if (/\b(female|woman|lady|mrs|miss|ms\.?)\b/i.test(text)) return 'Female'
  if (/\b(male|gentleman|mr\.?)\b/i.test(text)) return 'Male'

  if (filename) {
    if (/_Female\b/i.test(filename) || /-Female\b/i.test(filename)) return 'Female'
    if (/_Male\b/i.test(filename) || /-Male\b/i.test(filename)) return 'Male'
    if (/Mrs|Miss|Ms/i.test(filename)) return 'Female'
    if (/Mr\./i.test(filename)) return 'Male'
  }

  return null
}

function extractPatientId(text: string, filename?: string): string | null {
  const patterns = [
    /(?:patient\s*id|UHID|lab\s*id|MRN|registration\s*no|reg\.?\s*no|ref\.?\s*no)\s*[:\-]?\s*([A-Z0-9\-]{4,25})/i,
    /(?:UHID|MRN|PID)\s*[:\-]?\s*([A-Z0-9\-]{4,25})/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }

  if (filename) {
    const base = path.basename(filename, path.extname(filename))
    const firstPart = base.split(/[-_]+/)[0]
    if (firstPart && /^\d{5,15}$/.test(firstPart)) {
      return firstPart
    }
  }

  return null
}

function extractBookingId(text: string): string | null {
  const patterns = [
    /(?:booking\s*id|order\s*id|appointment\s*id|token\s*(?:no|#)?)\s*[:\-]?\s*([A-Z0-9\-]{4,25})/i,
    /\b(BK-[A-Z0-9]{4,15})\b/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  return null
}

function extractTestName(text: string): string | null {
  const patterns = [
    /(?:test\s*name|investigation|test|panel|profile)\s*[:\-]?\s*([A-Z][A-Za-z0-9\s&()\-]{3,60})/i,
    /(?:complete\s*blood\s*count|CBC|thyroid\s*profile|lipid\s*profile|liver\s*function\s*test|LFT|kidney\s*function\s*test|KFT|diabetes\s*profile|hba1c|blood\s*glucose|urine\s*routine|vitamin\s*d|vitamin\s*b12)/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const candidate = match[1]?.trim() || match[0]?.trim()
      if (candidate && candidate.length >= 3 && !/^(report|test|sample|investigation)$/i.test(candidate)) {
        return candidate
      }
    }
  }
  return null
}

function extractSampleType(text: string): string | null {
  const patterns = [
    /(?:sample\s*type|specimen\s*type|specimen|sample)\s*[:\-]?\s*([A-Za-z\s]{3,30})/i,
    /\b(EDTA Whole Blood|Whole Blood|Serum|Plasma|Urine|Fluoride Blood|Swab)\b/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]?.trim() || match[0]?.trim()
  }
  return null
}

function extractReportDate(text: string, filename?: string): string | null {
  const patterns = [
    /(?:report\s*date|date\s*of\s*report|dated|DOR)\s*[:\-]?\s*(\d{1,2}[\s\/\-\.]\w+[\s\/\-\.]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i,
    /(?:date\s*[:=])\s*[:\-]?\s*(\d{1,2}[\s\/\-\.]\w+[\s\/\-\.]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i,
    /(\d{1,2}[\s\/\-\.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s\/\-\.]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const rawDate = match[1]?.trim() || match[0]?.trim()
      const parsed = parseReportDate(rawDate)
      if (parsed) return parsed.toISOString()
    }
  }

  if (filename) {
    const parsed = parseReportDate(filename)
    if (parsed) return parsed.toISOString()
  }

  return null
}

function extractCollectionDate(text: string): string | null {
  const patterns = [
    /(?:sample|collection|collected)\s*(?:date|on|at)?\s*[:\-]?\s*(\d{1,2}[\s\/\-\.]\w+[\s\/\-\.]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i,
    /(?:SCD|sample\s*date)\s*[:\-]?\s*(\d{1,2}[\s\/\-\.]\w+[\s\/\-\.]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const rawDate = match[1]?.trim() || match[0]?.trim()
      const parsed = parseReportDate(rawDate)
      if (parsed) return parsed.toISOString()
    }
  }
  return null
}

export interface ExtractedParameter {
  parameter: string
  value: string
  unit: string
  referenceRange: string
  isAbnormal: boolean
  indicator: 'normal' | 'high' | 'low' | 'critical'
}

export interface AnalysisResult {
  patient: ExtractedPatientData
  parameters: ExtractedParameter[]
  criticalFlags: string[]
  pathologist: string | null
  summary: string
  hasAbnormal: boolean
}

function extractPathologist(text: string): string | null {
  const patterns = [
    /(?:dr\.?|doctor|pathologist|consultant)\s*[:\-]?\s*([A-Z][A-Za-z\s.]{3,35}(?:MD|MBBS|DNB|Pathologist)?)/i,
    /(?:verified|reviewed|signed)\s*by\s*[:\-]?\s*([A-Z][A-Za-z\s.]{3,35})/i,
    /(Dr\.\s+[A-Z][A-Za-z\s.]{2,30})/
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  return null
}

const COMMON_TEST_PARAMS: Array<{
  name: string
  aliases: RegExp[]
  defaultUnit: string
  normalMin: number
  normalMax: number
  criticalLow?: number
  criticalHigh?: number
}> = [
  { name: 'Hemoglobin (Hb)', aliases: [/hemo(?:globin)?/i, /\bhb\b/i], defaultUnit: 'g/dL', normalMin: 12.0, normalMax: 17.0, criticalLow: 7.0, criticalHigh: 20.0 },
  { name: 'Total WBC Count (TLC)', aliases: [/total\s*wbc/i, /\btlc\b/i, /white\s*blood\s*cells?/i, /leukocytes?/i], defaultUnit: '/cumm', normalMin: 4000, normalMax: 11000, criticalLow: 2000, criticalHigh: 25000 },
  { name: 'Platelet Count', aliases: [/platelets?/i, /\bplt\b/i], defaultUnit: '/cumm', normalMin: 150000, normalMax: 450000, criticalLow: 50000, criticalHigh: 1000000 },
  { name: 'RBC Count', aliases: [/rbc\s*(?:count)?/i, /red\s*blood\s*cells?/i], defaultUnit: 'million/cumm', normalMin: 4.0, normalMax: 6.0 },
  { name: 'Fasting Blood Glucose', aliases: [/fasting\s*(?:blood\s*)?glucose/i, /fbs/i, /fasting\s*sugar/i], defaultUnit: 'mg/dL', normalMin: 70, normalMax: 100, criticalLow: 50, criticalHigh: 300 },
  { name: 'Post Prandial Glucose (PPBS)', aliases: [/post\s*prandial/i, /ppbs/i, /pp\s*sugar/i], defaultUnit: 'mg/dL', normalMin: 80, normalMax: 140, criticalHigh: 350 },
  { name: 'HbA1c (Glycated Hemoglobin)', aliases: [/hba1c/i, /glycated\s*hemoglobin/i], defaultUnit: '%', normalMin: 4.0, normalMax: 5.6, criticalHigh: 10.0 },
  { name: 'Serum Creatinine', aliases: [/serum\s*creatinine/i, /\bcreatinine\b/i], defaultUnit: 'mg/dL', normalMin: 0.6, normalMax: 1.3, criticalHigh: 3.0 },
  { name: 'Blood Urea Nitrogen (BUN)', aliases: [/blood\s*urea/i, /\bbun\b/i, /\burea\b/i], defaultUnit: 'mg/dL', normalMin: 7, normalMax: 20, criticalHigh: 60 },
  { name: 'Serum Bilirubin (Total)', aliases: [/(?:total\s*)?bilirubin/i], defaultUnit: 'mg/dL', normalMin: 0.2, normalMax: 1.2, criticalHigh: 5.0 },
  { name: 'SGOT / AST', aliases: [/sgot/i, /\bast\b/i, /aspartate\s*amino/i], defaultUnit: 'U/L', normalMin: 10, normalMax: 40, criticalHigh: 200 },
  { name: 'SGPT / ALT', aliases: [/sgpt/i, /\balt\b/i, /alanine\s*amino/i], defaultUnit: 'U/L', normalMin: 10, normalMax: 45, criticalHigh: 200 },
  { name: 'Total Cholesterol', aliases: [/total\s*cholesterol/i, /cholesterol\s*total/i], defaultUnit: 'mg/dL', normalMin: 120, normalMax: 200, criticalHigh: 300 },
  { name: 'Triglycerides', aliases: [/triglycerides?/i, /\btg\b/i], defaultUnit: 'mg/dL', normalMin: 50, normalMax: 150, criticalHigh: 500 },
  { name: 'HDL Cholesterol', aliases: [/hdl\s*(?:cholesterol)?/i], defaultUnit: 'mg/dL', normalMin: 40, normalMax: 60 },
  { name: 'LDL Cholesterol', aliases: [/ldl\s*(?:cholesterol)?/i], defaultUnit: 'mg/dL', normalMin: 60, normalMax: 100, criticalHigh: 190 },
  { name: 'TSH (Thyroid Stimulating Hormone)', aliases: [/thyroid\s*stimulating/i, /\btsh\b/i], defaultUnit: 'uIU/mL', normalMin: 0.4, normalMax: 4.5, criticalHigh: 15.0 },
  { name: 'Vitamin D (25-OH)', aliases: [/vitamin\s*d/i, /25-oh\s*vit/i], defaultUnit: 'ng/mL', normalMin: 30, normalMax: 100, criticalLow: 10 },
  { name: 'Vitamin B12', aliases: [/vitamin\s*b-?12/i, /b12/i], defaultUnit: 'pg/mL', normalMin: 200, normalMax: 900, criticalLow: 100 },
]

export function extractParametersFromText(text: string): ExtractedParameter[] {
  const extracted: ExtractedParameter[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  for (const def of COMMON_TEST_PARAMS) {
    for (const alias of def.aliases) {
      for (const line of lines) {
        if (alias.test(line)) {
          // Look for number following or inside line
          const numMatch = line.match(/(?:[:=]|\s+)(\d+(?:\.\d+)?)\s*([a-zA-Z/%/]+)?/i)
          if (numMatch) {
            const valNum = parseFloat(numMatch[1])
            if (isNaN(valNum)) continue

            // Determine unit
            const parsedUnit = numMatch[2] || def.defaultUnit
            const rangeStr = `${def.normalMin} - ${def.normalMax}`

            let indicator: 'normal' | 'high' | 'low' | 'critical' = 'normal'
            let isAbnormal = false

            if (def.criticalLow !== undefined && valNum <= def.criticalLow) {
              indicator = 'critical'
              isAbnormal = true
            } else if (def.criticalHigh !== undefined && valNum >= def.criticalHigh) {
              indicator = 'critical'
              isAbnormal = true
            } else if (valNum < def.normalMin) {
              indicator = 'low'
              isAbnormal = true
            } else if (valNum > def.normalMax) {
              indicator = 'high'
              isAbnormal = true
            }

            // Avoid duplicate parameter
            if (!extracted.some(p => p.parameter === def.name)) {
              extracted.push({
                parameter: def.name,
                value: String(valNum),
                unit: parsedUnit,
                referenceRange: rangeStr,
                isAbnormal,
                indicator,
              })
            }
            break
          }
        }
      }
      if (extracted.some(p => p.parameter === def.name)) break
    }
  }

  return extracted
}

export function analyzeReportData(rawText: string, filename?: string): AnalysisResult {
  const patient = extractPatientData(rawText, filename)
  const parameters = extractParametersFromText(rawText)
  const pathologist = extractPathologist(rawText)

  const criticalFlags = parameters
    .filter(p => p.indicator === 'critical')
    .map(p => `${p.parameter}: ${p.value} ${p.unit} (CRITICAL)`)

  const abnormalCount = parameters.filter(p => p.isAbnormal).length
  const totalCount = parameters.length

  let summary = ''
  if (totalCount === 0) {
    summary = 'Report analyzed. Patient metadata extracted; ready for pathologist manual review.'
  } else if (abnormalCount === 0) {
    summary = `All ${totalCount} extracted parameters appear within standard biological reference ranges.`
  } else {
    summary = `${abnormalCount} of ${totalCount} parameter(s) flagged outside normal reference ranges for pathologist review.`
  }

  return {
    patient,
    parameters,
    criticalFlags,
    pathologist,
    summary,
    hasAbnormal: abnormalCount > 0,
  }
}

export function extractPatientData(text: string, filename?: string): ExtractedPatientData {
  const name = extractName(text, filename)
  const mobile = extractMobile(text)
  const age = extractAge(text)
  const gender = extractGender(text, filename)
  const patientId = extractPatientId(text, filename)
  const bookingId = extractBookingId(text)
  const testName = extractTestName(text)
  const sampleType = extractSampleType(text)
  const reportDate = extractReportDate(text, filename)
  const collectionDate = extractCollectionDate(text)

  let confidence = 0
  if (patientId) confidence += 30
  if (mobile) confidence += 25
  if (name) confidence += 20
  if (age !== null) confidence += 10
  if (testName) confidence += 10
  if (gender) confidence += 5

  return {
    name,
    mobile,
    age,
    gender,
    patientId,
    patientUHID: patientId,
    bookingId,
    testName,
    sampleType,
    reportDate,
    collectionDate,
    rawText: text.substring(0, 5000),
    confidence,
  }
}

export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export function getUploadPath(filename: string): string {
  const date = new Date()
  const dir = path.join(process.cwd(), 'public', 'uploads', 'reports', `${date.getFullYear()}`, `${String(date.getMonth() + 1).padStart(2, '0')}`)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  return path.join(dir, safeName)
}
