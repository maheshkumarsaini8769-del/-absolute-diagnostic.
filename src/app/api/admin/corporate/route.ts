import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { CorporateAccount } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requirePermission(request, 'corporate:read')
    let accounts = await CorporateAccount.find().sort({ createdAt: -1 }).lean()

    // Auto-seed sample corporate clients if none exist
    if (accounts.length === 0) {
      const seed = [
        {
          companyName: 'Infosys BPM Technologies',
          contactPerson: 'Sunil Rao (HR Director)',
          email: 'hr.wellness@infosys.com',
          phone: '+91 98110 22334',
          address: 'Electronic City, Phase 1, Bangalore',
          gstNumber: '29AAACI1234F1Z5',
          employeeCount: 450,
          contractStatus: 'active',
          packages: ['Executive Health Checkup', 'Annual Employee Wellness Panel'],
        },
        {
          companyName: 'Tata Steel Manufacturing Ltd',
          contactPerson: 'Meenakshi Iyer (EHS Manager)',
          email: 'safety.health@tatasteel.com',
          phone: '+91 98110 55667',
          address: 'Industrial Area, Mumbai',
          gstNumber: '27AAACT9876E1Z2',
          employeeCount: 1200,
          contractStatus: 'active',
          packages: ['Pre-employment Screening', 'Occupational Heavy Metal & Spirometry'],
        },
        {
          companyName: 'Wipro Digital Solutions',
          contactPerson: 'Karan Mehra (Benefits Lead)',
          email: 'wellness@wipro.com',
          phone: '+91 98110 77889',
          address: 'Cyber Gateway, Hyderabad',
          gstNumber: '36AAACW5544C1Z9',
          employeeCount: 320,
          contractStatus: 'active',
          packages: ['Comprehensive Full Body Checkup', 'Diabetes & Cardiac Risk Profile'],
        },
      ]
      await CorporateAccount.insertMany(seed)
      accounts = await CorporateAccount.find().sort({ createdAt: -1 }).lean()
    }

    return NextResponse.json({ accounts, total: accounts.length })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('List corporate accounts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, 'corporate:write')
    const body = await request.json()
    const { companyName, contactPerson, email, phone, address, gstNumber, employeeCount, packages } = body

    if (!companyName || !contactPerson || !phone) {
      return NextResponse.json({ error: 'Company name, contact person, and phone are required' }, { status: 400 })
    }

    const account = await CorporateAccount.create({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email || '',
      phone: phone.trim(),
      address,
      gstNumber,
      employeeCount: Number(employeeCount) || 50,
      contractStatus: 'active',
      packages: packages || ['Annual Employee Wellness Panel'],
    })

    return NextResponse.json({ success: true, account }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Create corporate account error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
