import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { findOrCreatePatientFull } from '@/lib/patient-matching'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    const patientsWithCounts = await Promise.all(
      patients.map(async (patient: any) => {
        const bookings = await prisma.booking.findMany({ where: { patientId: patient.id } })
        const reports = await prisma.report.findMany({ where: { patientId: patient.id } })
        return { ...patient, _count: { bookings: bookings.length, reports: reports.length } }
      })
    )

    return Response.json({ patients: patientsWithCounts })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List patients error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    if (!body.phone) {
      return Response.json({ error: 'phone is required' }, { status: 400 })
    }

    if (!body.name || !body.name.trim()) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    const { patient, isNew } = await findOrCreatePatientFull({
      name: body.name,
      phone: body.phone,
      age: body.age ?? null,
      gender: body.gender ?? null,
      email: body.email || null,
      address: body.address || null,
    })

    await logAudit(admin.id, isNew ? 'CREATE' : 'UPDATE', 'patient', patient.id, patient.name)

    return Response.json({ patient, isNew })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create/find patient error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
