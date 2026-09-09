import 'dotenv/config';
import jwt from 'jsonwebtoken';

const BASE_URL = process.env.AUDIT_TARGET_URL || 'https://lab-app-green.vercel.app';
const JWT_SECRET = process.env.JWT_SECRET || 'absolutely-secure-secret-key-2024-change-in-production';
const ADMIN_ID = '6a9e828c0a127887711c3cff';

const adminToken = jwt.sign(
  { adminId: ADMIN_ID, email: 'admin@absolutediagnostic.com', role: 'admin', type: 'admin' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const adminHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${adminToken}`,
  'Cookie': `session_token=${adminToken}`
};

const results = [];

function logPass(category, name, detail = '') {
  console.log(`  ✅ [${category}] ${name}${detail ? ` -> ${detail}` : ''}`);
  results.push({ category, name, status: 'PASS', detail });
}

function logFail(category, name, error = '') {
  console.error(`  ❌ [${category}] ${name} -> ERROR: ${error}`);
  results.push({ category, name, status: 'FAIL', detail: error });
}

async function runExtendedAudit() {
  console.log('================================================================');
  console.log(`🔎 TESTING EXTENDED FEATURES & SUB-MODULES ON: ${BASE_URL}`);
  console.log('================================================================\n');

  // ─────────────────────────────────────────────────────────────
  // 1. PUBLIC CONTACT FORM SUBMISSION
  // ─────────────────────────────────────────────────────────────
  console.log('--- 1. Public Contact Form Submission ---');
  try {
    const contactRes = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '[AUDIT-TEST] Inquiry User',
        phone: '9876543210',
        message: 'Checking lab branch location and timing inquiry.'
      })
    });
    const contactData = await contactRes.json();
    if (contactRes.status === 200 && contactData.success) {
      logPass('Contact Form', 'Submit Inquiry (POST /api/contact)', `Notification ID: ${contactData.notification?.id || 'Created'}`);
    } else {
      logFail('Contact Form', 'Submit Inquiry', `Status ${contactRes.status}: ${JSON.stringify(contactData)}`);
    }
  } catch (e) {
    logFail('Contact Form', 'Contact Form Submission', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. EMERGENCY 24/7 NIGHT BOOKING REQUEST
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Emergency 24/7 Night Booking Request ---');
  try {
    const nightRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: '[AUDIT-TEST] Emergency Patient',
        patientPhone: '9876599999',
        collectionType: 'night_request',
        preferredTime: '11:30 PM',
        items: [{ testName: 'Emergency Cardiac Enzymes (Troponin-I)', testPrice: 1200 }],
        isNightBooking: true,
        nightMessage: 'Emergency chest discomfort sample collection required urgently.'
      })
    });
    const nightData = await nightRes.json();
    if ((nightRes.status === 200 || nightRes.status === 201) && nightData.booking?.bookingId) {
      logPass('Night Emergency', 'Submit Night Request (POST /api/bookings)', `Booking ID: ${nightData.booking.bookingId} (Night Charge: ₹${nightData.booking.nightCharge || 0})`);
    } else {
      logFail('Night Emergency', 'Submit Night Request', `Status ${nightRes.status}: ${JSON.stringify(nightData)}`);
    }
  } catch (e) {
    logFail('Night Emergency', 'Night Booking Error', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. ADMIN OPERATIONAL MODULES (Lab Operations, QC, Inventory, Doctors, Corporate)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Admin Operational Modules & Backend Worklists ---');
  const adminEndpoints = [
    { ep: '/api/admin/samples', name: 'Samples Management Worklist' },
    { ep: '/api/admin/lab-worklist', name: 'Lab Technician Active Worklist' },
    { ep: '/api/admin/pathologist', name: 'Pathologist Verification Queue' },
    { ep: '/api/admin/inventory', name: 'Reagents & Lab Consumables Inventory' },
    { ep: '/api/admin/equipment', name: 'Laboratory Equipment & Analyzers' },
    { ep: '/api/admin/qc', name: 'Quality Control (QC) & Calibration' },
    { ep: '/api/admin/doctors', name: 'Referring Doctors & Clinicians Directory' },
    { ep: '/api/admin/corporate', name: 'Corporate Clients & Health Camps' },
    { ep: '/api/admin/billing', name: 'Invoices, Receipts & Billing Management' },
    { ep: '/api/admin/analytics', name: 'Revenue & Volume Analytics Engine' },
    { ep: '/api/admin/audit', name: 'HIPAA/NABL Compliance Audit Trails' },
    { ep: '/api/admin/notifications', name: 'Real-Time Admin Alerts & Notifications' },
    { ep: '/api/admin/authorized-admins', name: 'Role-Based Access Control (RBAC)' },
    { ep: '/api/admin/testimonials', name: 'Patient Testimonials & Reviews' },
  ];

  for (const item of adminEndpoints) {
    try {
      const res = await fetch(`${BASE_URL}${item.ep}`, { headers: adminHeaders });
      if (res.status === 200) {
        logPass('Admin Modules', item.name, `HTTP 200 OK (${item.ep})`);
      } else {
        logFail('Admin Modules', item.name, `HTTP ${res.status} on ${item.ep}`);
      }
    } catch (e) {
      logFail('Admin Modules', item.name, e.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. DEVICE PAIRING CODE GENERATOR
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Device Pairing Code Architecture ---');
  try {
    const pairRes = await fetch(`${BASE_URL}/api/admin/devices/pairing-code`, {
      method: 'POST',
      headers: adminHeaders
    });
    const pairData = await pairRes.json();
    if (pairRes.status === 200 && pairData.code) {
      logPass('Device Pairing', 'Generate 6-Digit Pairing Code', `Code: ${pairData.code} (Expires in 10 mins)`);
    } else {
      logFail('Device Pairing', 'Generate Pairing Code', `Status ${pairRes.status}: ${JSON.stringify(pairData)}`);
    }
  } catch (e) {
    logFail('Device Pairing', 'Pairing Code Error', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. PUBLIC CONTENT APIS (Branches, FAQs, Blogs, Homepage Data)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Public Content APIs ---');
  const publicApis = [
    { ep: '/api/branches', name: 'Lab Branches List with Geolocation' },
    { ep: '/api/faqs', name: 'Frequently Asked Questions API' },
    { ep: '/api/blogs', name: 'Diagnostic & Medical Health Blogs' },
    { ep: '/api/homepage-data', name: 'Homepage Dynamic Content & Settings' },
  ];

  for (const item of publicApis) {
    try {
      const res = await fetch(`${BASE_URL}${item.ep}`);
      if (res.status === 200) {
        logPass('Public APIs', item.name, `HTTP 200 OK (${item.ep})`);
      } else {
        logFail('Public APIs', item.name, `HTTP ${res.status} on ${item.ep}`);
      }
    } catch (e) {
      logFail('Public APIs', item.name, e.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EXTENDED SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('📊 EXTENDED AUDIT SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`Extended Checks Executed : ${total}`);
  console.log(`Checks Passed           : ${passed} (✅ ${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Checks Failed           : ${failed} (❌ ${failed === 0 ? '0' : failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    console.log('FAILED ITEMS:');
    results.filter(r => r.status === 'FAIL').forEach(f => {
      console.log(`  - [${f.category}] ${f.name}: ${f.detail}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runExtendedAudit().catch(err => {
  console.error('Fatal extended audit error:', err);
  process.exit(1);
});
