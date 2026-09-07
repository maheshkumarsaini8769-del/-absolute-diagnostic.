import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { packageSchema } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const packages = await prisma.package.findMany({
      include: { packageTests: { include: { test: true } } },
      orderBy: { displayOrder: 'asc' }
    })

    return Response.json({ packages })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List packages error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = packageSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { testIds, ...packageData } = parsed.data

    const pkg = await prisma.package.create({
      data: packageData
    })

    if (testIds && testIds.length > 0) {
      await prisma.packageTest.createMany({
        data: testIds.map((testId) => ({
          packageId: pkg.id,
          testId
        }))
      })
    }

    const result = await prisma.package.findUnique({
      where: { id: pkg.id },
      include: { packageTests: { include: { test: true } } }
    })

    await logAudit(admin.id, 'CREATE', 'package', pkg.id, pkg.name)

    return Response.json({ package: result }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create package error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
