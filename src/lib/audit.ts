import { prisma } from './prisma'

export async function logAudit(
  adminId: string,
  action: string,
  entity?: string,
  entityId?: string,
  details?: string,
  previousValue?: string,
  newValue?: string,
  ipAddress?: string
) {
  return prisma.auditLog.create({
    data: {
      adminId,
      action,
      entity: entity || null,
      entityId: entityId || null,
      details: details || null,
      previousValue: previousValue || null,
      newValue: newValue || null,
      ipAddress: ipAddress || null,
    }
  })
}
