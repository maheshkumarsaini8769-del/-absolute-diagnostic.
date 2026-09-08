import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { generatePairingCode } from '@/lib/otp'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)

    const { code, expiresIn } = await generatePairingCode(admin.id)

    await logAudit(admin.id, 'pairing_code_generated', 'device', undefined, 'New pairing code generated')

    return Response.json({ code, expiresIn })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Generate pairing code error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
