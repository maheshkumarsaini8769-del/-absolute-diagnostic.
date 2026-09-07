import { requirePermission } from '@/lib/auth'
import { Sample, Booking } from '@/models'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'analytics:read')
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'
    const source = searchParams.get('source')
    const branchId = searchParams.get('branchId')

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'yesterday':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'today':
      default:
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
    }

    const dateFilter = { createdAt: { $gte: startDate } }
    const sourceFilter = source ? { source } : {}
    const combinedFilter = { ...dateFilter, ...sourceFilter }

    const [totalBookings, samplesCollected, samplesProcessing, reportsReady] = await Promise.all([
      Booking.countDocuments(combinedFilter),
      Sample.countDocuments({ ...combinedFilter, status: { $in: ['collected', 'received'] } }),
      Sample.countDocuments({ ...combinedFilter, status: { $in: ['processing', 'report_under_review'] } }),
      Sample.countDocuments({ ...combinedFilter, status: 'report_ready' }),
    ])

    const paymentResult = await Booking.aggregate([
      { $match: combinedFilter },
      { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, paidAmount: { $sum: '$paidAmount' }, discount: { $sum: '$discount' } } },
    ])
    const paymentSummary = paymentResult[0] || { totalAmount: 0, paidAmount: 0, discount: 0 }

    const statusBreakdown = await Sample.aggregate([
      { $match: sourceFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    const sourceBreakdown = await Sample.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ])

    return Response.json({
      period,
      startDate,
      totalBookings,
      samplesCollected,
      samplesProcessing,
      reportsReady,
      totalRevenue: paymentSummary.paidAmount,
      paymentSummary,
      statusBreakdown: statusBreakdown.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count
        return acc
      }, {}),
      sourceBreakdown: sourceBreakdown.map((s: any) => ({ source: s._id, count: s.count })),
    })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Analytics error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
