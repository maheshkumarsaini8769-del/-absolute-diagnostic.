import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { hasPermission, AdminRole } from '@/models'

const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024'

export function generateToken(id: string, type: string = 'admin'): string {
  return jwt.sign({ [`${type}Id`]: id, type }, JWT_SECRET, { expiresIn: '7d' })
}

export function generateDeviceToken(adminId: string, deviceId: string): string {
  return jwt.sign({ adminId, deviceId, type: 'device' }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
  } catch {
    return null
  }
}

export async function getAdminFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  let token: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  if (!token) {
    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(/session_token=([^;]+)/)
      if (match) token = match[1]
    }
  }

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const adminId = payload.adminId
  if (!adminId) return null

  const admin = await prisma.admin.findUnique({ where: { id: adminId } })
  if (!admin || !admin.isActive) return null

  return admin
}

export async function requireAdmin(request: Request) {
  const admin = await getAdminFromRequest(request)
  if (!admin) {
    throw new Response('Unauthorized', { status: 401 })
  }
  return admin
}

export async function requirePermission(request: Request, permission: string) {
  const admin = await requireAdmin(request)
  if (admin.isMaster) return admin
  if (!hasPermission(admin.role, permission)) {
    throw new Response(JSON.stringify({ error: 'Forbidden', required: permission }), { status: 403 })
  }
  return admin
}

export async function requireRole(request: Request, ...roles: string[]) {
  const admin = await requireAdmin(request)
  if (admin.isMaster) return admin
  if (!roles.includes(admin.role)) {
    throw new Response(JSON.stringify({ error: 'Forbidden', requiredRoles: roles }), { status: 403 })
  }
  return admin
}

export async function getPatientFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  let token: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  if (!token) {
    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(/session_token=([^;]+)/)
      if (match) token = match[1]
    }
  }

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload || payload.type !== 'patient' || !payload.patientId) return null

  const patient = await prisma.patient.findUnique({ where: { id: payload.patientId } })
  if (!patient) return null

  return patient
}
