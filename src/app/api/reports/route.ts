import { prisma } from '@/lib/prisma'
import { getPatientFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const patient = await getPatientFromRequest(request)
    if (!patient) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await prisma.report.findMany({
      where: { patientId: patient.id },
      select: {
        id: true,
        testName: true,
        reportDate: true,
        fileName: true,
        status: true,
        uploadedAt: true
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return Response.json({ reports })
  } catch (error) {
    console.error('List public reports error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
