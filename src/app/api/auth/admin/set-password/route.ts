import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSessionToken, createSessionCookie, verifySessionToken } from '@/lib/zenuxs-auth'
import { getAdminFromRequest } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword, tempToken } = body

    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Email, password, and confirm password are required' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Password Policy Check
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain both letters and numbers' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Authorization verification
    let isAuthorized = false

    // Method A: Existing session cookie
    const currentAdmin = await getAdminFromRequest(request)
    if (currentAdmin && currentAdmin.email.toLowerCase().trim() === normalizedEmail) {
      isAuthorized = true
    }

    // Method B: Valid tempToken from OTP verification
    if (!isAuthorized && tempToken) {
      const decoded = verifySessionToken(tempToken)
      if (decoded && (decoded.email?.toLowerCase().trim() === normalizedEmail || decoded.adminId)) {
        isAuthorized = true
      }
    }

    // Method C: Verified OTP in last 15 minutes for this email
    if (!isAuthorized) {
      const recentVerifiedOTP = await prisma.adminOTP.findFirst({
        where: {
          email: normalizedEmail,
          isUsed: true,
          updatedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }
        },
        orderBy: { updatedAt: 'desc' }
      })
      if (recentVerifiedOTP) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Please verify your OTP before creating a password.' },
        { status: 401 }
      )
    }

    // Find or create admin
    let admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail }
    })

    const passwordHash = await bcrypt.hash(password.trim(), 12)

    if (!admin) {
      const authAdmin = await prisma.authorizedAdmin.findUnique({
        where: { email: normalizedEmail }
      })
      admin = await prisma.admin.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: authAdmin?.name || normalizedEmail.split('@')[0],
          role: 'master_admin',
          isMaster: true,
          isActive: true,
        }
      })
    } else {
      admin = await prisma.admin.update({
        where: { id: admin.id },
        data: {
          passwordHash,
          isActive: true,
        }
      })
    }

    // Generate authenticated session token
    const sessionToken = generateSessionToken({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      type: 'admin',
    })

    try {
      await logAudit(admin.id, 'password_created', 'admin', admin.id, `New admin password set for ${normalizedEmail}`)
    } catch {
      // Non-critical audit logging
    }

    const response = NextResponse.json({
      success: true,
      message: 'Password created successfully! You can now log in with this password anytime.',
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
    console.error('Set admin password error:', error)
    return NextResponse.json(
      { error: 'Failed to set password. Please try again.' },
      { status: 500 }
    )
  }
}
