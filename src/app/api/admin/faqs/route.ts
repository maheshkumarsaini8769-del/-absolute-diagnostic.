import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { faqSchema } from '@/lib/validators'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const faqs = await prisma.fAQ.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    return Response.json({ faqs })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List FAQs error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = faqSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const faq = await prisma.fAQ.create({ data: parsed.data })

    await logAudit(admin.id, 'CREATE', 'faq', faq.id, faq.question)

    return Response.json({ faq }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create FAQ error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
