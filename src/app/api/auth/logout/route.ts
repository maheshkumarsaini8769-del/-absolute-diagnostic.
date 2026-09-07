import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (admin) {
      const cookieHeader = request.headers.get('Cookie')
      const match = cookieHeader?.match(/session_token=([^;]+)/)
      if (match) {
        await prisma.adminSession.deleteMany({
          where: { token: match[1] }
        }).catch(() => {})
      }
    }
  } catch {
    // Best effort session invalidation
  }

  const response = Response.json({ success: true })

  response.headers.set(
    'Set-Cookie',
    'session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  )

  return response
}
