import mongoose, { Schema, Document, Model } from 'mongoose'

// ═══════════════════════════════════════
// ADMIN ROLES
// ═══════════════════════════════════════
export const ADMIN_ROLES = {
  MASTER_ADMIN: 'master_admin',
  LAB_MANAGER: 'lab_manager',
  COLLECTION_CENTER: 'collection_center',
  TECHNICIAN: 'technician',
  STAFF: 'staff',
} as const

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES]

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ADMIN_ROLES.MASTER_ADMIN]: [
    'admin:manage', 'bookings:read', 'bookings:write', 'bookings:delete',
    'patients:read', 'patients:write', 'reports:read', 'reports:write', 'reports:approve',
    'tests:read', 'tests:write', 'packages:read', 'packages:write',
    'services:read', 'services:write', 'branches:read', 'branches:write',
    'faqs:read', 'faqs:write', 'blogs:read', 'blogs:write',
    'testimonials:read', 'testimonials:write', 'analytics:read',
    'audit:read', 'settings:write', 'cms:write', 'notifications:read',
    'samples:read', 'samples:write', 'payments:read', 'payments:write',
  ],
  [ADMIN_ROLES.LAB_MANAGER]: [
    'bookings:read', 'bookings:write',
    'patients:read', 'patients:write', 'reports:read', 'reports:write', 'reports:approve',
    'tests:read', 'tests:write', 'samples:read', 'samples:write',
    'payments:read', 'payments:write', 'analytics:read',
  ],
  [ADMIN_ROLES.COLLECTION_CENTER]: [
    'bookings:read', 'patients:read', 'reports:read',
    'samples:read', 'samples:write',
  ],
  [ADMIN_ROLES.TECHNICIAN]: [
    'bookings:read', 'patients:read', 'reports:read', 'reports:write',
    'samples:read', 'samples:write',
  ],
  [ADMIN_ROLES.STAFF]: [
    'bookings:read', 'bookings:write', 'patients:read', 'patients:write',
  ],
}

export function hasPermission(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  return perms.includes(permission)
}

// ═══════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════
export interface IAdmin extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  name: string
  role: string
  isMaster: boolean
  isActive: boolean
  source?: string
  zenuxsSub?: string
  createdAt: Date
  updatedAt: Date
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: 'Admin' },
  role: { type: String, default: ADMIN_ROLES.STAFF },
  isMaster: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  source: { type: String },
  zenuxsSub: { type: String },
}, { timestamps: true })

export const Admin: Model<IAdmin> = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema)

// ═══════════════════════════════════════
// AUTHORIZED ADMIN
// ═══════════════════════════════════════
export interface IAuthorizedAdmin extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  name?: string
  isActive: boolean
  addedBy?: string
  createdAt: Date
  updatedAt: Date
}

const AuthorizedAdminSchema = new Schema<IAuthorizedAdmin>({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  isActive: { type: Boolean, default: true },
  addedBy: { type: String },
}, { timestamps: true })

export const AuthorizedAdmin: Model<IAuthorizedAdmin> = mongoose.models.AuthorizedAdmin || mongoose.model<IAuthorizedAdmin>('AuthorizedAdmin', AuthorizedAdminSchema)

