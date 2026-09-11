import { connectDB } from './db/connect'
import { Test, ITest } from '@/models'

export interface CatalogMatchResult {
  detectedName: string
  normalizedName: string
  matchedCatalogTestId?: string
  catalogName?: string
  categoryName?: string
  price?: number
  mrp?: number
  discount?: number
  confidence: number
  matchStatus: 'EXACT_MATCH' | 'STRONG_MATCH' | 'POSSIBLE_MATCH' | 'NEEDS_CONFIRMATION' | 'NOT_FOUND'
  isConfirmedByUser: boolean
  fastingRequired?: boolean
  homeCollection?: boolean
  reportTime?: string
}

// Common Medical Aliases & Acronyms Mappings for Indian Pathology Reports
const ALIAS_MAP: Record<string, string[]> = {
  'cbc': ['complete blood count', 'complete haemogram', 'hemogram', 'blood count'],
  'complete blood count': ['cbc', 'haemogram', 'hemogram'],
  'hba1c': ['glycated haemoglobin', 'glycosylated hemoglobin', 'a1c', 'glycated hemoglobin'],
  'glycated haemoglobin': ['hba1c', 'glycosylated hemoglobin'],
  'lft': ['liver function test', 'hepatic function test'],
  'kft': ['kidney function test', 'renal function test', 'rft'],
  'rft': ['renal function test', 'kidney function test', 'kft'],
  'tsh': ['thyroid stimulating hormone', 'thyrotropin'],
  'tft': ['thyroid profile', 'thyroid function test'],
  'lipid profile': ['lipid panel', 'cholesterol test', 'lipid screening'],
  'vitamin d': ['25 hydroxy vitamin d', 'vit d', 'vit d3', 'cholecalciferol', 'vitamin d total'],
  'vitamin b12': ['vit b12', 'cyanocobalamin', 'b12'],
  'serum creatinine': ['creatinine', 'creatinine serum'],
  'blood urea nitrogen': ['bun', 'urea blood', 'serum urea'],
  'fasting blood sugar': ['blood sugar fasting', 'fbs', 'glucose fasting'],
  'post prandial blood sugar': ['ppbs', 'blood sugar pp', 'glucose pp'],
  'urine routine': ['urinalysis', 'urine r/m', 'urine routine and microscopy'],
  'esr': ['erythrocyte sedimentation rate'],
  'crp': ['c reactive protein', 'c-reactive protein'],
  'ferritin': ['serum ferritin'],
  'iron profile': ['iron studies', 'serum iron and tibc'],
  'calcium': ['serum calcium', 'total calcium'],
  'uric acid': ['serum uric acid'],
  'electrolytes': ['serum electrolytes', 'sodium potassium chloride'],
  'sgot': ['ast', 'aspartate aminotransferase'],
  'sgpt': ['alt', 'alanine aminotransferase'],
  'bilirubin': ['total bilirubin', 'serum bilirubin'],
  'widal': ['widal test', 'typhoid widal'],
  'dengue ns1': ['dengue antigen', 'dengue rapid'],
  'malaria': ['mp test', 'malaria parasite'],
  'hiv': ['hiv 1 and 2', 'hiv antibody test'],
  'hbsag': ['hepatitis b surface antigen', 'hep b test'],
  'anti tpo': ['anti tpo antibodies', 'thyroid peroxidase antibody']
}

export function normalizeTestText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\(\)\[\]\{\}\:\-\_\/\,\+\*]/g, ' ')
    .replace(/\b(test|serum|plasma|blood|routine|level|total|profile|panel|screen|analysis|assay)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTestText(str1)
  const s2 = normalizeTestText(str2)

  if (s1 === s2) return 1.0
  if (!s1 || !s2) return 0.0

  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length)
    const maxLen = Math.max(s1.length, s2.length)
    return minLen / maxLen >= 0.6 ? 0.88 : 0.75
  }

  // Token matching (Jaccard similarity of words)
  const words1 = new Set(s1.split(' ').filter(w => w.length > 1))
  const words2 = new Set(s2.split(' ').filter(w => w.length > 1))
  if (words1.size === 0 || words2.size === 0) return 0.0

  let common = 0
  for (const w of words1) {
    if (words2.has(w)) common++
  }

  const union = new Set([...words1, ...words2]).size
  return common / union
}

