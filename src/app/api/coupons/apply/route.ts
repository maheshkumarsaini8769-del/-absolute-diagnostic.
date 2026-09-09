import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Coupon } from '@/models'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const { code, cartTotal } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Please enter a coupon code' }, { status: 400 })
    }

    const total = Number(cartTotal) || 0
    const normalizedCode = code.trim().toUpperCase()

    const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true })

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 404 })
    }

    // Check expiry
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return NextResponse.json({ error: 'This coupon code has expired' }, { status: 400 })
    }

    // Check minimum order value
    if (coupon.minOrderValue > 0 && total < coupon.minOrderValue) {
      return NextResponse.json({
        error: `Minimum booking value of ₹${coupon.minOrderValue} required for this coupon`
      }, { status: 400 })
    }

    // Calculate discount
    let discount = 0
    if (coupon.discountType === 'percent') {
      discount = Math.round((total * coupon.discountValue) / 100)
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount
      }
    } else {
      discount = coupon.discountValue
    }

    // Discount cannot exceed cart total
    if (discount > total) {
      discount = total
    }

    const finalTotal = Math.max(0, total - discount)

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount,
      finalTotal,
      message: `Coupon ${coupon.code} applied! You save ₹${discount}`
    })
  } catch (error: any) {
    console.error('Apply coupon error:', error)
    return NextResponse.json({ error: 'Failed to apply coupon' }, { status: 500 })
  }
}
