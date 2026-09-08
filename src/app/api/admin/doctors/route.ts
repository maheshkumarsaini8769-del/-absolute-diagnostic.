import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { Doctor } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'doctors:read')
    let doctors = await Doctor.find().sort({ createdAt: -1 }).lean()

    // Auto-seed realistic referring practitioners if none exist
    if (doctors.length === 0) {
      const seed = [
        { name: 'Dr. Sameer Joshi, MD', specialization: 'Internal Medicine', clinicHospital: 'Apollo Medical Center', phone: '+91 98201 44512', email: 'dr.joshi@apollomed.com', referralCode: 'DOC-JOSHI-01', commissionPercent: 10, totalReferrals: 42, status: 'active' },
        { name: 'Dr. Ananya Sen, DNB', specialization: 'Cardiologist', clinicHospital: 'Heart & Rhythm Care Clinic', phone: '+91 98202 88410', email: 'ananya.sen@heartcare.org', referralCode: 'DOC-SEN-02', commissionPercent: 10, totalReferrals: 28, status: 'active' },
        { name: 'Dr. Vivek Mehra, MBBS', specialization: 'General Physician', clinicHospital: 'Mehra Family Health Clinic', phone: '+91 98203 11928', email: 'dr.vmehra@gmail.com', referralCode: 'DOC-MEHRA-03', commissionPercent: 12, totalReferrals: 65, status: 'active' },
        { name: 'Dr. Shalini Gupta, MD', specialization: 'Gynecologist', clinicHospital: 'Mother & Child Care', phone: '+91 98204 77319', email: 'dr.shalini@motherearth.in', referralCode: 'DOC-GUPTA-04', commissionPercent: 10, totalReferrals: 34, status: 'active' },
      ]
      await Doctor.insertMany(seed)
      doctors = await Doctor.find().sort({ createdAt: -1 }).lean()
    }

    return NextResponse.json({ doctors, total: doctors.length })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List doctors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'doctors:write')
    const body = await request.json()
    const { name, specialization, clinicHospital, phone, email, referralCode, commissionPercent } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Doctor name and phone number required' }, { status: 400 })
    }

    const code = referralCode ? referralCode.trim().toUpperCase() : `DOC-${name.split(' ')[1] || 'REF'}-${Math.floor(Math.random() * 900 + 100)}`

    const doc = await Doctor.create({
      name: name.trim(),
      specialization: specialization || 'General Physician',
      clinicHospital,
      phone: phone.trim(),
      email,
      referralCode: code,
      commissionPercent: Number(commissionPercent) || 10,
      status: 'active',
      totalReferrals: 0,
    })

    return NextResponse.json({ success: true, doctor: doc }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Create doctor error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
