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
  const dir = path.join('uploads', 'reports', `${date.getFullYear()}`, `${String(date.getMonth() + 1).padStart(2, '0')}`)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  return path.join(dir, safeName)
}
