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

    const homepageSettings: Record<string, string> = {
      site_name: settings.site_name || settings.lab_name || 'Absolute Diagnostic',
      site_description: settings.site_description || 'NABL accredited diagnostic laboratory providing accurate and timely test results.',
      contact_phone: settings.contact_phone || settings.primary_phone || '+919876543210',
      primary_phone: settings.primary_phone || settings.contact_phone || '+919876543210',
      contact_email: settings.contact_email || settings.email || 'info@absolutediagnostic.com',
      email: settings.email || settings.contact_email || 'info@absolutediagnostic.com',
      contact_address: settings.contact_address || settings.address || '123 Health Street, Medical District, Mumbai',
      address: settings.address || settings.contact_address || '123 Health Street, Medical District, Mumbai',
      whatsapp_number: settings.whatsapp_number || '+919876543210',
      emergency_number: settings.emergency_number || settings.primary_phone || '+919876543210',
      working_hours: settings.working_hours || 'Mon-Sat: 7:00 AM - 9:00 PM | Sun: 8:00 AM - 2:00 PM',
      home_collection_charge: settings.home_collection_charge || '100',
      night_service_charge: settings.night_service_charge || '200',
      ...settings,
    }

    return Response.json(
      { content, settings: homepageSettings, faqs },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('Get homepage error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