// ═══════════════════════════════════════
// ADMIN SESSION
// ═══════════════════════════════════════
export interface IAdminSession extends Document {
  _id: mongoose.Types.ObjectId
  adminId: mongoose.Types.ObjectId
  token: string
  deviceToken?: string
  expiresAt: Date
  isActive: boolean
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const AdminSessionSchema = new Schema<IAdminSession>({
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  token: { type: String, required: true, unique: true },
  deviceToken: { type: String },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

AdminSessionSchema.index({ token: 1 })
AdminSessionSchema.index({ adminId: 1, isActive: 1 })

export const AdminSession: Model<IAdminSession> = mongoose.models.AdminSession || mongoose.model<IAdminSession>('AdminSession', AdminSessionSchema)

// ═══════════════════════════════════════
// ADMIN DEVICE
// ═══════════════════════════════════════
export interface IAdminDevice extends Document {
  _id: mongoose.Types.ObjectId
  adminId: mongoose.Types.ObjectId
  deviceName: string
  deviceType?: string
  browser?: string
  fcmToken?: string
  endpoint?: string
  p256dh?: string
  auth?: string
  isActive: boolean
  isTrusted: boolean
  lastActive: Date
  createdAt: Date
}

const AdminDeviceSchema = new Schema<IAdminDevice>({
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  deviceName: { type: String, required: true },
  deviceType: { type: String },
  browser: { type: String },
  fcmToken: { type: String },
  endpoint: { type: String },
  p256dh: { type: String },
  auth: { type: String },
  isActive: { type: Boolean, default: true },
  isTrusted: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
}, { timestamps: { createdAt: true, updatedAt: false } })

AdminDeviceSchema.index({ adminId: 1, isActive: 1 })

export const AdminDevice: Model<IAdminDevice> = mongoose.models.AdminDevice || mongoose.model<IAdminDevice>('AdminDevice', AdminDeviceSchema)

// ═══════════════════════════════════════
// PATIENT
// ═══════════════════════════════════════
export interface IPatient extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  phone: string
  age?: number
  ageAtRegistration?: number
  gender?: string
  email?: string
  verifiedEmail?: string
  emailVerifiedAt?: Date
  address?: string
  source?: string
  zenuxsSub?: string
  createdAt: Date
  updatedAt: Date
}

const PatientSchema = new Schema<IPatient>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: Number },
  ageAtRegistration: { type: Number },
  gender: { type: String },
  email: { type: String },
  verifiedEmail: { type: String },
  emailVerifiedAt: { type: Date },
  address: { type: String },
  source: { type: String },
  zenuxsSub: { type: String },
}, { timestamps: true })

PatientSchema.index({ phone: 1 })

export const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema)

// ═══════════════════════════════════════
// TEST CATEGORY
// ═══════════════════════════════════════
export interface ITestCategory extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string
  displayOrder: number
  isActive: boolean
}

const TestCategorySchema = new Schema<ITestCategory>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
})

export const TestCategory: Model<ITestCategory> = mongoose.models.TestCategory || mongoose.model<ITestCategory>('TestCategory', TestCategorySchema)

// ═══════════════════════════════════════
// TEST
// ═══════════════════════════════════════
export interface ITest extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  categoryId: mongoose.Types.ObjectId
  shortDescription?: string
  description?: string
  price: number
  mrp?: number
  discount?: number
  reportTime?: string
  preparationInstructions?: string
  fastingRequired: boolean
  homeCollection: boolean
  nightAvailable: boolean
  nightSurcharge?: number
  imageUrl?: string
  isFeatured: boolean
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const TestSchema = new Schema<ITest>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'TestCategory', required: true },
  shortDescription: { type: String },
  description: { type: String },
  price: { type: Number, required: true },
  mrp: { type: Number },
  discount: { type: Number, default: 0 },
  reportTime: { type: String },
  preparationInstructions: { type: String },
  fastingRequired: { type: Boolean, default: false },
  homeCollection: { type: Boolean, default: true },
  nightAvailable: { type: Boolean, default: false },
  nightSurcharge: { type: Number, default: 0 },
  imageUrl: { type: String },
  isFeatured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

TestSchema.virtual('category', {
  ref: 'TestCategory',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
})

TestSchema.index({ slug: 1 })
TestSchema.index({ categoryId: 1, isActive: 1 })

if (mongoose.models.Test) delete mongoose.models.Test
export const Test: Model<ITest> = mongoose.model<ITest>('Test', TestSchema)

// ═══════════════════════════════════════
// PACKAGE
// ═══════════════════════════════════════
export interface IPackage extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string
  price: number
  mrp?: number
  discount?: number
  reportTime?: string
  preparationInstructions?: string
  homeCollection: boolean
  imageUrl?: string
  isFeatured: boolean
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PackageSchema = new Schema<IPackage>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  mrp: { type: Number },
  discount: { type: Number, default: 0 },
  reportTime: { type: String },
  preparationInstructions: { type: String },
  homeCollection: { type: Boolean, default: true },
  imageUrl: { type: String },
  isFeatured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

