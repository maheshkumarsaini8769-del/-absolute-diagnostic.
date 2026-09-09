import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Booking, WebsiteSetting } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await context.params

    const booking = await Booking.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingId: id }]
    }).lean()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Get site settings
    const settings = await WebsiteSetting.find({
      key: { $in: ['site_name', 'primary_phone', 'primary_email', 'site_address', 'gst_number'] }
    }).lean()

    const settingsMap = new Map(settings.map(s => [s.key, s.value]))

    const invoiceNumber = `INV-${(booking.bookingId || 'ADC').replace('ADC-', '')}`
    const invoiceDate = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : new Date().toLocaleDateString('en-IN')

    const subtotal = booking.items?.reduce((sum: number, item: any) => sum + (item.testPrice || 0), 0) || booking.totalAmount || 0
    const discount = booking.discount || booking.couponDiscount || 0
    const homeCharge = booking.homeCharge || 0
    const nightCharge = booking.nightCharge || 0
    const totalAmount = booking.totalAmount || (subtotal - discount + homeCharge + nightCharge)

    const invoiceData = {
      invoiceNumber,
      invoiceDate,
      bookingId: booking.bookingId,
      sampleId: booking.sampleId || 'Pending',
      collectionType: booking.collectionType === 'home_collection' ? 'Home Collection' : 'Center Visit',
      status: booking.status,
      paymentStatus: booking.paymentStatus || 'pending',
      paymentMethod: booking.paymentMethod || 'Cash / Offline',
      clinic: {
        name: settingsMap.get('site_name') || 'Absolute Diagnostic',
        phone: settingsMap.get('primary_phone') || '+91 141 2345678',
        email: settingsMap.get('primary_email') || 'info@absolutediagnostic.com',
        address: settingsMap.get('site_address') || 'Main Diagnostic Center, Jaipur, Rajasthan',
        gstNumber: settingsMap.get('gst_number') || '08AABCA1234F1Z5',
      },
      patient: {
        name: booking.patientName,
        phone: booking.patientPhone,
        email: booking.patientEmail || '',
        address: booking.patientAddress || 'Jaipur',
        familyMember: booking.familyMemberName ? `${booking.familyMemberName} (${booking.familyMemberRelation || 'Relative'})` : undefined
      },
      items: booking.items || [],
      subtotal,
      discount,
      couponCode: booking.couponCode,
      homeCharge,
      nightCharge,
      totalAmount,
      paidAmount: booking.paidAmount || (booking.paymentStatus === 'paid' ? totalAmount : 0),
      balanceDue: Math.max(0, totalAmount - (booking.paidAmount || (booking.paymentStatus === 'paid' ? totalAmount : 0)))
    }

    return NextResponse.json({ success: true, invoice: invoiceData })
  } catch (error: any) {
    console.error('Invoice error:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
