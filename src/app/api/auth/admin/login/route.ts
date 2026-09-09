import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSessionToken, createSessionCookie } from '@/lib/zenuxs-auth'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Find admin in Admin collection
    let admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail }
    })

    // If admin not found, check if authorized admin exists
    if (!admin) {
      const authAdmin = await prisma.authorizedAdmin.findUnique({
        where: { email: normalizedEmail }
      })

      if (authAdmin && authAdmin.isActive) {
        return NextResponse.json({
          error: 'Password not set yet for this account. Please use "Login with OTP" to set your password for the first time.',
          needsOtp: true,
          email: normalizedEmail,
        }, { status: 400 })
      }

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { error: 'This admin account is disabled. Please contact support.' },
        { status: 403 }
      )
    }

    // 2. Check if admin has set password yet
    if (!admin.passwordHash || admin.passwordHash === 'otp-auth') {
      return NextResponse.json({
        error: 'Password has not been set yet. Please use "Login with OTP" to create your password.',
        needsOtp: true,
        email: normalizedEmail,
      }, { status: 400 })
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password.trim(), admin.passwordHash)
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 4. Generate Session Token
    const sessionToken = generateSessionToken({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      type: 'admin',
    })

    try {
      await logAudit(admin.id, 'password_login', 'admin', admin.id, `Admin password login for ${normalizedEmail}`)
    } catch {
      // Non-critical audit logging
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      redirectUrl: '/admin/dashboard',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }
    })

    response.headers.set('Set-Cookie', createSessionCookie(sessionToken))

    return response
  } catch (error: any) {
    console.error('Admin password login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