PackageSchema.virtual('packageTests', {
  ref: 'PackageTest',
  localField: '_id',
  foreignField: 'packageId'
})

if (mongoose.models.Package) delete mongoose.models.Package
export const Package: Model<IPackage> = mongoose.model<IPackage>('Package', PackageSchema)

// ═══════════════════════════════════════
// PACKAGE TEST (junction)
// ═══════════════════════════════════════
export interface IPackageTest extends Document {
  _id: mongoose.Types.ObjectId
  packageId: mongoose.Types.ObjectId
  testId: mongoose.Types.ObjectId
}

const PackageTestSchema = new Schema<IPackageTest>({
  packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } })

PackageTestSchema.virtual('test', {
  ref: 'Test',
  localField: 'testId',
  foreignField: '_id',
  justOne: true
})

PackageTestSchema.virtual('package', {
  ref: 'Package',
  localField: 'packageId',
  foreignField: '_id',
  justOne: true
})

PackageTestSchema.index({ packageId: 1, testId: 1 }, { unique: true })

if (mongoose.models.PackageTest) delete mongoose.models.PackageTest
export const PackageTest: Model<IPackageTest> = mongoose.model<IPackageTest>('PackageTest', PackageTestSchema)

// ═══════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════
export interface IService extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  slug: string
  description?: string
  icon?: string
  imageUrl?: string
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ServiceSchema = new Schema<IService>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String },
  imageUrl: { type: String },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export const Service: Model<IService> = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema)

// ═══════════════════════════════════════
// BRANCH
// ═══════════════════════════════════════
export interface IBranch extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  address?: string
  city?: string
  phone?: string
  whatsapp?: string
  mapUrl?: string
  openingHours?: string
  nightAvailable: boolean
  homeCollectionAvailable: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const BranchSchema = new Schema<IBranch>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  address: { type: String },
  city: { type: String },
  phone: { type: String },
  whatsapp: { type: String },
  mapUrl: { type: String },
  openingHours: { type: String },
  nightAvailable: { type: Boolean, default: false },
  homeCollectionAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export const Branch: Model<IBranch> = mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema)

// ═══════════════════════════════════════
// BOOKING
// ═══════════════════════════════════════
export interface IBookingItem {
  _id?: mongoose.Types.ObjectId
  testId?: mongoose.Types.ObjectId
  packageId?: mongoose.Types.ObjectId
  testName: string
  testPrice: number
}

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId
  bookingId: string
  sampleId?: string
  patientId: mongoose.Types.ObjectId
  patientName: string
  patientPhone: string
  patientEmail?: string
  patientAddress?: string
  collectionType: string
  preferredDate?: string
  preferredTime?: string
  status: string
  source?: string
  branchId?: mongoose.Types.ObjectId
  totalAmount: number
  discount: number
  paidAmount: number
  paymentStatus: string
  paymentMethod?: string
  homeCharge: number
  nightCharge: number
  isNightBooking: boolean
  nightMessage?: string
  notes?: string
  items: IBookingItem[]
  createdAt: Date
  updatedAt: Date
}

const BookingItemSchema = new Schema<IBookingItem>({
  testId: { type: Schema.Types.ObjectId, ref: 'Test' },
  packageId: { type: Schema.Types.ObjectId, ref: 'Package' },
  testName: { type: String, required: true },
  testPrice: { type: Number, required: true },
}, { _id: true })

const BookingSchema = new Schema<IBooking>({
  bookingId: { type: String, required: true, unique: true },
  sampleId: { type: String, unique: true, sparse: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientEmail: { type: String },
  patientAddress: { type: String },
  collectionType: { type: String, default: 'lab_visit' },
  preferredDate: { type: String },
  preferredTime: { type: String },
  status: { type: String, default: 'requested' },
  source: { type: String },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  totalAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'pending' },
  paymentMethod: { type: String },
  homeCharge: { type: Number, default: 0 },
  nightCharge: { type: Number, default: 0 },
  isNightBooking: { type: Boolean, default: false },
  nightMessage: { type: String },
  notes: { type: String },
  items: [BookingItemSchema],
}, { timestamps: true })

