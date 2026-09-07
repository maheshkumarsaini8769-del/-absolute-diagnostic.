import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { getAllHomepageContent, setHomepageContent } from '@/lib/settings'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const content = await getAllHomepageContent()

    return Response.json({ content })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Get CMS error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()

    if (!body.content || typeof body.content !== 'object') {
      return Response.json({ error: 'content object is required' }, { status: 400 })
    }

    for (const [key, value] of Object.entries(body.content)) {
      if (typeof value === 'string') {
        await setHomepageContent(key, value)
      } else if (typeof value === 'object' && value !== null && 'value' in value) {
        await setHomepageContent(key, (value as { value: string }).value, (value as { type?: string }).type)
      }
    }

    await logAudit(
      admin.id,
      'UPDATE',
      'homepage_content',
      undefined,
      `Updated ${Object.keys(body.content).length} content fields`
    )

    const content = await getAllHomepageContent()

    return Response.json({ content })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Update CMS error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
