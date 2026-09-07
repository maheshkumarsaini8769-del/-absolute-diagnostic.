/**
 * Prisma-compatible wrapper around Mongoose.
 * Provides a subset of the Prisma API that existing code uses,
 * backed by MongoDB via Mongoose.
 */
import { connectDB } from './db/connect'
import {
  Admin, AuthorizedAdmin,
  AdminSession, AdminDevice,
  Patient, TestCategory, Test, Package, PackageTest,
  Service, Branch, Booking, Report, ReportAccessLog,
  Media, Notification, WebsiteSetting, HomepageContent,
  FAQ, Testimonial, Blog, AuditLog, WalkInLoginAttempt,
  AdminOTP, PatientOTP, DevicePairingCode,
} from '@/models'
import type {
  IAdmin, IAuthorizedAdmin,
  IAdminSession, IAdminDevice,
  IPatient, ITestCategory, ITest, IPackage, IPackageTest,
  IService, IBranch, IBooking, IReport, IReportAccessLog,
  IMedia, INotification, IWebsiteSetting, IHomepageContent,
  IFAQ, ITestimonial, IBlog, IAuditLog, IWalkInLoginAttempt,
  IAdminOTP, IPatientOTP, IDevicePairingCode,
} from '@/models'
import mongoose from 'mongoose'

// Helper to deeply convert Mongoose doc to plain object with id field
function toPlain(doc: any) {
  if (!doc) return null
  const raw = doc.toObject ? doc.toObject() : doc
  const plain = JSON.parse(JSON.stringify(raw))
  if (plain._id) {
    plain.id = plain._id.toString()
    delete plain._id
  }
  delete plain.__v
  return plain
}

function toPlainArray(docs: any[]) {
  return docs.map(toPlain)
}

// ═══════════════════════════════════════
// PRISMA-LIKE CLIENT
// ═══════════════════════════════════════

class PrismaCompatClient {
  private _connected = false

  private async ensureConnected() {
    if (!this._connected) {
      await connectDB()
      this._connected = true
    }
  }

  get admin() { return this.createModelProxy(Admin) }
  get authorizedAdmin() { return this.createModelProxy(AuthorizedAdmin) }
  get adminSession() { return this.createModelProxy(AdminSession) }
  get adminDevice() { return this.createModelProxy(AdminDevice) }
  get patient() { return this.createModelProxy(Patient) }
  get testCategory() { return this.createModelProxy(TestCategory) }
  get test() { return this.createModelProxy(Test) }
  get package() { return this.createModelProxy(Package) }
  get packageTest() { return this.createModelProxy(PackageTest) }
  get service() { return this.createModelProxy(Service) }
  get branch() { return this.createModelProxy(Branch) }
  get booking() { return this.createModelProxy(Booking) }
  get report() { return this.createModelProxy(Report) }
  get reportAccessLog() { return this.createModelProxy(ReportAccessLog) }
  get media() { return this.createModelProxy(Media) }
  get notification() { return this.createModelProxy(Notification) }
  get websiteSetting() { return this.createModelProxy(WebsiteSetting) }
  get homepageContent() { return this.createModelProxy(HomepageContent) }
  get fAQ() { return this.createModelProxy(FAQ) }
  get testimonial() { return this.createModelProxy(Testimonial) }
  get blog() { return this.createModelProxy(Blog) }
  get auditLog() { return this.createModelProxy(AuditLog) }
  get walkInLoginAttempt() { return this.createModelProxy(WalkInLoginAttempt) }
  get adminOTP() { return this.createModelProxy(AdminOTP) }
  get patientOTP() { return this.createModelProxy(PatientOTP) }
  get devicePairingCode() { return this.createModelProxy(DevicePairingCode) }

  private createModelProxy(model: any) {
    return {
      findUnique: async (args: any) => this.findUnique(model, args),
      findFirst: async (args: any) => this.findFirst(model, args),
      findMany: async (args?: any) => this.findMany(model, args || {}),
      create: async (args: any) => this.create(model, args),
      createMany: async (args: any) => this.createMany(model, args),
      update: async (args: any) => this.update(model, args),
      updateMany: async (args: any) => this.updateMany(model, args),
      delete: async (args: any) => this.delete_(model, args),
      deleteMany: async (args: any) => this.deleteMany(model, args),
      count: async (args?: any) => this.count(model, args),
      upsert: async (args: any) => this.upsert(model, args),
      aggregate: async (args: any) => this.aggregate(model, args),
      groupBy: async (args: any) => this.groupBy(model, args),
    }
  }