BookingSchema.index({ patientId: 1 })
BookingSchema.index({ bookingId: 1 })
BookingSchema.index({ sampleId: 1 })
BookingSchema.index({ status: 1 })
BookingSchema.index({ source: 1 })

export const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema)

// ═══════════════════════════════════════
// REPORT
// ═══════════════════════════════════════
export interface IReport extends Document {
  _id: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  bookingId?: mongoose.Types.ObjectId
  testName: string
  reportDate: Date
  fileUrl: string
  fileName: string
  status: string
  uploadedAt: Date
  uploadedBy?: string
  reviewedBy?: string
  approvedBy?: string
  approvedAt?: Date
  rejectedAt?: Date
  rejectReason?: string
  branchId?: mongoose.Types.ObjectId
  source?: string
  fileHash?: string
  extractedName?: string
  extractedMobile?: string
  extractedAge?: number
  extractedGender?: string
  extractedPatientId?: string
  extractedTestName?: string
  rawExtractedText?: string
  matchConfidence?: string
  matchMethod?: string
  matchScore?: number
  matchedPatientId?: mongoose.Types.ObjectId
  collectionDate?: Date
}

const ReportSchema = new Schema<IReport>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: false },
  bookingId: { type: Schema.Types.ObjectId },
  testName: { type: String, required: true },
  reportDate: { type: Date, default: Date.now },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  status: { type: String, default: 'uploaded' },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String },
  reviewedBy: { type: String },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectReason: { type: String },
  branchId: { type: Schema.Types.ObjectId },
  source: { type: String },
  fileHash: { type: String },
  extractedName: { type: String },
  extractedMobile: { type: String },
  extractedAge: { type: Number },
  extractedGender: { type: String },
  extractedPatientId: { type: String },
  extractedTestName: { type: String },
  rawExtractedText: { type: String },
  matchConfidence: { type: String },
  matchMethod: { type: String },
  matchScore: { type: Number },
  matchedPatientId: { type: Schema.Types.ObjectId },
  collectionDate: { type: Date },
})

ReportSchema.index({ patientId: 1 })
ReportSchema.index({ fileHash: 1 })
ReportSchema.index({ status: 1 })
ReportSchema.index({ source: 1 })

export const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema)

// ═══════════════════════════════════════
// REPORT ACCESS LOG
// ═══════════════════════════════════════
export interface IReportAccessLog extends Document {
  _id: mongoose.Types.ObjectId
  reportId: mongoose.Types.ObjectId
  patientId?: string
  patientEmail?: string
  verificationMethod?: string
  success: boolean
  ipAddress?: string
  userAgent?: string
  accessedAt: Date
}

const ReportAccessLogSchema = new Schema<IReportAccessLog>({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  patientId: { type: String },
  patientEmail: { type: String },
  verificationMethod: { type: String },
  success: { type: Boolean, default: false },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

ReportAccessLogSchema.index({ reportId: 1 })

export const ReportAccessLog: Model<IReportAccessLog> = mongoose.models.ReportAccessLog || mongoose.model<IReportAccessLog>('ReportAccessLog', ReportAccessLogSchema)

// ═══════════════════════════════════════
// MEDIA
// ═══════════════════════════════════════
export interface IMedia extends Document {
  _id: mongoose.Types.ObjectId
  filename: string
  originalName: string
  altText?: string
  category: string
  filePath: string
  fileSize?: number
  mimeType?: string
  isActive: boolean
  createdAt: Date
}

const MediaSchema = new Schema<IMedia>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  altText: { type: String },
  category: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

export const Media: Model<IMedia> = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema)

// ═══════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════
export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  message: string
  type: string
  isRead: boolean
  bookingId?: string
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  bookingId: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)

// ═══════════════════════════════════════
// WEBSITE SETTING
// ═══════════════════════════════════════
export interface IWebsiteSetting extends Document {
  _id: mongoose.Types.ObjectId
  key: string
  value: string
  type: string
}

