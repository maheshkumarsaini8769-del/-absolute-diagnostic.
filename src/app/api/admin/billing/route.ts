import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { BillingInvoice, Booking } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'billing:read')
    let invoices = await BillingInvoice.find().sort({ receiptDate: -1 }).limit(100).lean()

    // Auto-generate invoices from existing bookings if empty
    if (invoices.length === 0) {
      const bookings = await Booking.find().limit(10).lean()
      if (bookings.length > 0) {
        const seedInvoices = bookings.map((b: any, idx: number) => ({
          invoiceNumber: `INV-${new Date().getFullYear()}-${(1001 + idx).toString()}`,
          bookingId: b._id,
          bookingCode: b.bookingId || `BK-${1000 + idx}`,
          patientName: b.patientName,
          patientPhone: b.patientPhone,
          subtotal: b.totalAmount || 1200,
          discount: b.discount || 0,
          tax: 0,
          totalAmount: b.totalAmount || 1200,
          paidAmount: b.totalAmount || 1200,
          balanceDue: 0,
          paymentMethod: (['upi', 'cash', 'card'] as const)[idx % 3],
          status: 'paid',
          receiptDate: b.createdAt || new Date(),
        }))
        await BillingInvoice.insertMany(seedInvoices)
        invoices = await BillingInvoice.find().sort({ receiptDate: -1 }).limit(100).lean()
      }
    }

    const totalBilled = invoices.reduce((acc: number, inv: any) => acc + (inv.totalAmount || 0), 0)
    const totalPaid = invoices.reduce((acc: number, inv: any) => acc + (inv.paidAmount || 0), 0)
    const totalBalance = invoices.reduce((acc: number, inv: any) => acc + (inv.balanceDue || 0), 0)

    return NextResponse.json({
      invoices,
      totalBilled,
      totalPaid,
      totalBalance,
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List billing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'billing:write')
    const body = await request.json()
    const { patientName, patientPhone, bookingCode, subtotal, discount, tax, paymentMethod, paidAmount } = body

    if (!patientName || !patientPhone || !subtotal) {
      return NextResponse.json({ error: 'Patient name, phone, and subtotal are required' }, { status: 400 })
    }

    const numSub = Number(subtotal) || 0
    const numDisc = Number(discount) || 0
    const numTax = Number(tax) || 0
    const total = numSub - numDisc + numTax
    const paid = Number(paidAmount) || total
    const balance = Math.max(0, total - paid)
    const status = balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'

    const count = await BillingInvoice.countDocuments()
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1001).toString()}`

    const invoice = await BillingInvoice.create({
      invoiceNumber,
      bookingCode: bookingCode || `WALK-IN-${Math.floor(Math.random() * 90000 + 10000)}`,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      subtotal: numSub,
      discount: numDisc,
      tax: numTax,
      totalAmount: total,
      paidAmount: paid,
      balanceDue: balance,
      paymentMethod: paymentMethod || 'cash',
      status,
      receiptDate: new Date(),
    })

    return NextResponse.json({ success: true, invoice }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Create invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