  private async findUnique(model: any, args: any) {
    await this.ensureConnected()
    const where = args.where || {}
    const query: any = {}
    for (const [key, value] of Object.entries(where)) {
      if (key === 'id') query._id = value
      else if (key.endsWith('Id') && value && typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        query[key] = new mongoose.Types.ObjectId(value)
      } else query[key] = value
    }
    const doc = await model.findOne(query).lean()
    return toPlain(doc)
  }

  private async findFirst(model: any, args: any) {
    await this.ensureConnected()
    const where = this.buildQuery(args?.where)
    let q = model.findOne(where)
    if (args?.include) {
      q = this.applyIncludes(q, args.include, model)
      const doc = await q
      return toPlain(doc)
    }
    const doc = await q.lean()
    return toPlain(doc)
  }

  private async findMany(model: any, args: any) {
    await this.ensureConnected()
    const where = this.buildQuery(args?.where)
    let q = model.find(where)
    if (args?.include) {
      q = this.applyIncludes(q, args.include, model)
      if (args?.orderBy) q = this.applySort(q, args.orderBy)
      if (args?.skip) q = q.skip(args.skip)
      if (args?.take) q = q.limit(args.take)
      const docs = await q
      return toPlainArray(docs)
    }
    if (args?.orderBy) q = this.applySort(q, args.orderBy)
    if (args?.skip) q = q.skip(args.skip)
    if (args?.take) q = q.limit(args.take)
    const docs = await q.lean()
    return toPlainArray(docs)
  }

  private async create(model: any, args: any) {
    await this.ensureConnected()
    const doc = await model.create(args.data)
    return toPlain(doc)
  }

  private async createMany(model: any, args: any) {
    await this.ensureConnected()
    const dataArray = Array.isArray(args.data) ? args.data : [args.data]
    const docs = await model.insertMany(dataArray, { ordered: true })
    return { count: docs.length }
  }

  private async update(model: any, args: any) {
    await this.ensureConnected()
    const where = this.buildQuery(args.where)
    const doc = await model.findOneAndUpdate(where, { $set: args.data }, { new: true }).lean()
    return toPlain(doc)
  }

  private async updateMany(model: any, args: any) {
    await this.ensureConnected()
    const where = this.buildQuery(args.where)
    const result = await model.updateMany(where, { $set: args.data })
    return { count: result.modifiedCount }
  }

  private async delete_(model: any, args: any) {
    await this.ensureConnected()
    const where = this.buildQuery(args.where)
    const doc = await model.findOneAndDelete(where).lean()
    return toPlain(doc)
  }

  private async deleteMany(model: any, args?: any) {
    await this.ensureConnected()
    const where = args?.where ? this.buildQuery(args.where) : {}
    const result = await model.deleteMany(where)
    return { count: result.deletedCount }
  }

  private async count(model: any, args?: any) {
    await this.ensureConnected()
    const where = args?.where ? this.buildQuery(args.where) : {}
    return model.countDocuments(where)
  }

  private async upsert(model: any, args: any) {
    await this.ensureConnected()
    const where = this.buildQuery(args.where)
    const doc = await model.findOneAndUpdate(
      where,
      { $setOnInsert: args.create, $set: args.update },
      { new: true, upsert: true }
    ).lean()
    return toPlain(doc)
  }

  private async aggregate(model: any, args: any) {
    await this.ensureConnected()
    const pipeline: any[] = []
    if (args.where) pipeline.push({ $match: this.buildQuery(args.where) })
    if (args._count) pipeline.push({ $count: 'count' })
    const result = await model.aggregate(pipeline)
    return result[0] || { _count: 0 }
  }

  private async groupBy(model: any, args: any) {
    await this.ensureConnected()
    const groupBy = Array.isArray(args.by) ? args.by : [args.by]
    const pipeline: any[] = []
    if (args.where) pipeline.push({ $match: this.buildQuery(args.where) })
    const groupStage: any = { _id: {} }
    for (const field of groupBy) {
      groupStage._id[field] = `$${field}`
    }
    if (args._count) groupStage.count = { $sum: 1 }
    pipeline.push({ $group: groupStage })
    const results = await model.aggregate(pipeline)
    return results.map((r: any) => {
      const item: any = { ...r._id }
      if (r.count !== undefined) item._count = { [groupBy[0]]: r.count }
      return item
    })
  }