const WebsiteSettingSchema = new Schema<IWebsiteSetting>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  type: { type: String, default: 'text' },
})

export const WebsiteSetting: Model<IWebsiteSetting> = mongoose.models.WebsiteSetting || mongoose.model<IWebsiteSetting>('WebsiteSetting', WebsiteSettingSchema)

// ═══════════════════════════════════════
// HOMEPAGE CONTENT
// ═══════════════════════════════════════
export interface IHomepageContent extends Document {
  _id: mongoose.Types.ObjectId
  key: string
  value: string
  type: string
}

const HomepageContentSchema = new Schema<IHomepageContent>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  type: { type: String, default: 'text' },
})

export const HomepageContent: Model<IHomepageContent> = mongoose.models.HomepageContent || mongoose.model<IHomepageContent>('HomepageContent', HomepageContentSchema)

// ═══════════════════════════════════════
// FAQ
// ═══════════════════════════════════════
export interface IFAQ extends Document {
  _id: mongoose.Types.ObjectId
  question: string
  answer: string
  displayOrder: number
  isActive: boolean
  createdAt: Date
}

const FAQSchema = new Schema<IFAQ>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

export const FAQ: Model<IFAQ> = mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema)

// ═══════════════════════════════════════
// TESTIMONIAL
// ═══════════════════════════════════════
export interface ITestimonial extends Document {
  _id: mongoose.Types.ObjectId
  patientName: string
  content: string
  rating?: number
  isFeatured: boolean
  isActive: boolean
  createdAt: Date
}

const TestimonialSchema = new Schema<ITestimonial>({
  patientName: { type: String, required: true },
  content: { type: String, required: true },
  rating: { type: Number, default: 5 },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

export const Testimonial: Model<ITestimonial> = mongoose.models.Testimonial || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema)

// ═══════════════════════════════════════
// BLOG
// ═══════════════════════════════════════
export interface IBlog extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  slug: string
  excerpt?: string
  content?: string
  imageUrl?: string
  author?: string
  publishedAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const BlogSchema = new Schema<IBlog>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String },
  content: { type: String },
  imageUrl: { type: String },
  author: { type: String },
  publishedAt: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export const Blog: Model<IBlog> = mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema)

// ═══════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════
export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId
  adminId: mongoose.Types.ObjectId
  action: string
  entity?: string
  entityId?: string
  details?: string
  previousValue?: string
  newValue?: string
  ipAddress?: string
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  action: { type: String, required: true },
  entity: { type: String },
  entityId: { type: String },
  details: { type: String },
  previousValue: { type: String },
  newValue: { type: String },
  ipAddress: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

AuditLogSchema.index({ adminId: 1 })
AuditLogSchema.index({ entity: 1, entityId: 1 })
AuditLogSchema.index({ createdAt: -1 })

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

