import { prisma } from './prisma'
import type { ExtractedPatientData } from './pdf-extraction'

export type MatchConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export interface MatchResult {
  confidence: MatchConfidence
  score: number
  patientId: string | null
  bookingId: string | null
  patientName: string | null
  patientMobile: string | null
  patientAge: number | null
  patientGender: string | null
  matchMethod: string
  candidates: Array<{
    id: string
    name: string
    mobile: string
    age: number | null
    gender?: string | null
    score: number
  }>
}

function normalizeString(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function clean10DigitMobile(s: string | null | undefined): string | null {
  if (!s) return null
  const digits = s.replace(/\D/g, '')
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return digits
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.substring(2))) {
    return digits.substring(2)
  }
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.substring(1))) {
    return digits.substring(1)
  }
  return digits.length >= 10 ? digits.slice(-10) : null
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeString(a)
  const nb = normalizeString(b)
  if (!na || !nb) return 0
  if (na === nb) return 100

  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 85

  // First name exact match
  const firstA = a.trim().split(/\s+/)[0]?.toLowerCase() || ''
  const firstB = b.trim().split(/\s+/)[0]?.toLowerCase() || ''
  if (firstA.length >= 3 && firstA === firstB) {
    return 80
  }

  // First 4 chars match
  if (na.length >= 4 && nb.length >= 4 && na.substring(0, 4) === nb.substring(0, 4)) {
    const longer = na.length > nb.length ? na : nb
    const shorter = na.length > nb.length ? nb : na
    let matches = 0
    for (const ch of shorter) {
      if (longer.includes(ch)) matches++
    }
    return Math.min(85, 60 + Math.round((matches / shorter.length) * 25))
  }
  return 0
}

