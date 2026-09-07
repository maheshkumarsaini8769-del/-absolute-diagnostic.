import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      include: {
        packageTests: { include: { test: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
    })
    return NextResponse.json(JSON.parse(JSON.stringify(packages)))
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
