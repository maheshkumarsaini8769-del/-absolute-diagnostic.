import jwt from 'jsonwebtoken'
import ZenuxOAuth from 'zenuxs-oauth'

const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024-change-in-production'

export function createOAuth() {
  const clientId = process.env.ZENUXS_CLIENT_ID || process.env.NEXT_PUBLIC_ZENUXS_CLIENT_ID || '4874ff27aff3ed59'
  const clientSecret = process.env.ZENUXS_CLIENT_SECRET || '39a797e9ba21ade5f070d69acf04789a'
  return new ZenuxOAuth({
    clientId,
    clientSecret,
  } as any)
}

export function generateSessionToken(payload: Record<string, any>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifySessionToken(token: string): Record<string, any> | null {
  try {
    return jwt.verify(token, JWT_SECRET) as Record<string, any>
  } catch {
    return null
  }
}

export function createSessionCookie(token: string, maxAge: number = 7 * 24 * 60 * 60): string {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `session_token=${token}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${maxAge}`
}