export const FALLBACK_CATALOG_TESTS: Array<{
  _id: any
  name: string
  slug: string
  price: number
  mrp?: number
  discount?: number
  categoryId?: { name: string }
  fastingRequired?: boolean
  homeCollection?: boolean
  reportTime?: string
}> = [
  { _id: '6a9e6dc970dfc75715e896b4', name: 'Complete Blood Count (CBC)', slug: 'cbc', price: 200, mrp: 250, categoryId: { name: 'Hematology' }, homeCollection: true, reportTime: '4 hours' },
  { _id: '6a9e6dc970dfc75715e896c2', name: 'Liver Function Test (LFT)', slug: 'lft', price: 450, mrp: 550, categoryId: { name: 'Clinical Biochemistry' }, homeCollection: true, reportTime: '24 hours' },
  { _id: '6a9e6dc970dfc75715e896c3', name: 'Kidney Function Test (KFT)', slug: 'kft', price: 400, mrp: 500, categoryId: { name: 'Clinical Biochemistry' }, homeCollection: true, reportTime: '24 hours' },
  { _id: '6a9e6dc970dfc75715e896bf', name: 'HbA1c (Glycated Haemoglobin)', slug: 'hba1c', price: 400, mrp: 500, categoryId: { name: 'Diabetes' }, homeCollection: true, reportTime: '24 hours' },
  { _id: '6a9e6dc970dfc75715e896cb', name: 'Lipid Profile', slug: 'lipid-profile', price: 350, mrp: 450, categoryId: { name: 'Clinical Biochemistry' }, fastingRequired: true, homeCollection: true, reportTime: '24 hours' },
  { _id: '6a9e6dc970dfc75715e896cd', name: 'Vitamin D (25-Hydroxy)', slug: 'vitamin-d', price: 600, mrp: 750, categoryId: { name: 'Vitamins' }, homeCollection: true, reportTime: '48 hours' },
  { _id: '6a9e6dc970dfc75715e896ce', name: 'Vitamin B12', slug: 'vitamin-b12', price: 500, mrp: 600, categoryId: { name: 'Vitamins' }, homeCollection: true, reportTime: '48 hours' },
  { _id: '6a9e6dc970dfc75715e896c0', name: 'Blood Sugar Fasting', slug: 'blood-sugar-fasting', price: 80, mrp: 100, categoryId: { name: 'Diabetes' }, fastingRequired: true, homeCollection: true, reportTime: '2 hours' },
  { _id: '6a9e6dc970dfc75715e896b7', name: 'Thyroid Profile (T3, T4, TSH)', slug: 'thyroid-profile', price: 500, mrp: 600, categoryId: { name: 'Thyroid' }, homeCollection: true, reportTime: '24 hours' },
  { _id: '6a9e6dc970dfc75715e896e0', name: 'Urinalysis (Routine)', slug: 'urine-routine', price: 100, mrp: 150, categoryId: { name: 'Clinical Biochemistry' }, homeCollection: true, reportTime: '4 hours' },
  { _id: '6a9e6dc970dfc75715e896c7', name: 'Serum Creatinine', slug: 'serum-creatinine', price: 150, mrp: 200, categoryId: { name: 'Clinical Biochemistry' }, homeCollection: true, reportTime: '4 hours' },
  { _id: '6a9e6dc970dfc75715e896c8', name: 'Blood Urea Nitrogen (BUN)', slug: 'bun', price: 150, mrp: 200, categoryId: { name: 'Clinical Biochemistry' }, homeCollection: true, reportTime: '4 hours' },
  { _id: '6a9e6dc970dfc75715e896d0', name: 'Dengue NS1 Antigen', slug: 'dengue-ns1', price: 600, mrp: 800, categoryId: { name: 'Microbiology & Serology' }, homeCollection: true, reportTime: '4 hours' },
  { _id: '6a9e6dc970dfc75715e896d2', name: 'Widal Test (Typhoid)', slug: 'widal', price: 180, mrp: 250, categoryId: { name: 'Microbiology & Serology' }, homeCollection: true, reportTime: '4 hours' },
  { _id: '6a9e6dc970dfc75715e896d4', name: 'C-Reactive Protein (CRP)', slug: 'crp', price: 350, mrp: 450, categoryId: { name: 'Clinical Immunology' }, homeCollection: true, reportTime: '6 hours' },
  { _id: '6a9e6dc970dfc75715e896b6', name: 'ESR (Erythrocyte Sedimentation Rate)', slug: 'esr', price: 80, mrp: 120, categoryId: { name: 'Hematology' }, homeCollection: true, reportTime: '2 hours' },
]

