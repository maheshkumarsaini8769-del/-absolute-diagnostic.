import { createOAuth, generateSessionToken, createSessionCookie } from '@/lib/zenuxs-auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accessToken, redirectUrl } = body

    if (!accessToken) {
      return Response.json({ error: 'Access token required' }, { status: 400 })
    }

    const oauth = createOAuth()

    oauth.importSession({ access_token: accessToken } as any)
    const userInfo = await oauth.getUserInfo()

    if (!userInfo.email) {
      return Response.json({ error: 'No email in user info' }, { status: 400 })
    }

    const normalizedEmail = userInfo.email.toLowerCase().trim()

    const authorizedAdmin = await prisma.authorizedAdmin.findUnique({
      where: { email: normalizedEmail }
    })

    if (!authorizedAdmin || !authorizedAdmin.isActive) {
      return Response.json({ error: 'Not authorized for admin access' }, { status: 403 })
    }

    let admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail }
    })

    if (!admin) {
      admin = await prisma.admin.create({
        data: {
          email: normalizedEmail,
          passwordHash: 'zenuxs-oauth',
          name: userInfo.name || authorizedAdmin.name || normalizedEmail.split('@')[0],
          role: 'admin',
        }
      })
    } else {
      if (!admin.isActive) {
        return Response.json({ error: 'Account disabled' }, { status: 403 })
      }
      if (userInfo.name && admin.name !== userInfo.name) {
        await prisma.admin.update({ where: { id: admin.id }, data: { name: userInfo.name } })
      }
    }

    const sessionToken = generateSessionToken({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      type: 'admin',
      zenuxsSub: userInfo.sub,
    })

    await logAudit(admin.id, 'zenuxs_oauth_login', 'admin', admin.id, `OAuth login (${normalizedEmail})`)

    const response = Response.json({ success: true, redirectUrl: redirectUrl || '/admin/dashboard' })
    response.headers.set('Set-Cookie', createSessionCookie(sessionToken))

    return response
  } catch (error) {
    console.error('Zenuxs session error:', error)
    return Response.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
