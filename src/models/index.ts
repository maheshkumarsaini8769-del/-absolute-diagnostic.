import mongoose, { Schema, Document, Model } from 'mongoose'

// ═══════════════════════════════════════
// ADMIN ROLES
// ═══════════════════════════════════════
export const ADMIN_ROLES = {
  MASTER_ADMIN: 'master_admin',
  LAB_MANAGER: 'lab_manager',
  COLLECTION_CENTER: 'collection_center',
  TECHNICIAN: 'technician',
  PATHOLOGIST: 'pathologist',
  PHLEBOTOMIST: 'phlebotomist',
  DOCTOR: 'doctor',
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
    'inventory:read', 'inventory:write', 'equipment:read', 'equipment:write',
    'qc:read', 'qc:write', 'doctors:read', 'doctors:write',
    'corporate:read', 'corporate:write', 'billing:read', 'billing:write',
    'worklist:read', 'worklist:write',
  ],
  [ADMIN_ROLES.LAB_MANAGER]: [
    'bookings:read', 'bookings:write',
    'patients:read', 'patients:write', 'reports:read', 'reports:write', 'reports:approve',
    'tests:read', 'tests:write', 'samples:read', 'samples:write',
    'payments:read', 'payments:write', 'analytics:read',
    'inventory:read', 'inventory:write', 'equipment:read', 'equipment:write',
    'qc:read', 'qc:write', 'billing:read', 'worklist:read', 'worklist:write',
  ],
  [ADMIN_ROLES.COLLECTION_CENTER]: [
    'bookings:read', 'patients:read', 'reports:read',
    'samples:read', 'samples:write',
  ],
  [ADMIN_ROLES.TECHNICIAN]: [
    'bookings:read', 'patients:read', 'reports:read', 'reports:write',
    'samples:read', 'samples:write', 'worklist:read', 'worklist:write',
    'inventory:read', 'equipment:read', 'qc:read', 'qc:write',
  ],
  [ADMIN_ROLES.PATHOLOGIST]: [
    'bookings:read', 'patients:read', 'reports:read', 'reports:write', 'reports:approve',
    'samples:read', 'worklist:read', 'worklist:write', 'qc:read',
  ],
  [ADMIN_ROLES.PHLEBOTOMIST]: [
    'bookings:read', 'patients:read', 'samples:read', 'samples:write',
  ],
  [ADMIN_ROLES.DOCTOR]: [
    'patients:read', 'reports:read', 'doctors:read',
  ],
  [ADMIN_ROLES.STAFF]: [
    'bookings:read', 'bookings:write', 'patients:read', 'patients:write',
    'billing:read', 'billing:write',
  ],
}

export function hasPermission(role: string, permission: string): boolean {
  if (role === 'master' || role === 'master_admin' || role === 'admin') return true
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
  passwordHash?: string
  patientIdUHID?: string
  isPasswordTemporary?: boolean
  temporaryPasswordExpiresAt?: Date
  passwordResetRequired?: boolean
  isAccountDisabled?: boolean
  failedLoginAttempts?: number
  lockoutUntil?: Date
  lastPasswordChangeAt?: Date
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
  passwordHash: { type: String },
  patientIdUHID: { type: String },
  isPasswordTemporary: { type: Boolean, default: false },
  temporaryPasswordExpiresAt: { type: Date },
  passwordResetRequired: { type: Boolean, default: false },
  isAccountDisabled: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  lastPasswordChangeAt: { type: Date },
}, { timestamps: true })

PatientSchema.index({ phone: 1 })
PatientSchema.index({ patientIdUHID: 1 })

if (mongoose.models.Patient) delete mongoose.models.Patient
export const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema)

// ═══════════════════════════════════════
// PATIENT PASSWORD RESET TOKEN
// ═══════════════════════════════════════
export interface IPatientPasswordResetToken extends Document {
  _id: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  token: string
  phone: string
  verificationMethod: 'truecaller' | 'admin_assisted'
  isUsed: boolean
  expiresAt: Date
  createdAt: Date
}

const PatientPasswordResetTokenSchema = new Schema<IPatientPasswordResetToken>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  token: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  verificationMethod: { type: String, enum: ['truecaller', 'admin_assisted'], default: 'truecaller' },
  isUsed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

PatientPasswordResetTokenSchema.index({ patientId: 1 })
PatientPasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

if (mongoose.models.PatientPasswordResetToken) delete mongoose.models.PatientPasswordResetToken
export const PatientPasswordResetToken: Model<IPatientPasswordResetToken> =
  mongoose.models.PatientPasswordResetToken || mongoose.model<IPatientPasswordResetToken>('PatientPasswordResetToken', PatientPasswordResetTokenSchema)