export async function matchPatient(data: ExtractedPatientData): Promise<MatchResult> {
  const candidates: MatchResult['candidates'] = []
  let bestScore = 0
  let bestMethod = 'no_match'
  let bestPatientId: string | null = null
  let bestBookingId: string | null = null
  let bestPatientName: string | null = null
  let bestPatientMobile: string | null = null
  let bestPatientAge: number | null = null
  let bestPatientGender: string | null = null

  // Priority 1: Patient ID / UHID exact match
  if (data.patientId || data.patientUHID) {
    const pid = data.patientId || data.patientUHID
    const orClauses: any[] = [{ patientId: pid }]
    if (pid && /^[0-9a-fA-F]{24}$/.test(pid)) {
      orClauses.push({ id: pid })
    }
    const patient = await prisma.patient.findFirst({
      where: {
        OR: orClauses,
      }
    })
    if (patient) {
      const pMobile = (patient as any).phone || (patient as any).mobile
      return {
        confidence: 'HIGH',
        score: 100,
        patientId: patient.id,
        bookingId: null,
        patientName: patient.name,
        patientMobile: pMobile,
        patientAge: patient.age,
        patientGender: patient.gender,
        matchMethod: 'patient_id_exact',
        candidates: [{ id: patient.id, name: patient.name, mobile: pMobile, age: patient.age, gender: patient.gender, score: 100 }],
      }
    }
  }

  // Priority 2: Booking ID / Reference ID match
  const candidateBookingId = data.bookingId || (data.patientId && data.patientId.startsWith('BK-') ? data.patientId : null)
  if (candidateBookingId) {
    const bookingOrClauses: any[] = [
      { bookingId: candidateBookingId },
      { tokenNumber: candidateBookingId },
    ]
    if (/^[0-9a-fA-F]{24}$/.test(candidateBookingId)) {
      bookingOrClauses.push({ id: candidateBookingId })
    }
    const booking = await prisma.booking.findFirst({
      where: {
        OR: bookingOrClauses,
      }
    })
    if (booking && booking.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: booking.patientId }
      })
      if (patient) {
        const pMobile = (patient as any).phone || (patient as any).mobile
        return {
          confidence: 'HIGH',
          score: 95,
          patientId: patient.id,
          bookingId: booking.id,
          patientName: patient.name,
          patientMobile: pMobile,
          patientAge: patient.age,
          patientGender: patient.gender,
          matchMethod: 'booking_id_match',
          candidates: [{ id: patient.id, name: patient.name, mobile: pMobile, age: patient.age, gender: patient.gender, score: 95 }],
        }
      }
    }
  }

  // Priority 3: Phone / Mobile match (with family disambiguation)
  const normalizedMobile = clean10DigitMobile(data.mobile)
  if (normalizedMobile) {
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { phone: normalizedMobile },
          { phone: `+91${normalizedMobile}` },
          { phone: `91${normalizedMobile}` },
          { phone: { contains: normalizedMobile } },
        ]
      }
    })

    if (patients.length === 1) {
      const p = patients[0]
      const pMobile = (p as any).phone || (p as any).mobile
      let score = 70 // strong base for exact phone match

      if (data.name) {
        const sim = nameSimilarity(data.name, p.name)
        if (sim >= 80) score += 25
        else if (sim >= 50) score += 15
        else score -= 10 // different name sharing same phone (family member)
      } else {
        score += 15 // no conflicting name
      }

      if (data.age !== null && p.age !== null) {
        if (Math.abs(data.age - p.age) <= 1) score += 10
        else if (Math.abs(data.age - p.age) <= 3) score += 5
      }

      score = Math.min(100, Math.max(0, score))
      candidates.push({ id: p.id, name: p.name, mobile: pMobile, age: p.age, gender: p.gender, score: Math.round(score) })

      bestScore = score
      bestMethod = 'mobile_single_match'
      bestPatientId = p.id
      bestPatientName = p.name
      bestPatientMobile = pMobile
      bestPatientAge = p.age
      bestPatientGender = p.gender
    } else if (patients.length > 1) {
      // Multiple patients sharing the same phone number (family members)
      for (const p of patients) {
        let score = 50 // base for family phone
        const pMobile = (p as any).phone || (p as any).mobile

        if (data.name) {
          const sim = nameSimilarity(data.name, p.name)
          score += sim * 0.4
        }
        if (data.age !== null && p.age !== null) {
          if (Math.abs(data.age - p.age) <= 1) score += 20
          else if (Math.abs(data.age - p.age) <= 3) score += 10
        }
        if (data.gender && p.gender && data.gender.toLowerCase() === p.gender.toLowerCase()) {
          score += 10
        }

        score = Math.min(100, Math.round(score))
        candidates.push({ id: p.id, name: p.name, mobile: pMobile, age: p.age, gender: p.gender, score })

        if (score > bestScore) {
          bestScore = score
          bestMethod = 'mobile_family_match'
          bestPatientId = p.id
          bestPatientName = p.name
          bestPatientMobile = pMobile
          bestPatientAge = p.age
          bestPatientGender = p.gender
        }
      }
      candidates.sort((a, b) => b.score - a.score)
    }
  }

  // Priority 4: Multi-field match (Name + Age) - NEVER match on name alone!
  if (!bestPatientId && data.name && data.age !== null) {
    const firstName = data.name.trim().split(/\s+/)[0]
    if (firstName && firstName.length >= 3) {
      const patients = await prisma.patient.findMany({
        where: {
          name: { contains: firstName },
        },
        take: 10,
      })

      for (const p of patients) {
        const sim = nameSimilarity(data.name, p.name)
        // Must have strong name similarity AND close age
        if (sim >= 75 && p.age !== null && Math.abs(data.age - p.age) <= 2) {
          const pMobile = (p as any).phone || (p as any).mobile
          let score = 55 + (sim * 0.25)
          if (data.gender && p.gender && data.gender.toLowerCase() === p.gender.toLowerCase()) {
            score += 10
          }
          score = Math.min(85, Math.round(score))

          candidates.push({ id: p.id, name: p.name, mobile: pMobile, age: p.age, gender: p.gender, score })

          if (score > bestScore) {
            bestScore = score
            bestMethod = 'multi_field_name_age'
            bestPatientId = p.id
            bestPatientName = p.name
            bestPatientMobile = pMobile
            bestPatientAge = p.age
            bestPatientGender = p.gender
          }
        }
      }
      candidates.sort((a, b) => b.score - a.score)
    }
  }

  let confidence: MatchConfidence = 'NONE'
  if (bestScore >= 80) confidence = 'HIGH'
  else if (bestScore >= 50) confidence = 'MEDIUM'
  else if (bestScore >= 30) confidence = 'LOW'

  return {
    confidence,
    score: Math.round(bestScore),
    patientId: bestScore >= 50 ? bestPatientId : null,
    bookingId: bestBookingId,
    patientName: bestPatientName || data.name,
    patientMobile: bestPatientMobile || data.mobile,
    patientAge: bestPatientAge || data.age,
    patientGender: bestPatientGender || data.gender || null,
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