  private buildQuery(where: any): any {
    if (!where) return {}
    const query: any = {}
    for (const [key, value] of Object.entries(where)) {
      if (key === 'OR' && Array.isArray(value)) {
        query.$or = value.map((v: any) => this.buildQuery(v))
      } else if (key === 'AND' && Array.isArray(value)) {
        query.$and = value.map((v: any) => this.buildQuery(v))
      } else if (key === 'NOT' && Array.isArray(value)) {
        query.$nor = value.map((v: any) => this.buildQuery(v))
      } else if (key === 'contains' && typeof value === 'string') {
        // handled at parent level
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle operators like { gt: 5 }, { contains: 'x' }
        const ops: any = {}
        let isOp = false
        for (const [op, opVal] of Object.entries(value as any)) {
          if (['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin', 'contains', 'startsWith', 'endsWith'].includes(op)) {
            isOp = true
            if (op === 'contains') ops.$regex = new RegExp(opVal as string, 'i')
            else if (op === 'startsWith') ops.$regex = new RegExp(`^${opVal}`, 'i')
            else if (op === 'endsWith') ops.$regex = new RegExp(`${opVal}$`, 'i')
            else if (op === 'in') ops.$in = Array.isArray(opVal) ? opVal.map((v: string) => mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v) : [opVal]
            else if (op === 'nin') ops.$nin = Array.isArray(opVal) ? opVal.map((v: string) => mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v) : [opVal]
            else ops[`$${op}`] = opVal
          }
        }
        if (isOp) query[key] = ops
        else {
          // nested object or relation
          const nested = this.buildQuery(value as any)
          for (const [nk, nv] of Object.entries(nested)) {
            query[`${key}.${nk}`] = nv
          }
        }
      } else if (key === 'id') {
        query._id = value
      } else if (key.endsWith('Id') && typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        query[key] = new mongoose.Types.ObjectId(value)
      } else {
        query[key] = value
      }
    }
    return query
  }

  private resolvePopulatePath(key: string, model: any): string {
    const schema = model.schema
    if (schema.virtuals?.[key]) return key
    if (schema.path(key)) return key
    const camelId = key + 'Id'
    if (schema.path(camelId)) return camelId
    return key
  }

  private applyIncludes(q: any, include: any, model?: any): any {
    for (const [key, value] of Object.entries(include)) {
      const path = model ? this.resolvePopulatePath(key, model) : key
      if (value === true) {
        q = q.populate(path)
      } else if (typeof value === 'object') {
        const populateOptions: any = { path }
        if ((value as any).include) {
          populateOptions.populate = Object.entries((value as any).include).map(([k, v]) => {
            if (v === true) return k
            return { path: k, populate: typeof v === 'object' ? Object.keys(v as any).filter(vk => (v as any)[vk] === true) : [] }
          })
        }
        if ((value as any).where) {
          populateOptions.match = this.buildQuery((value as any).where)
        }
        if ((value as any).orderBy) {
          const sortField = Object.keys((value as any).orderBy)[0]
          const sortDir = (value as any).orderBy[sortField]
          populateOptions.options = { sort: { [sortField]: sortDir === 'asc' ? 1 : -1 } }
        }
        q = q.populate(populateOptions)
      }
    }
    return q
  }

  private applySort(q: any, orderBy: any): any {
    if (!orderBy) return q
    const sort: any = {}
    if (typeof orderBy === 'object' && !Array.isArray(orderBy)) {
      for (const [key, value] of Object.entries(orderBy)) {
        sort[key] = value === 'asc' ? 1 : -1
      }
    } else if (Array.isArray(orderBy)) {
      for (const item of orderBy) {
        for (const [key, value] of Object.entries(item)) {
          sort[key] = value === 'asc' ? 1 : -1
        }
      }
    }
    return q.sort(sort)
  }

  async $disconnect() {
    await mongoose.disconnect()
    this._connected = false
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaCompatClient }

export const prisma = globalForPrisma.prisma || new PrismaCompatClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
