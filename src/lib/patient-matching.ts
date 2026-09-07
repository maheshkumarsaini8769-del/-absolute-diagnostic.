import { prisma } from './prisma'
import type { ExtractedPatientData } from './pdf-extraction'

export type MatchConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export interface MatchResult {
  confidence: MatchConfidence
  score: number
  patientId: string | null
  patientName: string | null
  patientMobile: string | null
  patientAge: number | null
  matchMethod: string
  candidates: Array<{
    id: string
    name: string
    mobile: string
    age: number | null
    score: number
  }>
}

function normalizeString(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeString(a)
  const nb = normalizeString(b)
  if (na === nb) return 100

  // First 4 chars match (important for walk-in password system)
  if (na.substring(0, 4) === nb.substring(0, 4)) {
    // Levenshtein-like similarity for remaining chars
    if (na.includes(nb) || nb.includes(na)) return 90
    const longer = na.length > nb.length ? na : nb
    const shorter = na.length > nb.length ? nb : na
    let matches = 0
    for (const ch of shorter) {
      if (longer.includes(ch)) matches++
    }
    return Math.min(95, 70 + (matches / shorter.length) * 25)
  }
  return 0
}

export async function matchPatient(data: ExtractedPatientData): Promise<MatchResult> {
  const candidates: MatchResult['candidates'] = []
  let bestScore = 0
  let bestMethod = 'no_match'
  let bestPatientId: string | null = null
  let bestPatientName: string | null = null
  let bestPatientMobile: string | null = null
  let bestPatientAge: number | null = null

  // Priority 1: Patient ID/UHID/Lab ID exact match
  if (data.patientId) {
    const patient = await prisma.patient.findFirst({
      where: { patientId: data.patientId }
    })
    if (patient) {
      return {
        confidence: 'HIGH',
        score: 100,
        patientId: patient.id,
        patientName: patient.name,
        patientMobile: (patient as any).phone || (patient as any).mobile,
        patientAge: patient.age,
        matchMethod: 'patient_id_exact',
        candidates: [{ id: patient.id, name: patient.name, mobile: (patient as any).phone || (patient as any).mobile, age: patient.age, score: 100 }],
      }
    }
  }

  // Priority 2: Mobile number lookup
  if (data.mobile) {
    const patients = await prisma.patient.findMany({
      where: { phone: data.mobile }
    })

    if (patients.length === 1) {
      const p = patients[0]
      let score = 50 // mobile match base
      const pMobile = (p as any).phone || (p as any).mobile

      if (data.name) {
        const sim = nameSimilarity(data.name, p.name)
        score += sim * 0.4
      }
      if (data.age !== null && p.age !== null) {
        if (Math.abs(data.age - p.age) <= 2) score += 15
        else if (Math.abs(data.age - p.age) <= 5) score += 5
      }

      candidates.push({ id: p.id, name: p.name, mobile: pMobile, age: p.age, score: Math.round(score) })

      if (score > bestScore) {
        bestScore = score
        bestMethod = 'mobile_single_match'
        bestPatientId = p.id
        bestPatientName = p.name
        bestPatientMobile = pMobile
        bestPatientAge = p.age
      }
    } else if (patients.length > 1) {
      // Multiple patients with same mobile (family members)
      for (const p of patients) {
        let score = 40 // mobile match base for family scenario
        const pMobile = (p as any).phone || (p as any).mobile

        if (data.name) {
          const sim = nameSimilarity(data.name, p.name)
          score += sim * 0.5
        }
        if (data.age !== null && p.age !== null) {
          if (Math.abs(data.age - p.age) <= 1) score += 20
          else if (Math.abs(data.age - p.age) <= 3) score += 10
        }

        candidates.push({ id: p.id, name: p.name, mobile: pMobile, age: p.age, score: Math.round(score) })

        if (score > bestScore) {
          bestScore = score
          bestMethod = 'mobile_family_match'
          bestPatientId = p.id
          bestPatientName = p.name
          bestPatientMobile = (p as any).phone || (p as any).mobile
          bestPatientAge = p.age
        }
      }
      candidates.sort((a, b) => b.score - a.score)
    }
  }

  // Priority 3: Name-only search (fallback)
  if (!bestPatientId && data.name) {
    const patients = await prisma.patient.findMany({
      where: { name: { contains: data.name.split(' ')[0] } },
      take: 10,
    })

    for (const p of patients) {
      const sim = nameSimilarity(data.name, p.name)
      if (sim >= 80) {
        let score = sim * 0.6
        const pMobile = (p as any).phone || (p as any).mobile
        if (data.age !== null && p.age !== null) {
          if (Math.abs(data.age - p.age) <= 2) score += 20
        }
        if (data.mobile && pMobile === data.mobile) score += 25

        candidates.push({ id: p.id, name: p.name, mobile: pMobile, age: p.age, score: Math.round(score) })

        if (score > bestScore) {
          bestScore = score
          bestMethod = 'name_search'
          bestPatientId = p.id
          bestPatientName = p.name
          bestPatientMobile = (p as any).phone || (p as any).mobile
          bestPatientAge = p.age
        }
      }
    }
  }

  let confidence: MatchConfidence = 'NONE'
  if (bestScore >= 80) confidence = 'HIGH'
  else if (bestScore >= 50) confidence = 'MEDIUM'
  else if (bestScore >= 30) confidence = 'LOW'

  return {
    confidence,
    score: Math.round(bestScore),
    patientId: bestPatientId,
    patientName: bestPatientName,
    patientMobile: bestPatientMobile,
    patientAge: bestPatientAge,
    matchMethod: bestMethod,
    candidates: candidates.slice(0, 5),
  }
}

