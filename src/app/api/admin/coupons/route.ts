import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Coupon } from '@/models'
import { getAdminFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET: List all coupons
export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, coupons })
  } catch (error: any) {
    console.error('Get coupons error:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

// POST: Create coupon
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, expiresAt } = body

    if (!code || !discountValue) {
      return NextResponse.json({ error: 'Coupon code and discount value are required' }, { status: 400 })
    }

    const normalizedCode = code.trim().toUpperCase()

    const existing = await Coupon.findOne({ code: normalizedCode })
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      description: description?.trim() || '',
      discountType: discountType || 'percent',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: true,
      usageCount: 0,
    })

    return NextResponse.json({ success: true, coupon })
  } catch (error: any) {
    console.error('Create coupon error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 })
  }
}

// PATCH: Toggle active state or update
export async function PATCH(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { id, isActive, discountValue, minOrderValue, maxDiscount, expiresAt, description } = body

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 })
    }

    const updateData: any = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (discountValue !== undefined) updateData.discountValue = Number(discountValue)
    if (minOrderValue !== undefined) updateData.minOrderValue = Number(minOrderValue)
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? Number(maxDiscount) : null
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (description !== undefined) updateData.description = description

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true })
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, coupon })
  } catch (error: any) {
    console.error('Update coupon error:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

// DELETE: Delete coupon
export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 })
    }

    await Coupon.findByIdAndDelete(id)
    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' })
  } catch (error: any) {
    console.error('Delete coupon error:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}
