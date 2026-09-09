import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Patient } from '@/models'
import { verifySessionToken } from '@/lib/zenuxs-auth'

export const dynamic = 'force-dynamic'

async function getPatientFromReq(request: Request) {
  const cookieHeader = request.headers.get('Cookie')
  const match = cookieHeader?.match(/session_token=([^;]+)/)
  const token = match?.[1] || request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

  const payload = verifySessionToken(token)
  if (!payload || !payload.patientId) return null

  await connectDB()
  return await Patient.findById(payload.patientId)
}

// GET: Fetch family members
export async function GET(request: Request) {
  try {
    const patient = await getPatientFromReq(request)
    if (!patient) {
      // Fallback: check query param phone if provided with basic security
      const { searchParams } = new URL(request.url)
      const phone = searchParams.get('phone')
      if (phone) {
        await connectDB()
        const cleanPhone = phone.replace(/\D/g, '').slice(-10)
        const p = await Patient.findOne({ phone: cleanPhone })
        return NextResponse.json({
          success: true,
          familyMembers: p?.familyMembers || []
        })
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      familyMembers: patient.familyMembers || []
    })
  } catch (error: any) {
    console.error('Get family members error:', error)
    return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 })
  }
}

// POST: Add a new family member
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, age, gender, relation, phone } = body

    if (!name || !relation) {
      return NextResponse.json({ error: 'Name and relation are required' }, { status: 400 })
    }

    let patient = await getPatientFromReq(request)
    if (!patient && phone) {
      await connectDB()
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)
      patient = await Patient.findOne({ phone: cleanPhone })
    }

    if (!patient) {
      return NextResponse.json({ error: 'Patient account not found' }, { status: 404 })
    }

    const newMember = {
      name: name.trim(),
      age: age ? Number(age) : undefined,
      gender: gender || 'Other',
      relation: relation.trim(),
    }

    if (!patient.familyMembers) {
      patient.familyMembers = []
    }

    patient.familyMembers.push(newMember as any)
    await patient.save()

    return NextResponse.json({
      success: true,
      familyMembers: patient.familyMembers,
      message: `${name} added to your family profiles!`
    })
  } catch (error: any) {
    console.error('Add family member error:', error)
    return NextResponse.json({ error: 'Failed to add family member' }, { status: 500 })
  }
}

// DELETE: Remove a family member
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('id')
    const phone = searchParams.get('phone')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    let patient = await getPatientFromReq(request)
    if (!patient && phone) {
      await connectDB()
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)
      patient = await Patient.findOne({ phone: cleanPhone })
    }

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (patient.familyMembers) {
      patient.familyMembers = patient.familyMembers.filter(
        (m: any) => m._id?.toString() !== memberId && m.id !== memberId
      )
      await patient.save()
    }

    return NextResponse.json({
      success: true,
      familyMembers: patient.familyMembers,
      message: 'Family member removed successfully'
    })
  } catch (error: any) {
    console.error('Delete family member error:', error)
    return NextResponse.json({ error: 'Failed to delete family member' }, { status: 500 })
  }
}
