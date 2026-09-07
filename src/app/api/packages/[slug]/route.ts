import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const pkg = await prisma.package.findUnique({
      where: { slug },
      include: { packageTests: { include: { test: { include: { category: true } } } } }
    })
    if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(JSON.parse(JSON.stringify(pkg)))
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
