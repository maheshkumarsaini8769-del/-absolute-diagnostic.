import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface ExtractedPatientData {
  name: string | null
  mobile: string | null
  age: number | null
  gender: string | null
  patientId: string | null
  testName: string | null
  reportDate: string | null
  collectionDate: string | null
  rawText: string
  confidence: number
}

export function extractTextFromPDF(buffer: Buffer): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    // Synchronous-ish wrapper - pdf-parse returns a promise
    return buffer.toString('utf-8').substring(0, 500) // fallback for sync context
  } catch {
    return ''
  }
}

export async function extractPDFText(buffer: Buffer): Promise<string> {
  const pdfParse = require('pdf-parse')
  const data = await pdfParse(buffer)
  return data.text || ''
}

function cleanName(raw: string): string {
  return raw
    .replace(/[^\w\s.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractName(text: string): string | null {
  const patterns = [
    /(?:patient\s*name|name\s*[:=]?)\s*[:\-]?\s*([A-Z][A-Z\s.]{2,40})/i,
    /(?:patient|pt\.?)\s*[:\-]?\s*([A-Z][A-Z\s.]{2,40})/i,
    /(?:mr|ms|mrs|dr)\.?\s+([A-Z][A-Za-z\s.]{2,30})/i,
    /^([A-Z][A-Z\s]{2,30})$/m,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const name = cleanName(match[1])
      if (name.length >= 2 && name.split(' ').length <= 5) return name
    }
  }
  return null
}

function extractMobile(text: string): string | null {
  const patterns = [
    /(?:mobile|phone|cell|contact|tel\.?)\s*[:\-]?\s*(\d{10})/i,
    /(?:mobile|phone|cell|contact|tel\.?)\s*[:\-]?\s*(\+91[\s-]?\d{10})/i,
    /(?:mo\.?|ph\.?)\s*[:\-]?\s*(\d{10})/i,
    /\b(\d{10})\b/,
    /\b(\+91[\s-]?\d{10})\b/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const num = match[1].replace(/[\s\-+]/g, '')
      if (num.length === 10 || (num.length === 12 && num.startsWith('91'))) {
        return num.length === 12 ? num.substring(2) : num
      }
    }
  }
  return null
}

function extractAge(text: string): number | null {
  const patterns = [
    /(?:age|age\s*[:=]?)\s*[:\-]?\s*(\d{1,3})\s*(?:yrs?|years?|y\/o|y\.?o\.?)?/i,
    /(\d{1,3})\s*(?:yrs?|years?|y\/o|y\.?o\.?)\s*(?:male|female|m|f)?/i,
    /(?:age|DOB|date\s*of\s*birth)\s*[:\-]?\s*(\d{1,3})/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const age = parseInt(match[1])
      if (age > 0 && age < 150) return age
    }
  }
  return null
}

function extractGender(text: string): string | null {
  const lower = text.toLowerCase()
  if (/\b(male|man|gentleman|mr\.?)\b/i.test(lower) && !/\b(female|woman|lady|mrs|miss|ms\.?)\b/i.test(lower)) {
    return 'Male'
  }
  if (/\b(female|woman|lady|mrs|miss|ms\.?)\b/i.test(lower)) {
    return 'Female'
  }
  return null
}

function extractPatientId(text: string): string | null {
  const patterns = [
    /(?:patient\s*id|UHID|lab\s*id|MRN|registration\s*no|reg\.?\s*no)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i,
    /(?:UHID|MRN|PID)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  return null
}

function extractTestName(text: string): string | null {
  const patterns = [
    /(?:test\s*name|test\s*[:=]?)\s*[:\-]?\s*([A-Z][A-Za-z\s&]{2,50})/i,
    /(?:investigation|panel|profile)\s*[:\-]?\s*([A-Z][A-Za-z\s&]{2,50})/i,
    /(?:complete\s*blood\s*count|CBC|thyroid|lipid|liver|kidney|diabetes|hba1c|blood\s*glucose)/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]?.trim() || match[0]?.trim()
  }
  return null
}

function extractReportDate(text: string): string | null {
  const patterns = [
    /(?:report\s*date|date\s*[:=]?)\s*[:\-]?\s*(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/i,
    /(?:date\s*of\s*report|DOR)\s*[:\-]?\s*(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/i,
    /(\d{1,2}[\s\/\-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s\/\-]\d{2,4})/i,
    /(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4})/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]?.trim() || match[0]?.trim()
  }
  return null
}

function extractCollectionDate(text: string): string | null {
  const patterns = [
    /(?:sample|collection|collected)\s*(?:date|on|at)?\s*[:\-]?\s*(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/i,
    /(?:SCD|sample\s*date)\s*[:\-]?\s*(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]?.trim() || match[0]?.trim()
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

export function analyzeReportData(rawText: string): AnalysisResult {
  const patient = extractPatientData(rawText)
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

export function extractPatientData(text: string): ExtractedPatientData {
  const name = extractName(text)
  const mobile = extractMobile(text)
  const age = extractAge(text)
  const gender = extractGender(text)
  const patientId = extractPatientId(text)
  const testName = extractTestName(text)
  const reportDate = extractReportDate(text)
  const collectionDate = extractCollectionDate(text)

  let confidence = 0
  if (name) confidence += 25
  if (mobile) confidence += 25
  if (age !== null) confidence += 15
  if (patientId) confidence += 20
  if (testName) confidence += 10
  if (gender) confidence += 5

  return {
    name,
    mobile,
    age,
    gender,
    patientId,
    testName,
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
