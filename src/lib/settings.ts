import { prisma } from './prisma'

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.websiteSetting.findUnique({ where: { key } })
  return setting?.value || null
}

export async function setSetting(key: string, value: string, type?: string) {
  return prisma.websiteSetting.upsert({
    where: { key },
    update: { value, type: type || 'text' },
    create: { key, value, type: type || 'text' }
  })
}

export async function getHomepageContent(key: string) {
  return prisma.homepageContent.findUnique({ where: { key } })
}

export async function setHomepageContent(key: string, value: string, type?: string) {
  return prisma.homepageContent.upsert({
    where: { key },
    update: { value, type: type || 'text' },
    create: { key, value, type: type || 'text' }
  })
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.websiteSetting.findMany({})
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>)
}

export async function getAllHomepageContent(): Promise<Record<string, string>> {
  const contents = await prisma.homepageContent.findMany({})
  return contents.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>)
}