// ═══════════════════════════════════════
// PATIENT RECOVERY REQUEST (Admin-assisted)
// ═══════════════════════════════════════
export interface IPatientRecoveryRequest extends Document {
  _id: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  phone: string
  name: string
  reason?: string
  status: 'pending' | 'resolved' | 'cancelled'
  adminNotes?: string
  resolvedBy?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PatientRecoveryRequestSchema = new Schema<IPatientRecoveryRequest>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  reason: { type: String },
  status: { type: String, enum: ['pending', 'resolved', 'cancelled'], default: 'pending' },
  adminNotes: { type: String },
  resolvedBy: { type: String },
  resolvedAt: { type: Date },
}, { timestamps: true })

PatientRecoveryRequestSchema.index({ patientId: 1 })
PatientRecoveryRequestSchema.index({ status: 1 })

if (mongoose.models.PatientRecoveryRequest) delete mongoose.models.PatientRecoveryRequest
export const PatientRecoveryRequest: Model<IPatientRecoveryRequest> =
  mongoose.models.PatientRecoveryRequest || mongoose.model<IPatientRecoveryRequest>('PatientRecoveryRequest', PatientRecoveryRequestSchema)

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

export interface IBookingTimelineEvent {
  stage: string
  timestamp: Date
  performedBy?: string
  note?: string
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
  reportId?: mongoose.Types.ObjectId
  timeline?: IBookingTimelineEvent[]
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

const BookingTimelineSchema = new Schema<IBookingTimelineEvent>({
  stage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  performedBy: { type: String },
  note: { type: String },
}, { _id: false })

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
  reportId: { type: Schema.Types.ObjectId, ref: 'Report' },
  timeline: [BookingTimelineSchema],
  items: [BookingItemSchema],
}, { timestamps: true })

BookingSchema.index({ patientId: 1 })
BookingSchema.index({ status: 1 })
BookingSchema.index({ source: 1 })

if (mongoose.models.Booking) delete mongoose.models.Booking
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
  verifiedBy?: string
  verifiedAt?: Date
  publishedAt?: Date
  notifiedAt?: Date
  branchId?: mongoose.Types.ObjectId
  source?: string
  fileHash?: string
  extractedName?: string
  extractedMobile?: string
  extractedAge?: number
  patientName?: string
  patientPhone?: string
  patientAge?: number
  patientGender?: string
  patientUHID?: string
  receivedDate?: Date
  sampleType?: string
  extractedGender?: string
  extractedPatientId?: string
  extractedTestName?: string
  rawExtractedText?: string
  matchConfidence?: string
  matchMethod?: string
  matchScore?: number
  matchedPatientId?: mongoose.Types.ObjectId
  collectionDate?: Date
  analysisData?: any
  isDeleted?: boolean
}

const ReportSchema = new Schema<IReport>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: false },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  patientName: { type: String },
  patientPhone: { type: String },
  patientAge: { type: Number },
  patientGender: { type: String },
  patientUHID: { type: String },
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
  verifiedBy: { type: String },
  verifiedAt: { type: Date },
  publishedAt: { type: Date },
  notifiedAt: { type: Date },
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
  receivedDate: { type: Date },
  sampleType: { type: String },
  analysisData: { type: Schema.Types.Mixed },
  isDeleted: { type: Boolean, default: false },
})

ReportSchema.index({ patientId: 1 })
ReportSchema.index({ bookingId: 1 })
ReportSchema.index({ fileHash: 1 })
ReportSchema.index({ status: 1 })
ReportSchema.index({ source: 1 })
ReportSchema.index({ isDeleted: 1 })

if (mongoose.models.Report) delete mongoose.models.Report
export const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema)

// ═══════════════════════════════════════
// REPORT FILE (PERSISTENT BINARY STORAGE)
// ═══════════════════════════════════════
export interface IReportFile extends Document {
  _id: mongoose.Types.ObjectId
  reportId: mongoose.Types.ObjectId
  fileName: string
  contentType: string
  data: Buffer
  size: number
  fileHash?: string
  createdAt: Date
  updatedAt: Date
}

const ReportFileSchema = new Schema<IReportFile>({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true, unique: true },
  fileName: { type: String, required: true },
  contentType: { type: String, default: 'application/pdf' },
  data: { type: Buffer, required: true },
  size: { type: Number, required: true },
  fileHash: { type: String },
}, { timestamps: true })

ReportFileSchema.index({ fileHash: 1 })

if (mongoose.models.ReportFile) delete mongoose.models.ReportFile
export const ReportFile: Model<IReportFile> = mongoose.models.ReportFile || mongoose.model<IReportFile>('ReportFile', ReportFileSchema)

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

// ═══════════════════════════════════════
// LAB WORKLIST & RESULT ENTRY
// ═══════════════════════════════════════
export interface ILabParameter {
  name: string
  value: string
  unit: string
  referenceRange: string
  isCritical: boolean
  flag: 'normal' | 'high' | 'low' | 'critical'
}