export async function matchDetectedWithCatalog(detectedList: string[]): Promise<CatalogMatchResult[]> {
  let allTests: any[] = []
  try {
    await connectDB()
    const dbTests: any[] = await Test.find({ isActive: true }).populate('categoryId').lean()
    if (dbTests && dbTests.length > 0) {
      allTests = dbTests
    } else {
      allTests = FALLBACK_CATALOG_TESTS
    }
  } catch (err) {
    console.warn('DB catalog fetch note (using fallback catalog):', err)
    allTests = FALLBACK_CATALOG_TESTS
  }

  const results: CatalogMatchResult[] = []
  const seenCatalogIds = new Set<string>()

  for (const detected of detectedList) {
    const rawDetected = detected.trim()
    if (!rawDetected) continue

    const normalizedDetected = normalizeTestText(rawDetected)
    const lowerDetected = rawDetected.toLowerCase()

    let bestMatch: ITest | null = null
    let bestScore = 0
    let matchType: CatalogMatchResult['matchStatus'] = 'NOT_FOUND'

    // 1. Direct name or slug match
    for (const test of allTests) {
      const lowerTestName = test.name.toLowerCase()
      const normTestName = normalizeTestText(test.name)

      if (lowerTestName === lowerDetected || normTestName === normalizedDetected) {
        bestMatch = test
        bestScore = 0.99
        matchType = 'EXACT_MATCH'
        break
      }

      // Check Acronyms in parens e.g. "Complete Blood Count (CBC)"
      const parenMatch = lowerTestName.match(/\(([^)]+)\)/)
      if (parenMatch && (parenMatch[1].trim() === lowerDetected || parenMatch[1].trim() === normalizedDetected)) {
        bestMatch = test
        bestScore = 0.96
        matchType = 'EXACT_MATCH'
        break
      }

      // Check alias dictionary
      for (const [key, aliases] of Object.entries(ALIAS_MAP)) {
        const matchesKey = lowerDetected === key || normalizedDetected === key || aliases.includes(lowerDetected)
        const testMatches = lowerTestName.includes(key) || aliases.some(a => lowerTestName.includes(a))

        if (matchesKey && testMatches) {
          const score = 0.92
          if (score > bestScore) {
            bestMatch = test
            bestScore = score
            matchType = 'STRONG_MATCH'
          }
        }
      }

      // Fuzzy text similarity
      const sim = calculateSimilarity(rawDetected, test.name)
      if (sim > bestScore) {
        bestScore = sim
        bestMatch = test
        if (sim >= 0.85) matchType = 'STRONG_MATCH'
        else if (sim >= 0.65) matchType = 'POSSIBLE_MATCH'
        else if (sim >= 0.45) matchType = 'NEEDS_CONFIRMATION'
      }
    }

    if (bestMatch && bestScore >= 0.5) {
      const catId = (bestMatch._id as any).toString()
      // Avoid duplicate item charging if detected multiple times
      const isDuplicate = seenCatalogIds.has(catId)
      if (!isDuplicate) {
        seenCatalogIds.add(catId)
      }

      results.push({
        detectedName: rawDetected,
        normalizedName: bestMatch.name,
        matchedCatalogTestId: catId,
        catalogName: bestMatch.name,
        categoryName: (bestMatch.categoryId as any)?.name || 'General Pathology',
        price: bestMatch.price,
        mrp: bestMatch.mrp || bestMatch.price,
        discount: bestMatch.discount || 0,
        confidence: parseFloat(bestScore.toFixed(2)),
        matchStatus: isDuplicate ? 'NEEDS_CONFIRMATION' : matchType,
        isConfirmedByUser: !isDuplicate && (matchType === 'EXACT_MATCH' || matchType === 'STRONG_MATCH'),
        fastingRequired: bestMatch.fastingRequired,
        homeCollection: bestMatch.homeCollection,
        reportTime: bestMatch.reportTime,
      })
    } else {
      results.push({
        detectedName: rawDetected,
        normalizedName: rawDetected,
        confidence: 0,
        matchStatus: 'NOT_FOUND',
        isConfirmedByUser: false
      })
    }
  }

  return results
}
