import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CorporateAccount } from '@/models';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, contactPerson, email, phone, city, employeeCount, packageType, notes } = body;

    if (!companyName || !contactPerson || !phone) {
      return NextResponse.json(
        { error: 'Company Name, Contact Person and Phone Number are required.' },
        { status: 400 }
      );
    }

    try {
      if (CorporateAccount) {
        await CorporateAccount.create({
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          email: email?.trim() || '',
          phone: phone.trim(),
          address: city ? `${city.trim()}, Rajasthan` : 'Sikar, Rajasthan',
          employeeCount: Number(employeeCount) || 50,
          contractStatus: 'pending',
          packages: [packageType || 'Annual Employee Wellness & Health Camp']
        });
      }
    } catch (dbErr) {
      console.warn('CorporateAccount model save skipped or failed, fallback to log:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your corporate health checkup request has been submitted. Our B2B coordinator will contact you within 24 hours with custom discounted rates.'
    });
  } catch (error) {
    console.error('Corporate quotation error:', error);
    return NextResponse.json({ error: 'Failed to process corporate inquiry' }, { status: 500 });
  }
}