export interface ILabWorklist extends Document {
  _id: mongoose.Types.ObjectId
  sampleId: string
  bookingId?: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  patientName: string
  patientAge?: number
  patientGender?: string
  testName: string
  parameters: ILabParameter[]
  technicianName?: string
  technicianNotes?: string
  pathologistName?: string
  pathologistNotes?: string
  status: 'pending_entry' | 'results_entered' | 'verified' | 'rejected' | 'amended'
  criticalAlert: boolean
  amendmentHistory?: Array<{
    amendedAt: Date
    amendedBy: string
    reason: string
    previousParameters: any[]
  }>
  createdAt: Date
  updatedAt: Date
}

const LabWorklistSchema = new Schema<ILabWorklist>({
  sampleId: { type: String, required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  patientName: { type: String, required: true },
  patientAge: { type: Number },
  patientGender: { type: String },
  testName: { type: String, required: true },
  parameters: [{
    name: { type: String, required: true },
    value: { type: String, default: '' },
    unit: { type: String, default: '' },
    referenceRange: { type: String, default: '' },
    isCritical: { type: Boolean, default: false },
    flag: { type: String, enum: ['normal', 'high', 'low', 'critical'], default: 'normal' },
  }],
  technicianName: { type: String },
  technicianNotes: { type: String },
  pathologistName: { type: String },
  pathologistNotes: { type: String },
  status: { type: String, enum: ['pending_entry', 'results_entered', 'verified', 'rejected', 'amended'], default: 'pending_entry' },
  criticalAlert: { type: Boolean, default: false },
  amendmentHistory: [{
    amendedAt: { type: Date, default: Date.now },
    amendedBy: { type: String },
    reason: { type: String },
    previousParameters: [{ type: Schema.Types.Mixed }],
  }],
}, { timestamps: true })

LabWorklistSchema.index({ sampleId: 1 })
LabWorklistSchema.index({ status: 1 })
LabWorklistSchema.index({ criticalAlert: 1 })

export const LabWorklist: Model<ILabWorklist> = mongoose.models.LabWorklist || mongoose.model<ILabWorklist>('LabWorklist', LabWorklistSchema)

// ═══════════════════════════════════════
// INVENTORY ITEM
// ═══════════════════════════════════════
export interface IInventoryItem extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  category: 'reagent' | 'consumable' | 'vacutainer' | 'ppe' | 'rapid_kit'
  sku: string
  batchNumber?: string
  currentStock: number
  unit: string
  minThreshold: number
  expiryDate?: Date
  location?: string
  status: 'in_stock' | 'low_stock' | 'expired'
  costPerUnit?: number
  createdAt: Date
  updatedAt: Date
}

const InventoryItemSchema = new Schema<IInventoryItem>({
  name: { type: String, required: true },
  category: { type: String, enum: ['reagent', 'consumable', 'vacutainer', 'ppe', 'rapid_kit'], default: 'reagent' },
  sku: { type: String, required: true, unique: true },
  batchNumber: { type: String },
  currentStock: { type: Number, default: 0 },
  unit: { type: String, default: 'units' },
  minThreshold: { type: Number, default: 10 },
  expiryDate: { type: Date },
  location: { type: String, default: 'Main Lab Storage' },
  status: { type: String, enum: ['in_stock', 'low_stock', 'expired'], default: 'in_stock' },
  costPerUnit: { type: Number, default: 0 },
}, { timestamps: true })

InventoryItemSchema.index({ category: 1 })
InventoryItemSchema.index({ status: 1 })

export const InventoryItem: Model<IInventoryItem> = mongoose.models.InventoryItem || mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema)

// ═══════════════════════════════════════
// EQUIPMENT / ANALYZER
// ═══════════════════════════════════════
export interface IEquipmentLog {
  date: Date
  type: string
  performedBy: string
  notes?: string
}

export interface IEquipment extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  modelNumber?: string
  serialNumber?: string
  department: 'biochemistry' | 'hematology' | 'immunology' | 'microbiology' | 'general'
  status: 'operational' | 'calibration_due' | 'maintenance' | 'offline'
  lastCalibrationDate?: Date
  nextCalibrationDate?: Date
  serviceProvider?: string
  logs: IEquipmentLog[]
  createdAt: Date
  updatedAt: Date
}

const EquipmentSchema = new Schema<IEquipment>({
  name: { type: String, required: true },
  modelNumber: { type: String },
  serialNumber: { type: String },
  department: { type: String, enum: ['biochemistry', 'hematology', 'immunology', 'microbiology', 'general'], default: 'general' },
  status: { type: String, enum: ['operational', 'calibration_due', 'maintenance', 'offline'], default: 'operational' },
  lastCalibrationDate: { type: Date },
  nextCalibrationDate: { type: Date },
  serviceProvider: { type: String },
  logs: [{
    date: { type: Date, default: Date.now },
    type: { type: String, default: 'Routine Inspection' },
    performedBy: { type: String },
    notes: { type: String },
  }],
}, { timestamps: true })

