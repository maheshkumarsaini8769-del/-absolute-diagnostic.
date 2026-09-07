import { getAllHomepageContent } from '@/lib/settings'
import { getAllSettings } from '@/lib/settings'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [content, settings, faqs] = await Promise.all([
      getAllHomepageContent(),
      getAllSettings(),
      prisma.fAQ.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      })
    ])

    const homepageSettings: Record<string, string> = {}
    const relevantKeys = [
      'site_name', 'site_description', 'site_logo', 'contact_phone',
      'contact_email', 'contact_address', 'whatsapp_number',
      'home_collection_charge', 'night_charge', 'working_hours'
    ]

    for (const key of relevantKeys) {
      if (settings[key]) {
        homepageSettings[key] = settings[key]
      }
    }

    return Response.json({ content, settings: homepageSettings, faqs })
  } catch (error) {
    console.error('Get homepage error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
