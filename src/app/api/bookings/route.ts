import { prisma } from '@/lib/prisma'
import { bookingSchema } from '@/lib/validators'
import { getSetting } from '@/lib/settings'
import { notifyAdminDevices } from '@/lib/notifications'
import { Sample, Coupon } from '@/models'
import { connectDB } from '@/lib/db/connect'

function generateBookingId(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `ADC-${dateStr}-${random}`
}

function generateSampleId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const seq = Math.floor(Math.random() * 999999).toString().padStart(7, '0')
  return `APC-${year}-${seq}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const data = parsed.data

    let patient = await prisma.patient.findFirst({
      where: { phone: data.patientPhone }
    })

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: data.patientName,
          phone: data.patientPhone,
          email: data.patientEmail || null,
          address: data.patientAddress || null
        }
      })
    } else {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          name: data.patientName,
          email: data.patientEmail || patient.email,
          address: data.patientAddress || patient.address
        }
      })
    }

    let homeCharge = 0
    let nightCharge = 0

    if (data.collectionType === 'home_collection') {
      const homeChargeStr = await getSetting('home_collection_charge')
      homeCharge = homeChargeStr ? parseFloat(homeChargeStr) : 0
    }

    if (data.isNightBooking) {
      const nightChargeStr = await getSetting('night_service_charge')
      nightCharge = nightChargeStr ? parseFloat(nightChargeStr) : 0
    }

    // Server-side Price Verification (per new.md Golden Rule: NEVER trust frontend prices)
    const verifiedItems: { testName: string; testPrice: number; testId?: string | null; packageId?: string | null }[] = []
    
    for (const item of data.items) {
      let authoritativePrice = item.testPrice
      let authoritativeName = item.testName

      if (item.testId) {
        const dbTest = await prisma.test.findUnique({ where: { id: item.testId } })
        if (dbTest) {
          authoritativePrice = dbTest.price
          authoritativeName = dbTest.name
        }
      } else if (item.packageId) {
        const dbPkg = await prisma.package.findUnique({ where: { id: item.packageId } })
        if (dbPkg) {
          authoritativePrice = dbPkg.price
          authoritativeName = dbPkg.name
        }
      } else {
        // Fallback check by name if id wasn't supplied
        const dbTestByName = await prisma.test.findFirst({ where: { name: { equals: item.testName, mode: 'insensitive' } } })
        if (dbTestByName) {
          authoritativePrice = dbTestByName.price
          authoritativeName = dbTestByName.name
        }
      }

      verifiedItems.push({
        testName: authoritativeName,
        testPrice: authoritativePrice,
        testId: item.testId || null,
        packageId: item.packageId || null
      })
    }

    const itemsTotal = verifiedItems.reduce((sum, item) => sum + item.testPrice, 0)
    
    // Server-side coupon verification if coupon provided
    let verifiedDiscount = 0
    if (data.couponCode) {
      await connectDB()
      const dbCoupon = await Coupon.findOne({
        code: data.couponCode.trim().toUpperCase(),
        isActive: true
      }).catch(() => null)

      if (dbCoupon) {
        const isNotExpired = !dbCoupon.expiresAt || new Date() <= new Date(dbCoupon.expiresAt)
        const meetsMin = !dbCoupon.minOrderValue || itemsTotal >= dbCoupon.minOrderValue
        if (isNotExpired && meetsMin) {
          if (dbCoupon.discountType === 'percent') {
            verifiedDiscount = Math.round((itemsTotal * dbCoupon.discountValue) / 100)
            if (dbCoupon.maxDiscount && verifiedDiscount > dbCoupon.maxDiscount) {
              verifiedDiscount = dbCoupon.maxDiscount
            }
          } else {
            verifiedDiscount = dbCoupon.discountValue
          }
        }
      }
    } else {
      verifiedDiscount = Math.min(data.couponDiscount || 0, itemsTotal)
    }

    const discount = Math.min(verifiedDiscount, itemsTotal)
    const totalAmount = Math.max(0, itemsTotal - discount + homeCharge + nightCharge)

    const bookingId = generateBookingId()
    const sampleId = generateSampleId()

    const booking = await prisma.booking.create({
      data: {
        bookingId,
        sampleId,
        patientId: patient.id,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail || null,
        patientAddress: data.patientAddress || null,
        collectionType: data.collectionType,
        preferredDate: data.preferredDate || null,
        preferredTime: data.preferredTime || null,
        totalAmount,
        discount,
        couponCode: data.couponCode || null,
        couponDiscount: discount,
        familyMemberName: data.familyMemberName || null,
        familyMemberRelation: data.familyMemberRelation || null,
        prescriptionUrl: data.prescriptionUrl || null,
        paidAmount: 0,
        paymentStatus: 'pending',
        source: (data as any).source || null,
        homeCharge,
        nightCharge,
        isNightBooking: data.isNightBooking || false,
        nightMessage: data.nightMessage || null,
        items: verifiedItems.map((item) => ({
          testName: item.testName,
          testPrice: item.testPrice,
          testId: item.testId || null,
          packageId: item.packageId || null
        }))
      },
      include: { items: true }
    })

    await Sample.create({
      sampleId,
      bookingId: booking._id || booking.id,
      patientId: patient._id || patient.id,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      source: (data as any).source || null,
      status: 'booked',
      tests: verifiedItems.map(item => item.testName),
    })

    const notification = await prisma.notification.create({
      data: {
        title: 'New Booking',
        message: `New booking ${bookingId} from ${data.patientName}`,
        type: 'booking',
        bookingId: booking.id
      }
    })

    try {
      const allAdmins = await prisma.admin.findMany({ where: { isActive: true } })
      for (const adm of allAdmins) {
        await notifyAdminDevices(adm.id, {
          title: data.isNightBooking ? 'New Night Booking' : 'New Booking',
          body: `${data.isNightBooking ? '🌙' : '🚨'} NEW ${data.isNightBooking ? 'NIGHT ' : ''}BOOKING\nBooking ID: ${bookingId}\nNew booking received.\nTap to view.`,
          url: `/admin/bookings`,
          tag: 'new-booking',
          priority: 'high'
        })
      }
    } catch {
      // Push notification failure is non-critical
    }

    return Response.json({ booking, notification }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