export const Equipment: Model<IEquipment> = mongoose.models.Equipment || mongoose.model<IEquipment>('Equipment', EquipmentSchema)

// ═══════════════════════════════════════
// QUALITY CONTROL (QC)
// ═══════════════════════════════════════
export interface IQualityControl extends Document {
  _id: mongoose.Types.ObjectId
  equipmentName: string
  testName: string
  controlLevel: 'level_1_low' | 'level_2_normal' | 'level_3_high'
  lotNumber: string
  targetValue: number
  measuredValue: number
  unit: string
  sd: number
  status: 'pass' | 'warning' | 'fail'
  operatorName: string
  correctiveAction?: string
  runDate: Date
  createdAt: Date
}

const QualityControlSchema = new Schema<IQualityControl>({
  equipmentName: { type: String, required: true },
  testName: { type: String, required: true },
  controlLevel: { type: String, enum: ['level_1_low', 'level_2_normal', 'level_3_high'], default: 'level_2_normal' },
  lotNumber: { type: String, required: true },
  targetValue: { type: Number, required: true },
  measuredValue: { type: Number, required: true },
  unit: { type: String, default: '' },
  sd: { type: Number, default: 0 },
  status: { type: String, enum: ['pass', 'warning', 'fail'], default: 'pass' },
  operatorName: { type: String, required: true },
  correctiveAction: { type: String },
  runDate: { type: Date, default: Date.now },
}, { timestamps: true })

QualityControlSchema.index({ equipmentName: 1, runDate: -1 })

export const QualityControl: Model<IQualityControl> = mongoose.models.QualityControl || mongoose.model<IQualityControl>('QualityControl', QualityControlSchema)

// ═══════════════════════════════════════
// DOCTOR / REFERRAL
// ═══════════════════════════════════════
export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  specialization?: string
  clinicHospital?: string
  phone: string
  email?: string
  referralCode: string
  commissionPercent?: number
  status: 'active' | 'inactive'
  totalReferrals: number
  createdAt: Date
  updatedAt: Date
}

const DoctorSchema = new Schema<IDoctor>({
  name: { type: String, required: true },
  specialization: { type: String },
  clinicHospital: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  referralCode: { type: String, required: true, unique: true },
  commissionPercent: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  totalReferrals: { type: Number, default: 0 },
}, { timestamps: true })

export const Doctor: Model<IDoctor> = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema)

// ═══════════════════════════════════════
// CORPORATE / B2B ACCOUNT
// ═══════════════════════════════════════
export interface ICorporateAccount extends Document {
  _id: mongoose.Types.ObjectId
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address?: string
  gstNumber?: string
  employeeCount?: number
  contractStatus: 'active' | 'pending' | 'expired'
  packages: string[]
  createdAt: Date
  updatedAt: Date
}

const CorporateAccountSchema = new Schema<ICorporateAccount>({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  gstNumber: { type: String },
  employeeCount: { type: Number, default: 0 },
  contractStatus: { type: String, enum: ['active', 'pending', 'expired'], default: 'active' },
  packages: [{ type: String }],
}, { timestamps: true })

export const CorporateAccount: Model<ICorporateAccount> = mongoose.models.CorporateAccount || mongoose.model<ICorporateAccount>('CorporateAccount', CorporateAccountSchema)

// ═══════════════════════════════════════
// BILLING / INVOICE
// ═══════════════════════════════════════
export interface IBillingInvoice extends Document {
  _id: mongoose.Types.ObjectId
  invoiceNumber: string
  bookingId?: mongoose.Types.ObjectId
  bookingCode: string
  patientName: string
  patientPhone: string
  subtotal: number
  discount: number
  tax: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  paymentMethod: 'cash' | 'upi' | 'card' | 'netbanking'
  status: 'paid' | 'partial' | 'unpaid' | 'refunded'
  receiptDate: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const BillingInvoiceSchema = new Schema<IBillingInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  bookingCode: { type: String, required: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'netbanking'], default: 'cash' },
  status: { type: String, enum: ['paid', 'partial', 'unpaid', 'refunded'], default: 'paid' },
  receiptDate: { type: Date, default: Date.now },
  notes: { type: String },
}, { timestamps: true })

BillingInvoiceSchema.index({ bookingCode: 1 })
BillingInvoiceSchema.index({ status: 1 })

export const BillingInvoice: Model<IBillingInvoice> = mongoose.models.BillingInvoice || mongoose.model<IBillingInvoice>('BillingInvoice', BillingInvoiceSchema)