export async function findOrCreatePatient(data: {
  name: string
  mobile: string
  age?: number | null
  gender?: string | null
}): Promise<string> {
  const phone = data.mobile

  const existing = await prisma.patient.findFirst({
    where: {
      phone,
      name: { contains: data.name.split(' ')[0] },
    }
  })
  if (existing) return existing.id

  const patient = await prisma.patient.create({
    data: {
      name: data.name,
      phone,
      age: data.age || null,
      gender: data.gender || null,
    }
  })
  return patient.id
}

export async function findOrCreatePatientFull(data: {
  name: string
  phone: string
  age?: number | null
  gender?: string | null
  email?: string | null
  address?: string | null
}): Promise<{ patient: any; isNew: boolean }> {
  const existing = await prisma.patient.findFirst({
    where: {
      phone: data.phone,
      name: { contains: data.name.split(' ')[0] },
    }
  })
  if (existing) return { patient: existing, isNew: false }

  const patient = await prisma.patient.create({
    data: {
      name: data.name,
      phone: data.phone,
      age: data.age || null,
      gender: data.gender || null,
      email: data.email || null,
      address: data.address || null,
    }
  })
  return { patient, isNew: true }
}

export async function verifyWalkInPatient(
  phone: string,
  namePrefix: string,
  age: number
): Promise<{ id: string; name: string; phone: string; age: number | null } | null> {
  const patients = await prisma.patient.findMany({
    where: { phone }
  })

  for (const p of patients) {
    // Check name prefix (first 4 chars, case-insensitive)
    const pNameUpper = p.name.toUpperCase().replace(/[^A-Z]/g, '')
    const nameUpper = namePrefix.toUpperCase().replace(/[^A-Z]/g, '')
    if (pNameUpper.startsWith(nameUpper) && nameUpper.length >= 4) {
      // Check age (exact match or within 1 year for date-of-birth edge cases)
      if (p.age !== null && p.age !== undefined) {
        if (Math.abs(p.age - age) <= 1) {
          return { id: p.id, name: p.name, phone: (p as any).phone || (p as any).mobile, age: p.age }
        }
      }
    }
  }

  return null
}
