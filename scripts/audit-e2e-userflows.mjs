import 'dotenv/config';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024';
const ADMIN_ID = '6a9e828c0a127887711c3cff';

const adminToken = jwt.sign(
  { adminId: ADMIN_ID, email: 'admin@absolutediagnostic.com', type: 'admin' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const adminHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${adminToken}`,
  'Cookie': `session_token=${adminToken}`
};

async function testUserFlows() {
  console.log('====================================================');
  console.log('🧪 TESTING PUBLIC USER FLOWS & REAL DATA LIFECYCLE');
  console.log('====================================================');

  let testBookingId = null;
  let testMongoBookingId = null;
  let testSampleId = null;

  try {
    // 1. Contact Form
    console.log('\n--- 1. Testing Contact Form (POST /api/contact) ---');
    const contactRes = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Test User',
        email: 'audit@example.com',
        phone: '9999999999',
        subject: 'Audit Automated Test',
        message: 'This is a test message to verify the contact form API works.'
      })
    });
    console.log(`Contact API Status: ${contactRes.status}`);
    const contactData = await contactRes.json();
    console.log('Contact response:', contactData);

    // 2. Careers Form
    console.log('\n--- 2. Testing Careers Form (POST /api/careers) ---');
    const careersRes = await fetch(`${BASE_URL}/api/careers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Audit Test Applicant',
        email: 'applicant@example.com',
        phone: '9999999999',
        position: 'Lab Technician',
        experience: '3 years',
        message: 'Automated test application'
      })
    });
    console.log(`Careers API Status: ${careersRes.status}`);
    const careersData = await careersRes.json();
    console.log('Careers response:', careersData);

    // 3. Booking Flow
    console.log('\n--- 3. Testing Booking Creation (POST /api/bookings) ---');
    const bookingPayload = {
      patientName: 'Audit Test Patient',
      patientPhone: '9888877777',
      patientEmail: 'patient.audit@example.com',
      patientAddress: '123 Test Street, Jaipur',
      collectionType: 'home_collection',
      preferredDate: new Date().toISOString().slice(0, 10),
      preferredTime: '10:00 AM',
      isNightBooking: false,
      items: [
        {
          testName: 'Complete Blood Count (CBC)',
          testPrice: 350
        }
      ]
    };

    const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    });
    console.log(`Booking Create Status: ${bookingRes.status}`);
    const bookingData = await bookingRes.json();
    if (bookingRes.status === 201 && bookingData.booking) {
      testBookingId = bookingData.booking.bookingId;
      testMongoBookingId = bookingData.booking.id;
      testSampleId = bookingData.booking.sampleId;
      console.log(`✅ Booking Created! ID: ${testBookingId}, Total: ₹${bookingData.booking.totalAmount}`);

      // Verify retrieval by bookingId
      console.log(`\n--- Testing Public Booking Retrieval (/api/bookings/${testBookingId}) ---`);
      const getBookingRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}`);
      console.log(`Get Booking Status: ${getBookingRes.status}`);
      const getBookingData = await getBookingRes.json();
      console.log(`Booking retrieved for patient: ${getBookingData.booking?.patientName}`);

      // Verify in Admin bookings API
      console.log(`\n--- Verifying Booking in Admin API (/api/admin/bookings) ---`);
      const adminBookingsRes = await fetch(`${BASE_URL}/api/admin/bookings`, { headers: adminHeaders });
      const adminBookingsData = await adminBookingsRes.json();
      const foundInAdmin = adminBookingsData.bookings?.some(b => b.bookingId === testBookingId);
      console.log(`Found in Admin Bookings list: ${foundInAdmin ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('❌ Booking creation failed:', bookingData);
    }

    // 4. Test Patient Authentication with Existing Patient
    console.log('\n--- 4. Testing Patient Password Login (/api/auth/patient/password-login) ---');
    const loginRes = await fetch(`${BASE_URL}/api/auth/patient/password-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '7742735762',
        password: 'NewSecret@2026#'
      })
    });
    console.log(`Patient Login Status: ${loginRes.status}`);
    const loginData = await loginRes.json();
    console.log(`Patient Login Response:`, { success: loginData.success, patientName: loginData.patient?.name });

    // Clean up test booking, samples, notifications
    if (testBookingId || testMongoBookingId) {
      console.log('\n--- Cleaning up test booking from database ---');
      await mongoose.connect(process.env.MONGODB_URI);
      const db = mongoose.connection.db;
      if (testBookingId) {
        await db.collection('bookings').deleteMany({ bookingId: testBookingId });
        await db.collection('samples').deleteMany({ sampleId: testSampleId });
        await db.collection('notifications').deleteMany({ bookingId: testMongoBookingId });
        await db.collection('patients').deleteMany({ phone: '9888877777' });
        console.log('✅ Cleaned up test booking, sample, notification, and patient');
      }
      await mongoose.disconnect();
    }

    console.log('\n====================================================');
    console.log('🎉 USER FLOW AUDIT COMPLETED SUCCESSFULLY');
    console.log('====================================================');
  } catch (err) {
    console.error('Audit user flows failed with error:', err);
  }
}

testUserFlows();
