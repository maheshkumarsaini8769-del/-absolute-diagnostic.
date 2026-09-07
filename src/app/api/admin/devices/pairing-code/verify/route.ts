import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { verifyPairingCode } from '@/lib/otp'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Pairing code is required' }, { status: 400 })
    }

    const result = await verifyPairingCode(code, admin.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    await logAudit(admin.id, 'pairing_code_verified', 'device', undefined, 'Pairing code verified successfully')

    return NextResponse.json({ success: true, message: 'Pairing code verified' })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Verify pairing code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
