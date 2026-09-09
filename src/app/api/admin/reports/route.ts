import { connectDB } from '@/lib/db/connect'
import { Report, Patient, Booking } from '@/models'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('q') || searchParams.get('search')
    const status = searchParams.get('status')
    const test = searchParams.get('test')
    const patientId = searchParams.get('patientId')
    const bookingId = searchParams.get('bookingId')
    const phone = searchParams.get('phone')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const dateField = searchParams.get('dateField') || 'reportDate'
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const sortBy = searchParams.get('sortBy') || 'newest'

    const where: any = {
      isDeleted: { $ne: true }
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'unmatched') {
        where.$or = [
          { status: 'unmatched' },
          { patientId: { $exists: false } },
          { patientId: null }
        ]
      } else {
        where.status = status
      }
    }

    // Test filter
    if (test && test.trim()) {
      const testRegex = new RegExp(test.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const testCondition = {
        $or: [
          { testName: testRegex },
          { extractedTestName: testRegex }
        ]
      }
      if (where.$and) {
        where.$and.push(testCondition)
      } else {
        where.$and = [testCondition]
      }
    }

    // Specific patient / booking filter
    if (patientId) {
      if (mongoose.Types.ObjectId.isValid(patientId)) {
        where.patientId = new mongoose.Types.ObjectId(patientId)
      } else {
        where.patientUHID = patientId
      }
    }
    if (bookingId) {
      if (mongoose.Types.ObjectId.isValid(bookingId)) {
        where.bookingId = new mongoose.Types.ObjectId(bookingId)
      }
    }
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)
      const phoneCondition = {
        $or: [
          { patientPhone: { $regex: cleanPhone } },
          { extractedMobile: { $regex: cleanPhone } }
        ]
      }
      if (where.$and) {
        where.$and.push(phoneCondition)
      } else {
        where.$and = [phoneCondition]
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const field = dateField === 'uploadedAt' ? 'uploadedAt' : 'reportDate'
      where[field] = {}
      if (dateFrom) {
        const fromD = new Date(dateFrom)
        fromD.setHours(0, 0, 0, 0)
        where[field].$gte = fromD
      }
      if (dateTo) {
        const toD = new Date(dateTo)
        toD.setHours(23, 59, 59, 999)
        where[field].$lte = toD
      }
    }

    // Backend Search query across multiple fields
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim()
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')

      // Check matching patients in database first
      const cleanDigits = q.replace(/\D/g, '')
      const patientMatchConditions: any[] = [{ name: regex }]
      if (cleanDigits.length >= 4) {
        patientMatchConditions.push({ phone: { $regex: cleanDigits } })
      }
      patientMatchConditions.push({ patientIdUHID: regex })

      const matchedPatients = await Patient.find({ $or: patientMatchConditions }).select('_id').lean()
      const matchedPatientIds = matchedPatients.map(p => p._id)

      const searchConditions: any[] = [
        { patientName: regex },
        { extractedName: regex },
        { patientPhone: regex },
        { extractedMobile: regex },
        { patientUHID: regex },
        { testName: regex },
        { extractedTestName: regex },
        { fileName: regex },
      ]

      if (matchedPatientIds.length > 0) {
        searchConditions.push({ patientId: { $in: matchedPatientIds } })
      }

      if (mongoose.Types.ObjectId.isValid(q)) {
        searchConditions.push({ _id: new mongoose.Types.ObjectId(q) })
        searchConditions.push({ bookingId: new mongoose.Types.ObjectId(q) })
      }

      if (where.$and) {
        where.$and.push({ $or: searchConditions })
      } else {
        where.$and = [{ $or: searchConditions }]
      }
    }

    // Sorting
    let sort: any = { uploadedAt: -1 }
    if (sortBy === 'oldest') sort = { uploadedAt: 1 }
    else if (sortBy === 'reportDate') sort = { reportDate: -1, uploadedAt: -1 }
    else if (sortBy === 'patient') sort = { patientName: 1, uploadedAt: -1 }
    else if (sortBy === 'status') sort = { status: 1, uploadedAt: -1 }

    // Pagination
    const pageNum = Math.max(1, parseInt(page || '1', 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)))
    const skip = (pageNum - 1) * limitNum

    const total = await Report.countDocuments(where)
    const reports = await Report.find(where)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean()

    // Enrich with Patient records
    const patientIds = [...new Set(reports.map((r: any) => r.patientId).filter(Boolean))]
    const patients = patientIds.length > 0
      ? await Patient.find({ _id: { $in: patientIds } }).lean()
      : []
    const patientMap = new Map(patients.map((p: any) => [p._id.toString(), p]))

    const enriched = reports.map((r: any) => {
      const pId = r.patientId ? r.patientId.toString() : null
      const dbPatient = pId ? patientMap.get(pId) : null
      const fallbackPatient = (r.patientName || r.extractedName) ? {
        id: pId || '',
        name: r.patientName || r.extractedName,
        phone: r.patientPhone || r.extractedMobile || 'N/A',
        age: r.patientAge !== null && r.patientAge !== undefined ? r.patientAge : (r.extractedAge || null),
        gender: r.patientGender || r.extractedGender || null,
        patientIdUHID: r.patientUHID || null,
      } : null

      return {
        id: r._id.toString(),
        ...r,
        patient: dbPatient ? {
          id: dbPatient._id.toString(),
          name: dbPatient.name,
          phone: dbPatient.phone,
          age: dbPatient.age,
          gender: dbPatient.gender,
          patientIdUHID: dbPatient.patientIdUHID,
        } : fallbackPatient,
      }
    })

    return Response.json({
      reports: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      }
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List reports error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    await connectDB()
    const body = await request.json()

    if (!body.patientId || !body.testName || !body.fileUrl || !body.fileName) {
      return Response.json(
        { error: 'patientId, testName, fileUrl, and fileName are required' },
        { status: 400 }
      )
    }

    const patient = mongoose.Types.ObjectId.isValid(body.patientId)
      ? await Patient.findById(body.patientId)
      : await Patient.findOne({ patientIdUHID: body.patientId })

    const report = await Report.create({
      patientId: patient?._id || new mongoose.Types.ObjectId(body.patientId),
      bookingId: body.bookingId && mongoose.Types.ObjectId.isValid(body.bookingId) ? new mongoose.Types.ObjectId(body.bookingId) : undefined,
      testName: body.testName,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      status: body.status || 'uploaded',
      patientName: patient?.name || body.patientName || undefined,
      patientPhone: patient?.phone || body.patientPhone || undefined,
      patientAge: patient?.age || body.patientAge || undefined,
      patientGender: patient?.gender || body.patientGender || undefined,
      patientUHID: patient?.patientIdUHID || body.patientUHID || undefined,
      reportDate: body.reportDate ? new Date(body.reportDate) : new Date(),
      uploadedAt: new Date(),
      uploadedBy: admin.name || admin.email || 'Admin',
      isDeleted: false,
    })

    await logAudit(admin.id, 'CREATE', 'report', report._id.toString(), report.testName)

    return Response.json({ report: { ...report.toObject(), id: report._id.toString() } }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create report error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
