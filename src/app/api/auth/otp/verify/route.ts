import { NextResponse } from 'next/server'
import { verifyAdminOTP } from '@/lib/otp'
import { generateSessionToken, createSessionCookie } from '@/lib/zenuxs-auth'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = (body.email || '').trim()
    const otp = (body.otp || body.code || '').trim()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    if (typeof otp !== 'string' || otp.length !== 6) {
      return NextResponse.json({ error: 'OTP must be 6 digits' }, { status: 400 })
    }

    const result = await verifyAdminOTP(email, otp)

    if (!result.success || !result.admin) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    // Create session
    const sessionToken = generateSessionToken({
      adminId: result.admin.id,
      email: result.admin.email,
      name: result.admin.name,
      type: 'admin',
    })

    await logAudit(result.admin.id, 'otp_login', 'admin', result.admin.id, `OTP login for ${email}`)

    const response = NextResponse.json({
      success: true,
      needsPasswordSetup: !!result.needsPasswordSetup,
      tempToken: sessionToken,
      token: sessionToken,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
        role: result.admin.role,
      },
      redirectUrl: result.needsPasswordSetup ? undefined : '/admin/dashboard'
    })

    response.headers.set('Set-Cookie', createSessionCookie(sessionToken))

    return response
  } catch (error) {
    console.error('Admin OTP verify error:', error)
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}
