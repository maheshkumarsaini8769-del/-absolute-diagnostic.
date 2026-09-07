import jwt from 'jsonwebtoken'
import ZenuxOAuth from 'zenuxs-oauth'

const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024'

export function createOAuth() {
  return new ZenuxOAuth({
    clientId: process.env.ZENUXS_CLIENT_ID!,
    clientSecret: process.env.ZENUXS_CLIENT_SECRET,
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
  return `session_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}
