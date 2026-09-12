import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('bookingId') || searchParams.get('phone') || '').trim();

    if (!query) {
      return NextResponse.json({ error: 'Please enter a Booking ID (e.g. ADC-...) or 10-digit Phone Number' }, { status: 400 });
    }

    const digitsOnly = query.replace(/\D/g, '');
    const hasLetters = /[a-zA-Z]/.test(query);
    const isPhone = !hasLetters && digitsOnly.length >= 10;
    const cleanPhone = isPhone ? digitsOnly.slice(-10) : '';

    const orConditions: any[] = [
      { bookingId: query },
      { bookingId: query.toUpperCase() },
      { sampleId: query },
      { sampleId: query.toUpperCase() }
    ];

    if (isPhone) {
      orConditions.push({ patientPhone: { contains: cleanPhone } });
      orConditions.push({ patient: { phone: { contains: cleanPhone } } });
    }

    if (/^[0-9a-fA-F]{24}$/.test(query)) {
      orConditions.push({ id: query });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        OR: orConditions
      },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ error: 'No active booking found for the provided details. Please check and try again.' }, { status: 404 });
    }

    const booking = bookings[0];

    const reportOrConditions: any[] = [];
    if (booking.id && /^[0-9a-fA-F]{24}$/.test(booking.id)) {
      reportOrConditions.push({ bookingId: booking.id });
    }
    if (booking.patientId && /^[0-9a-fA-F]{24}$/.test(booking.patientId)) {
      reportOrConditions.push({ patientId: booking.patientId });
    }
    if (cleanPhone) {
      reportOrConditions.push({ extractedMobile: { contains: cleanPhone } });
    }

    let report: any = null;
    if (reportOrConditions.length > 0) {
      try {
        report = await prisma.report.findFirst({
          where: {
            OR: reportOrConditions
          },
          select: {
            id: true,
            testName: true,
            status: true,
            reportDate: true,
            fileUrl: true,
            fileName: true
          },
          orderBy: { createdAt: 'desc' }
        });
      } catch (err) {
        console.warn('Report lookup error:', err);
      }
    }

    const rawStatus = (booking.status || 'requested').toLowerCase();
    
    let currentStep = 1;
    let stepTitle = 'Booking Confirmed';
    let stepDescription = 'Your booking is confirmed and scheduled.';

    if (rawStatus === 'cancelled') {
      currentStep = -1;
      stepTitle = 'Booking Cancelled';
      stepDescription = 'This booking was cancelled. Please contact lab support for assistance.';
    } else if (
      rawStatus === 'completed' ||
      rawStatus === 'patient_notified' ||
      rawStatus === 'notified' ||
      rawStatus === 'report_ready' ||
      rawStatus === 'ready' ||
      rawStatus === 'published' ||
      rawStatus === 'verified' ||
      rawStatus.includes('notif') ||
      rawStatus.includes('ready') ||
      report?.status === 'ready' ||
      report?.status === 'published' ||
      report?.status === 'verified' ||
      report?.status === 'uploaded'
    ) {
      currentStep = 5;
      if (rawStatus.includes('notif')) {
        stepTitle = 'Report Ready & Patient Notified';
        stepDescription = 'Your diagnostic report has been verified by our MD Pathologist and notification has been sent. Report is ready for download.';
      } else {
        stepTitle = 'Report Ready & MD Verified';
        stepDescription = 'Your diagnostic report has been verified by our MD Pathologist and is ready for download.';
      }
    } else if (
      rawStatus === 'sample_received' ||
      rawStatus === 'processing' ||
      rawStatus === 'under_review' ||
      rawStatus === 'report_pending' ||
      rawStatus.includes('lab') ||
      rawStatus.includes('test') ||
      rawStatus.includes('process') ||
      rawStatus.includes('review') ||
      rawStatus.includes('received')
    ) {
      currentStep = 4;
      stepTitle = 'In NABL Lab Testing';
      stepDescription = rawStatus.includes('received')
        ? 'Sample received at central lab. Barcode scanned & clinical testing in progress.'
        : rawStatus.includes('review')
        ? 'Sample testing completed. Clinical review by MD Pathologist in progress.'
        : 'Sample received at central lab. Barcode scanned & clinical testing in progress.';
    } else if (
      rawStatus === 'sample_collected' ||
      rawStatus === 'collected' ||
      rawStatus.includes('collect')
    ) {
      currentStep = 3;
      stepTitle = 'Sample Collected';
      stepDescription = 'Blood sample collected successfully and securely sealed in cold-chain transport.';
    } else if (
      rawStatus === 'phlebotomist_assigned' ||
      rawStatus === 'assigned' ||
      rawStatus === 'dispatched' ||
      rawStatus.includes('assign') ||
      rawStatus.includes('route') ||
      rawStatus.includes('dispatch') ||
      booking.assignedPhlebotomistName
    ) {
      currentStep = 2;
      stepTitle = 'Phlebotomist Assigned & En Route';
      stepDescription = booking.assignedPhlebotomistName
        ? `Certified phlebotomist ${booking.assignedPhlebotomistName} has been assigned with sterile butterfly collection equipment.`
        : 'Certified phlebotomist has been dispatched with sterile butterfly equipment.';
    } else {
      currentStep = 1;
      stepTitle = rawStatus === 'requested' ? 'Booking Requested' : 'Booking Confirmed';
      stepDescription = 'Your test booking is confirmed. Home collection / slot is being scheduled.';
    }

    const timeline = [
      {
        step: 1,
        title: 'Booking Confirmed',
        subtitle: 'Scheduled Slot',
        completed: currentStep >= 1,
        active: currentStep === 1,
        time: booking.preferredDate ? `${booking.preferredDate} (${booking.preferredTime || 'Morning'})` : new Date(booking.createdAt).toLocaleDateString('en-IN')
      },
      {
        step: 2,
        title: 'Phlebotomist Dispatched',
        subtitle: booking.assignedPhlebotomistName ? `Phlebo: ${booking.assignedPhlebotomistName}` : 'Gentle Care & Butterfly Kit',
        completed: currentStep >= 2,
        active: currentStep === 2,
        time: currentStep >= 2 ? (booking.assignedPhlebotomistName ? 'Assigned' : 'In Progress') : 'Pending'
      },
      {
        step: 3,
        title: 'Sample Collected',
        subtitle: 'Cold-Chain Sealed & Barcoded',
        completed: currentStep >= 3,
        active: currentStep === 3,
        time: currentStep >= 3 ? 'Completed' : 'Pending'
      },
      {
        step: 4,
        title: 'In Lab Testing',
        subtitle: 'NABL Certified Quality Check',
        completed: currentStep >= 4,
        active: currentStep === 4,
        time: currentStep >= 4 ? 'Processing' : 'Pending'
      },
      {
        step: 5,
        title: 'Report Ready',
        subtitle: rawStatus.includes('notif') ? 'Patient Notified (SMS/Email)' : 'MD Pathologist Verified',
        completed: currentStep >= 5,
        active: currentStep === 5,
        time: report?.reportDate ? new Date(report.reportDate).toLocaleDateString('en-IN') : (currentStep >= 5 ? 'Ready' : 'Expected in 24 hrs')
      }
    ];

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingId: booking.bookingId,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone ? booking.patientPhone.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2') : '',
        collectionType: booking.collectionType === 'home_collection' ? 'Home Sample Collection' : 'Lab Center Visit',
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
        status: booking.status,
        totalAmount: booking.totalAmount,
        createdAt: booking.createdAt,
        items: (booking.items || []).map((item: any) => ({
          name: item.testName || item.name,
          price: item.testPrice || item.price || 0
        }))
      },
      tracking: {
        currentStep,
        stepTitle,
        stepDescription,
        timeline,
        reportAvailable: !!report || currentStep >= 5,
        reportId: report?.id || null
      }
    });
  } catch (error) {
    console.error('Error tracking booking:', error);
    return NextResponse.json({ error: 'Failed to retrieve tracking status' }, { status: 500 });
  }
}
