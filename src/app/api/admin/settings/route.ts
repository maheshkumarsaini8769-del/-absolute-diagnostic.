import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { getAllSettings, setSetting } from '@/lib/settings'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const settings = await getAllSettings()

    return Response.json({ settings })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get settings error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    if (!body.settings || !Array.isArray(body.settings)) {
      return Response.json({ error: 'settings array is required' }, { status: 400 })
    }

    for (const item of body.settings) {
      if (!item.key || item.value === undefined) {
        return Response.json({ error: 'Each setting must have key and value' }, { status: 400 })
      }
      await setSetting(item.key, String(item.value), item.type)
    }

    await logAudit(
      admin.id,
      'UPDATE',
      'settings',
      undefined,
      `Updated ${body.settings.length} settings`
    )

    const settings = await getAllSettings()

    return Response.json({ settings })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update settings error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
