import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = { isActive: true }
    if (search) where.name = { contains: search }

    if (category) {
      const cat = await prisma.testCategory.findFirst({ where: { slug: category } })
      if (cat) {
        where.categoryId = cat.id
      } else {
        where.categoryId = '__none__'
      }
    }

    const [tests, categories] = await Promise.all([
      prisma.test.findMany({
        where,
        include: { category: true },
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
      }),
      prisma.testCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ])

    return NextResponse.json(JSON.parse(JSON.stringify({ tests, categories })))
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
