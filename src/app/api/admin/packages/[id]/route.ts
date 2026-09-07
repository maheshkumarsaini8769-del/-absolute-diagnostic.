import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { packageSchema } from '@/lib/validators'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await context.params

    const pkg = await prisma.package.findUnique({
      where: { id },
      include: { packageTests: { include: { test: true } } }
    })

    if (!pkg) {
      return Response.json({ error: 'Package not found' }, { status: 404 })
    }

    return Response.json({ package: pkg })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get package error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params
    const body = await request.json()
    const parsed = packageSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.package.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Package not found' }, { status: 404 })
    }

    const { testIds, ...packageData } = parsed.data

    const pkg = await prisma.package.update({
      where: { id },
      data: packageData
    })

    if (testIds !== undefined) {
      await prisma.packageTest.deleteMany({ where: { packageId: id } })
      if (testIds.length > 0) {
        await prisma.packageTest.createMany({
          data: testIds.map((testId) => ({
            packageId: id,
            testId
          }))
        })
      }
    }

    const result = await prisma.package.findUnique({
      where: { id },
      include: { packageTests: { include: { test: true } } }
    })

    await logAudit(admin.id, 'UPDATE', 'package', id, pkg.name)

    return Response.json({ package: result })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update package error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params

    const existing = await prisma.package.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Package not found' }, { status: 404 })
    }

    await prisma.package.update({
      where: { id },
      data: { isActive: false }
    })

    await logAudit(admin.id, 'DELETE', 'package', id, existing.name)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Delete package error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
