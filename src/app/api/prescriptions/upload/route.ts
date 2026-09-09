import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { PrescriptionLead } from '@/models'
import { getAdminFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST: Public upload prescription
export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const { patientName, patientPhone, patientAddress, notes, fileData, fileName, mimeType } = body

    if (!patientName || !patientPhone) {
      return NextResponse.json(
        { error: 'Patient name and phone number are required' },
        { status: 400 }
      )
    }

    if (!fileData) {
      return NextResponse.json(
        { error: 'Please attach or capture your prescription photo' },
        { status: 400 }
      )
    }

    // Clean phone
    const cleanPhone = patientPhone.replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      )
    }

    const lead = await PrescriptionLead.create({
      patientName: patientName.trim(),
      patientPhone: cleanPhone,
      patientAddress: patientAddress?.trim() || '',
      notes: notes?.trim() || '',
      fileData,
      fileName: fileName || `prescription-${Date.now()}.jpg`,
      mimeType: mimeType || 'image/jpeg',
      status: 'pending',
    })

    return NextResponse.json({
      success: true,
      leadId: lead._id,
      message: 'Prescription uploaded successfully! Our lab team will call you within 15 minutes.'
    })
  } catch (error: any) {
    console.error('Prescription upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload prescription' }, { status: 500 })
  }
}

// GET: Admin list prescriptions
export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const leads = await PrescriptionLead.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return NextResponse.json({ success: true, leads })
  } catch (error: any) {
    console.error('Get prescriptions error:', error)
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 })
  }
}

// PATCH: Admin update prescription status / notes
export async function PATCH(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { id, status, adminNotes, bookingId } = body

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (bookingId) updateData.bookingId = bookingId

    const updated = await PrescriptionLead.findByIdAndUpdate(id, updateData, { new: true })
    if (!updated) {
      return NextResponse.json({ error: 'Prescription lead not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, lead: updated })
  } catch (error: any) {
    console.error('Update prescription error:', error)
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}
