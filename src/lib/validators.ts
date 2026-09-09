import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional()
})

export const otpSendSchema = z.object({
  email: z.string().email()
})

export const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
})

export const patientOtpSchema = z.object({
  email: z.string().email(),
  type: z.enum(['booking', 'report']).optional()
})

export const testSchema = z.object({
  name: z.string(),
  slug: z.string(),
  categoryId: z.string(),
  price: z.number(),
  mrp: z.number().optional(),
  discount: z.number().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  reportTime: z.string().optional(),
  preparationInstructions: z.string().optional(),
  fastingRequired: z.boolean().optional(),
  homeCollection: z.boolean().optional(),
  nightAvailable: z.boolean().optional(),
  nightSurcharge: z.number().optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional()
})

export const packageSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  price: z.number(),
  mrp: z.number().optional(),
  discount: z.number().optional(),
  reportTime: z.string().optional(),
  preparationInstructions: z.string().optional(),
  homeCollection: z.boolean().optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  testIds: z.array(z.string()).optional()
})

export const bookingSchema = z.object({
  patientName: z.string(),
  patientPhone: z.string().min(10),
  patientEmail: z.string().email().optional(),
  patientAddress: z.string().optional(),
  collectionType: z.enum(['lab_visit', 'home_collection', 'night_request']),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  source: z.string().optional(),
  branchId: z.string().optional(),
  testIds: z.array(z.string()).optional(),
  packageIds: z.array(z.string()).optional(),
  items: z.array(z.object({
    testName: z.string(),
    testPrice: z.number(),
    testId: z.string().optional(),
    packageId: z.string().optional()
  })),
  isNightBooking: z.boolean().optional(),
  nightMessage: z.string().optional(),
  couponCode: z.string().optional(),
  couponDiscount: z.number().optional(),
  familyMemberName: z.string().optional(),
  familyMemberRelation: z.string().optional(),
  prescriptionUrl: z.string().optional()
})

export const serviceSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional()
})

export const branchSchema = z.object({
  name: z.string(),
  slug: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  mapUrl: z.string().optional(),
  openingHours: z.string().optional(),
  nightAvailable: z.boolean().optional(),
  homeCollectionAvailable: z.boolean().optional(),
  isActive: z.boolean().optional()
})

export const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional()
})

export const testimonialSchema = z.object({
  patientName: z.string(),
  content: z.string(),
  rating: z.number().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional()
})

export const blogSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.string().optional(),
  isActive: z.boolean().optional()
})

export const reportSchema = z.object({
  patientId: z.string(),
  bookingId: z.string().optional(),
  testName: z.string(),
  reportDate: z.string().optional(),
  fileUrl: z.string(),
  fileName: z.string(),
  status: z.string().optional()
})

export const settingSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.string().optional()
})
