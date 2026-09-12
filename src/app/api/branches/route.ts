import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    return Response.json({ branches }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('List public branches error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