// ═══════════════════════════════════════
// WALK-IN LOGIN ATTEMPT
// ═══════════════════════════════════════
export interface IWalkInLoginAttempt extends Document {
  _id: mongoose.Types.ObjectId
  phone: string
  success: boolean
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const WalkInLoginAttemptSchema = new Schema<IWalkInLoginAttempt>({
  phone: { type: String, required: true },
  success: { type: Boolean, default: false },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

WalkInLoginAttemptSchema.index({ phone: 1, createdAt: -1 })

export const WalkInLoginAttempt: Model<IWalkInLoginAttempt> = mongoose.models.WalkInLoginAttempt || mongoose.model<IWalkInLoginAttempt>('WalkInLoginAttempt', WalkInLoginAttemptSchema)

// ═══════════════════════════════════════
// ADMIN OTP
// ═══════════════════════════════════════
export interface IAdminOTP extends Document {
  _id: mongoose.Types.ObjectId
  adminId?: mongoose.Types.ObjectId
  email: string
  otpHash: string
  expiresAt: Date
  attempts: number
  maxAttempts: number
  isUsed: boolean
  type: string
  createdAt: Date
}

const AdminOTPSchema = new Schema<IAdminOTP>({
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
  email: { type: String, required: true, lowercase: true, trim: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  isUsed: { type: Boolean, default: false },
  type: { type: String, default: 'login' },
}, { timestamps: { createdAt: true, updatedAt: false } })

AdminOTPSchema.index({ email: 1, createdAt: -1 })
AdminOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const AdminOTP: Model<IAdminOTP> = mongoose.models.AdminOTP || mongoose.model<IAdminOTP>('AdminOTP', AdminOTPSchema)

// ═══════════════════════════════════════
// PATIENT OTP
// ═══════════════════════════════════════
export interface IPatientOTP extends Document {
  _id: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  email: string
  otpHash: string
  expiresAt: Date
  attempts: number
  maxAttempts: number
  isUsed: boolean
  type: string
  bookingId?: string
  createdAt: Date
}

const PatientOTPSchema = new Schema<IPatientOTP>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  email: { type: String, required: true, lowercase: true, trim: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  isUsed: { type: Boolean, default: false },
  type: { type: String, default: 'booking' },
  bookingId: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

PatientOTPSchema.index({ email: 1, createdAt: -1 })
PatientOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const PatientOTP: Model<IPatientOTP> = mongoose.models.PatientOTP || mongoose.model<IPatientOTP>('PatientOTP', PatientOTPSchema)

// ═══════════════════════════════════════
// DEVICE PAIRING CODE
// ═══════════════════════════════════════
export interface IDevicePairingCode extends Document {
  _id: mongoose.Types.ObjectId
  code: string
  adminId: mongoose.Types.ObjectId
  expiresAt: Date
  isUsed: boolean
  createdAt: Date
}

const DevicePairingCodeSchema = new Schema<IDevicePairingCode>({
  code: { type: String, required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } })

DevicePairingCodeSchema.index({ code: 1 })
DevicePairingCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const DevicePairingCode: Model<IDevicePairingCode> = mongoose.models.DevicePairingCode || mongoose.model<IDevicePairingCode>('DevicePairingCode', DevicePairingCodeSchema)

// ═══════════════════════════════════════
// SAMPLE (tracking)
// ═══════════════════════════════════════
export interface ISample extends Document {
  _id: mongoose.Types.ObjectId
  sampleId: string
  bookingId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  patientName: string
  patientPhone: string
  source?: string
  branchId?: mongoose.Types.ObjectId
  status: string
  barcode?: string
  tests: string[]
  collectedAt?: Date
  receivedAt?: Date
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const SampleSchema = new Schema<ISample>({
  sampleId: { type: String, required: true, unique: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  source: { type: String },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  status: { type: String, default: 'booked' },
  barcode: { type: String },
  tests: [{ type: String }],
  collectedAt: { type: Date },
  receivedAt: { type: Date },
  processedAt: { type: Date },
}, { timestamps: true })

SampleSchema.index({ sampleId: 1 })
SampleSchema.index({ bookingId: 1 })
SampleSchema.index({ patientId: 1 })
SampleSchema.index({ status: 1 })
SampleSchema.index({ source: 1 })

export const Sample: Model<ISample> = mongoose.models.Sample || mongoose.model<ISample>('Sample', SampleSchema)

// ═══════════════════════════════════════
// SAMPLE STATUS HISTORY
// ═══════════════════════════════════════
export interface ISampleStatusHistory extends Document {
  _id: mongoose.Types.ObjectId
  sampleId: mongoose.Types.ObjectId
  oldStatus: string
  newStatus: string
  changedBy: mongoose.Types.ObjectId
  changedByName: string
  notes?: string
  createdAt: Date
}

const SampleStatusHistorySchema = new Schema<ISampleStatusHistory>({
  sampleId: { type: Schema.Types.ObjectId, ref: 'Sample', required: true },
  oldStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  changedByName: { type: String, required: true },
  notes: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

SampleStatusHistorySchema.index({ sampleId: 1, createdAt: -1 })

export const SampleStatusHistory: Model<ISampleStatusHistory> = mongoose.models.SampleStatusHistory || mongoose.model<ISampleStatusHistory>('SampleStatusHistory', SampleStatusHistorySchema)
