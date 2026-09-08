import { NextResponse } from 'next/server'
import { getHomepageData } from '@/lib/homepage'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getHomepageData()
    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch homepage data' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Homepage data error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
