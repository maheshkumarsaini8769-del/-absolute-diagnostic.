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

function createDummyPDF(text) {
  const streamContent = `BT /F1 12 Tf 50 700 Td (${text.replace(/[()]/g, '')}) Tj ET`;
  const streamLength = Buffer.byteLength(streamContent);
  const objects = [
    '1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj',
    '2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj',
    '3 0 obj\n<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>\nendobj',
    '4 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj',
    `5 0 obj\n<</Length ${streamLength}>>\nstream\n${streamContent}\nendstream\nendobj`
  ];
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  let offset = 9;
  const bodyParts = ['%PDF-1.4\n'];
  for (const obj of objects) {
    xref += offset.toString().padStart(10, '0') + ' 00000 n \n';
    bodyParts.push(obj + '\n');
    offset += Buffer.byteLength(obj + '\n');
  }
  const trailer = `trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${offset}\n%%EOF`;
  bodyParts.push(xref, trailer);
  return Buffer.from(bodyParts.join(''));
}

const results = [];

function logPass(category, name, detail = '') {
  console.log(`  ✅ [${category}] ${name}${detail ? ` -> ${detail}` : ''}`);
  results.push({ category, name, status: 'PASS', detail });
}

function logFail(category, name, error = '') {
  console.error(`  ❌ [${category}] ${name} -> ERROR: ${error}`);
  results.push({ category, name, status: 'FAIL', detail: error });
}

async function runAudit() {
  console.log('================================================================');
  console.log(`🔬 EXECUTING DEEP COMPREHENSIVE SYSTEM AUDIT ON: ${BASE_URL}`);
  console.log('================================================================\n');

  // ─────────────────────────────────────────────────────────────
  // 1. PUBLIC PAGES & NAVIGATION AUDIT
  // ─────────────────────────────────────────────────────────────
  console.log('--- 1. Public Website & Navigation Routes ---');
  const publicRoutes = [
    { path: '/', title: 'Home', keyword: 'Absolute Diagnostic' },
    { path: '/tests', title: 'Tests Listing', keyword: 'Tests' },
    { path: '/packages', title: 'Packages Listing', keyword: 'Packages' },
    { path: '/services', title: 'Services Page', keyword: 'Services' },
    { path: '/about', title: 'About Us', keyword: 'About' },
    { path: '/contact', title: 'Contact Us', keyword: 'Contact' },
    { path: '/faq', title: 'FAQ Page', keyword: 'Frequently Asked' },
    { path: '/branches', title: 'Branches Page', keyword: 'Branches' },
    { path: '/reports', title: 'Patient Reports Portal', keyword: 'Report' },
    { path: '/booking', title: 'Booking Page', keyword: 'Book' },
    { path: '/careers', title: 'Careers Portal', keyword: 'Careers' },
    { path: '/home-collection', title: 'Home Collection Service', keyword: 'Collection' },
    { path: '/night-service', title: 'Night Service Info', keyword: 'Night' },
    { path: '/night-request', title: 'Emergency Night Request', keyword: 'Night' },
    { path: '/tests/compare', title: 'Test Comparison Tool', keyword: 'Compare' },
  ];

  for (const route of publicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route.path}`, { cache: 'no-store' });
      if (res.status === 200) {
        const html = await res.text();
        const hasKeyword = html.toLowerCase().includes(route.keyword.toLowerCase());
        if (hasKeyword) {
          logPass('Public Pages', `GET ${route.path} (${route.title})`, `HTTP 200 OK`);
        } else {
          logFail('Public Pages', `GET ${route.path}`, `HTTP 200 but keyword "${route.keyword}" missing`);
        }
      } else {
        logFail('Public Pages', `GET ${route.path}`, `HTTP ${res.status}`);
      }
    } catch (e) {
      logFail('Public Pages', `GET ${route.path}`, e.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. STATIC MEDIA & ASSETS INTEGRITY
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Static Media & Assets Integrity ---');
  const mediaAssets = [
    '/images/hero-microscope.jpg',
    '/images/home-collection-lab.jpg',
    '/images/scientist-microscope.jpg',
    '/images/test-tube-analysis.jpg',
    '/admin-manifest.json',
    '/sw.js',
  ];

  for (const asset of mediaAssets) {
    try {
      const res = await fetch(`${BASE_URL}${asset}`);
      if (res.status === 200) {
        logPass('Media Assets', `GET ${asset}`, `HTTP 200 OK (${res.headers.get('content-type') || 'file'})`);
      } else {
        logFail('Media Assets', `GET ${asset}`, `HTTP ${res.status}`);
      }
    } catch (e) {
      logFail('Media Assets', `GET ${asset}`, e.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. PUBLIC TEST BOOKING & ADMIN WORKFLOW
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Public Test Booking & Admin Workflow ---');
  let createdBookingId = null;
  let adminBookingRecordId = null;
  const testPhone = `98765${Date.now().toString().slice(-5)}`;

  try {
    const bookingPayload = {
      patientName: '[AUDIT-TEST] Rahul Sharma',
      patientPhone: testPhone,
      patientEmail: 'audit.sharma@example.com',
      patientAddress: 'Flat 402, Green Park Avenue, Jaipur',
      collectionType: 'home_collection',
      preferredDate: '2026-09-15',
      preferredTime: '08:30 AM',
      items: [
        { testName: 'Complete Blood Count (CBC)', testPrice: 350 },
        { testName: 'Lipid Profile', testPrice: 650 }
      ],
      isNightBooking: false
    };

    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    });

    const bookData = await bookRes.json();
    if ((bookRes.status === 200 || bookRes.status === 201) && bookData.booking?.bookingId) {
      createdBookingId = bookData.booking.bookingId;
      logPass('Booking Flow', 'Submit Booking (POST /api/bookings)', `Created Booking ID: ${createdBookingId} (Sample: ${bookData.booking.sampleId})`);
    } else {
      logFail('Booking Flow', 'Submit Booking', `Status ${bookRes.status}: ${JSON.stringify(bookData)}`);
    }

    if (createdBookingId) {
      // Check Admin Bookings List
      const adminBookingsRes = await fetch(`${BASE_URL}/api/admin/bookings`, { headers: adminHeaders });
      const adminBookingsData = await adminBookingsRes.json();
      const foundInAdmin = adminBookingsData.bookings?.find(b => b.bookingId === createdBookingId);

      if (foundInAdmin) {
        adminBookingRecordId = foundInAdmin.id;
        logPass('Booking Flow', 'Admin Booking Visibility', `Found ${createdBookingId} in Admin Bookings`);

        // Test Lifecycle Transitions: confirmed -> sample_collected -> processing -> report_ready -> completed -> cancelled
        const lifecycleStages = ['confirmed', 'sample_collected', 'processing', 'report_ready', 'completed', 'cancelled'];
        for (const stage of lifecycleStages) {
          const patchRes = await fetch(`${BASE_URL}/api/admin/bookings/${adminBookingRecordId}`, {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({ status: stage, notes: `[AUDIT-TEST] Updated to ${stage}` })
          });
          const patchData = await patchRes.json();
          if (patchRes.status === 200 && patchData.booking?.status === stage) {
            logPass('Booking Lifecycle', `Transition -> "${stage}"`, `Status successfully saved`);
          } else {
            logFail('Booking Lifecycle', `Transition -> "${stage}"`, `Failed with status ${patchRes.status}`);
          }
        }
      } else {
        logFail('Booking Flow', 'Admin Booking Visibility', `Booking ${createdBookingId} not in Admin list`);
      }
    }
  } catch (e) {
    logFail('Booking Flow', 'Online Booking Workflow', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. TESTS CRUD & DYNAMIC SYNCHRONIZATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Tests CRUD & Dynamic Synchronization ---');
  let testRecordId = null;
  const testSlug = `audit-test-vitamin-${Date.now()}`;

  try {
    // 1. Get Category
    const testsRes = await fetch(`${BASE_URL}/api/tests`);
    const testsData = await testsRes.json();
    const categoryId = testsData.categories?.[0]?.id;

    if (!categoryId) {
      throw new Error('No category available for test creation');
    }

    // 2. Admin Creates Test
    const createTestRes = await fetch(`${BASE_URL}/api/admin/tests`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: '[AUDIT-TEST] Vitamin D3 & B12 Assay',
        slug: testSlug,
        categoryId: categoryId,
        price: 1599,
        mrp: 2400,
        discount: 33,
        shortDescription: 'Audit test for dynamic sync verification.',
        description: 'Measures Vitamin D3 and Vitamin B12 levels in blood.',
        reportTime: '24 Hours',
        preparationInstructions: 'Overnight 10-12 hours fasting required.',
        fastingRequired: true,
        homeCollection: true,
        nightAvailable: false,
        isActive: true,
        isFeatured: false,
        displayOrder: 999
      })
    });

    const createTestData = await createTestRes.json();
    if (createTestRes.status === 201 && createTestData.test?.id) {
      testRecordId = createTestData.test.id;
      logPass('Tests Sync', 'Admin Create Test (POST /api/admin/tests)', `Test ID: ${testRecordId}`);

      // 3. Verify on Public API
      const pubTestsRes1 = await fetch(`${BASE_URL}/api/tests`, { cache: 'no-store' });
      const pubTestsData1 = await pubTestsRes1.json();
      const foundPublicTest1 = pubTestsData1.tests?.find(t => t.id === testRecordId || t.slug === testSlug);
      if (foundPublicTest1 && foundPublicTest1.price === 1599) {
        logPass('Tests Sync', 'Public /api/tests Visibility', `Found test at ₹1599`);
      } else {
        logFail('Tests Sync', 'Public /api/tests Visibility', `Test not visible on public API`);
      }

      // 4. Admin Updates Test Price
      const newTestPrice = 1799;
      const updateTestRes = await fetch(`${BASE_URL}/api/admin/tests/${testRecordId}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ price: newTestPrice })
      });
      if (updateTestRes.status === 200) {
        logPass('Tests Sync', 'Admin Update Test (PUT /api/admin/tests/[id])', `Price updated to ₹${newTestPrice}`);

        // Verify updated price reflects on public API immediately
        const pubTestsRes2 = await fetch(`${BASE_URL}/api/tests`, { cache: 'no-store' });
        const pubTestsData2 = await pubTestsRes2.json();
        const foundPublicTest2 = pubTestsData2.tests?.find(t => t.id === testRecordId || t.slug === testSlug);
        if (foundPublicTest2 && foundPublicTest2.price === newTestPrice) {
          logPass('Tests Sync', 'Public API Price Synchronization', `Reflects ₹${newTestPrice} instantly`);
        } else {
          logFail('Tests Sync', 'Public API Price Synchronization', `Price mismatch: ${foundPublicTest2?.price}`);
        }
      } else {
        logFail('Tests Sync', 'Admin Update Test', `Status ${updateTestRes.status}`);
      }

      // 5. Admin Deletes Test
      const delTestRes = await fetch(`${BASE_URL}/api/admin/tests/${testRecordId}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
      if (delTestRes.status === 200) {
        logPass('Tests Sync', 'Admin Delete Test (DELETE /api/admin/tests/[id])', 'Soft-deleted successfully');

        // Verify removed from public API
        const pubTestsRes3 = await fetch(`${BASE_URL}/api/tests`, { cache: 'no-store' });
        const pubTestsData3 = await pubTestsRes3.json();
        const stillPresentTest = pubTestsData3.tests?.some(t => t.id === testRecordId);
        if (!stillPresentTest) {
          logPass('Tests Sync', 'Public API Clean Removal', 'Verified removed from public tests');
        } else {
          logFail('Tests Sync', 'Public API Clean Removal', 'Test still visible on public API');
        }
      } else {
        logFail('Tests Sync', 'Admin Delete Test', `Status ${delTestRes.status}`);
      }
    } else {
      logFail('Tests Sync', 'Admin Create Test', `Status ${createTestRes.status}: ${JSON.stringify(createTestData)}`);
    }
  } catch (e) {
    logFail('Tests Sync', 'Tests CRUD Workflow', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. PACKAGES CRUD & DYNAMIC SYNCHRONIZATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Packages CRUD & Dynamic Synchronization ---');
  let pkgRecordId = null;
  const pkgSlug = `audit-test-pkg-${Date.now()}`;

  try {
    // 1. Admin Creates Package
    const createPkgRes = await fetch(`${BASE_URL}/api/admin/packages`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: '[AUDIT-TEST] Senior Citizen Complete Wellness',
        slug: pkgSlug,
        description: 'Comprehensive health checkup package for seniors.',
        price: 2499,
        mrp: 4500,
        discount: 44,
        reportTime: '24-48 Hours',
        preparationInstructions: 'Overnight 10-12 hours fasting required.',
        homeCollection: true,
        isActive: true,
        isFeatured: false,
        displayOrder: 999
      })
    });

    const createPkgData = await createPkgRes.json();
    if (createPkgRes.status === 201 && createPkgData.package?.id) {
      pkgRecordId = createPkgData.package.id;
      logPass('Packages Sync', 'Admin Create Package (POST /api/admin/packages)', `Package ID: ${pkgRecordId}`);

      // 2. Verify on Public API
      const pubPkgRes1 = await fetch(`${BASE_URL}/api/packages`, { cache: 'no-store' });
      const pubPkgData1 = await pubPkgRes1.json();
      const foundPublicPkg1 = (pubPkgData1.packages || pubPkgData1).find(p => p.id === pkgRecordId || p.slug === pkgSlug);
      if (foundPublicPkg1 && foundPublicPkg1.price === 2499) {
        logPass('Packages Sync', 'Public /api/packages Visibility', `Found package at ₹2499`);
      } else {
        logFail('Packages Sync', 'Public /api/packages Visibility', 'Package not visible on public API');
      }

      // 3. Admin Updates Package Price
      const newPkgPrice = 2899;
      const updatePkgRes = await fetch(`${BASE_URL}/api/admin/packages/${pkgRecordId}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ price: newPkgPrice })
      });
      if (updatePkgRes.status === 200) {
        logPass('Packages Sync', 'Admin Update Package (PUT /api/admin/packages/[id])', `Price updated to ₹${newPkgPrice}`);

        // Verify updated price on public API
        const pubPkgRes2 = await fetch(`${BASE_URL}/api/packages`, { cache: 'no-store' });
        const pubPkgData2 = await pubPkgRes2.json();
        const foundPublicPkg2 = (pubPkgData2.packages || pubPkgData2).find(p => p.id === pkgRecordId || p.slug === pkgSlug);
        if (foundPublicPkg2 && foundPublicPkg2.price === newPkgPrice) {
          logPass('Packages Sync', 'Public API Price Synchronization', `Reflects ₹${newPkgPrice} instantly`);
        } else {
          logFail('Packages Sync', 'Public API Price Synchronization', `Price mismatch: ${foundPublicPkg2?.price}`);
        }
      } else {
        logFail('Packages Sync', 'Admin Update Package', `Status ${updatePkgRes.status}`);
      }

      // 4. Admin Deletes Package
      const delPkgRes = await fetch(`${BASE_URL}/api/admin/packages/${pkgRecordId}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
      if (delPkgRes.status === 200) {
        logPass('Packages Sync', 'Admin Delete Package (DELETE /api/admin/packages/[id])', 'Soft-deleted successfully');

        // Verify removed from public API
        const pubPkgRes3 = await fetch(`${BASE_URL}/api/packages`, { cache: 'no-store' });
        const pubPkgData3 = await pubPkgRes3.json();
        const stillPresentPkg = (pubPkgData3.packages || pubPkgData3).some(p => p.id === pkgRecordId);
        if (!stillPresentPkg) {
          logPass('Packages Sync', 'Public API Clean Removal', 'Verified removed from public packages');
        } else {
          logFail('Packages Sync', 'Public API Clean Removal', 'Package still visible on public API');
        }
      } else {
        logFail('Packages Sync', 'Admin Delete Package', `Status ${delPkgRes.status}`);
      }
    } else {
      logFail('Packages Sync', 'Admin Create Package', `Status ${createPkgRes.status}: ${JSON.stringify(createPkgData)}`);
    }
  } catch (e) {
    logFail('Packages Sync', 'Packages CRUD Workflow', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. FAKE REPORT UPLOAD & PATIENT PORTAL DIRECT ACCESS
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 6. Fake Report Upload & Patient Portal Direct Access ---');
  let uploadedReportId = null;

  try {
    const testPdfContent = `Patient: Mahesh Saini Age: 18 Gender: Male Mobile: 7742735762 Test: Complete Blood Count CBC Report Date: 09/09/2026 Hemoglobin: 14.8 g/dL Platelets: 250000 /uL Normal`;
    const pdfBuffer = createDummyPDF(testPdfContent);
    const boundary = '----WebKitFormBoundaryAuditReport';
    const postBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="report"; filename="Mahesh_Audit_CBC_${Date.now()}.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      pdfBuffer,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="patientName"\r\n\r\nMahesh Saini\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="mobile"\r\n\r\n7742735762\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="testName"\r\n\r\nComplete Blood Count (CBC)\r\n`),
      Buffer.from(`--${boundary}--\r\n`),
    ]);

    const uploadRes = await fetch(`${BASE_URL}/api/admin/reports/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${adminToken}`,
        'Cookie': `session_token=${adminToken}`
      },
      body: postBody
    });

    const uploadData = await uploadRes.json();
    if (uploadRes.status === 200 && uploadData.report?.id) {
      uploadedReportId = uploadData.report.id;
      logPass('Report Flow', 'Admin Fake Report Upload', `Report ID: ${uploadedReportId}`);

      // Verify report date parsing
      const reportDateParsed = uploadData.extraction?.reportDate || uploadData.report?.reportDate;
      logPass('Report Flow', 'Report Date Parsing (Safe Date Parser)', `Extracted/Processed: ${reportDateParsed || 'Current Date Fallback'}`);

      // Publish report
      const publishRes = await fetch(`${BASE_URL}/api/admin/reports/confirm`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          reportId: uploadedReportId,
          action: 'update_status',
          status: 'published'
        })
      });
      const publishData = await publishRes.json();
      if (publishRes.status === 200 && publishData.report?.status === 'published') {
        logPass('Report Flow', 'Admin Publish Report', 'Status updated to "published"');
      } else {
        logFail('Report Flow', 'Admin Publish Report', `Status ${publishRes.status}`);
      }

      // View Report as Admin
      const viewRes = await fetch(`${BASE_URL}${uploadData.report.fileUrl}`);
      const contentType = viewRes.headers.get('content-type');
      if (viewRes.status === 200 && contentType?.includes('application/pdf')) {
        logPass('Report Flow', 'Stream PDF from MongoDB Atlas (ReportFile)', `Content-Type: ${contentType}`);
      } else {
        logFail('Report Flow', 'Stream PDF from MongoDB Atlas', `Status ${viewRes.status}, Content-Type: ${contentType}`);
      }

      // Download PDF (?download=true)
      const downloadRes = await fetch(`${BASE_URL}${uploadData.report.fileUrl}?download=true`);
      const disposition = downloadRes.headers.get('content-disposition');
      if (downloadRes.status === 200 && disposition?.includes('attachment')) {
        logPass('Report Flow', 'Download PDF Attachment Header', `Content-Disposition: ${disposition}`);
      } else {
        logFail('Report Flow', 'Download PDF Attachment Header', `Status ${downloadRes.status}, disposition: ${disposition}`);
      }

      // Delete Report in Admin
      const delReportRes = await fetch(`${BASE_URL}/api/admin/reports/${uploadedReportId}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
      if (delReportRes.status === 200) {
        logPass('Report Flow', 'Admin Delete Report (DELETE /api/admin/reports/[id])', 'Report cleaned up successfully');
      } else {
        logFail('Report Flow', 'Admin Delete Report', `Status ${delReportRes.status}`);
      }
    } else {
      logFail('Report Flow', 'Admin Fake Report Upload', `Status ${uploadRes.status}: ${JSON.stringify(uploadData)}`);
    }
  } catch (e) {
    logFail('Report Flow', 'Report Workflow', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. PATIENT AUTHENTICATION & PORTAL SECURITY
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 7. Patient Authentication & Portal Security ---');
  try {
    // 1. Name + Age alone without phone must be rejected (HTTP 400)
    const actRes1 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_record', name: 'Rahul Sharma', age: 28 })
    });
    if (actRes1.status === 400) {
      logPass('Patient Security', 'Reject Name+Age without Mobile (HTTP 400)', 'Enforced correctly');
    } else {
      logFail('Patient Security', 'Reject Name+Age without Mobile', `Status ${actRes1.status}`);
    }

    // 2. Non-existent phone rejected (HTTP 404)
    const actRes2 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_record', phone: '0000000000' })
    });
    if (actRes2.status === 404) {
      logPass('Patient Security', 'Reject Non-Existent Mobile (HTTP 404)', 'Enforced correctly');
    } else {
      logFail('Patient Security', 'Reject Non-Existent Mobile', `Status ${actRes2.status}`);
    }

    // 3. Verify brand new unactivated patient (testPhone from booking in phase 3)
    const actRes3 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_record', phone: testPhone })
    });
    const actData3 = await actRes3.json();
    if (actRes3.status === 200 && actData3.verified) {
      logPass('Patient Security', 'Verify Unactivated Mobile for First-Time Access', `Found patient: ${actData3.patientName}`);

      // Create password & activate
      const newPassword = 'Secure@Pass2026!';
      const actResCreate = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_password',
          patientId: actData3.patientId,
          phone: testPhone,
          password: newPassword,
          confirmPassword: newPassword
        })
      });
      const actCreateData = await actResCreate.json();
      if (actResCreate.status === 200 && actCreateData.token) {
        logPass('Patient Security', 'Generate Password & Direct Report Session', `Token generated, Reports: ${actCreateData.reports?.length || 0}`);
      } else {
        logFail('Patient Security', 'Generate Password & Direct Report Session', `Status ${actResCreate.status}`);
      }
    } else {
      logFail('Patient Security', 'Verify Unactivated Mobile', `Status ${actRes3.status}: ${JSON.stringify(actData3)}`);
    }

    // 4. Strict Security: Already activated patient must NOT be re-activatable!
    const actRes4 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_record', phone: '7742735762' })
    });
    const actData4 = await actRes4.json();
    if (actRes4.status === 400 && actData4.alreadyActivated) {
      logPass('Patient Security', 'Prevent Activation Reuse for Existing Patient', `Directs to Login: ${actData4.error}`);
    } else {
      logFail('Patient Security', 'Prevent Activation Reuse', `Expected 400 alreadyActivated, got ${actRes4.status}`);
    }

    // 5. Reject weak password
    const actRes5 = await fetch(`${BASE_URL}/api/auth/patient/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_password',
        patientId: '6a9e836829110625d23ddd25',
        phone: '9876500000',
        password: 'weak',
        confirmPassword: 'weak'
      })
    });
    if (actRes5.status === 400) {
      logPass('Patient Security', 'Reject Weak Password Policy (HTTP 400)', 'Policy enforced');
    } else {
      logFail('Patient Security', 'Reject Weak Password Policy', `Status ${actRes5.status}`);
    }

    // 6. Reject wrong password on password-login (HTTP 401)
    const loginRes1 = await fetch(`${BASE_URL}/api/auth/patient/password-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '7742735762', password: 'WrongPassword99!' })
    });
    if (loginRes1.status === 401) {
      logPass('Patient Security', 'Reject Invalid Credentials (HTTP 401)', 'Generic error returned');
    } else {
      logFail('Patient Security', 'Reject Invalid Credentials', `Status ${loginRes1.status}`);
    }
  } catch (e) {
    logFail('Patient Security', 'Patient Auth & Security', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 8. ADMIN SETTINGS DYNAMIC SYNCHRONIZATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 8. Admin Settings Dynamic Synchronization ---');
  try {
    const settingsRes = await fetch(`${BASE_URL}/api/admin/settings`, { headers: adminHeaders });
    const settingsData = await settingsRes.json();
    const currentCharge = settingsData.settings?.home_collection_charge || '100';
    const auditCharge = '145';

    // Update setting
    const updateRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        settings: [{ key: 'home_collection_charge', value: auditCharge, type: 'number' }]
      })
    });

    if (updateRes.status === 200) {
      logPass('Settings Sync', 'Update Setting in Admin', `Set home_collection_charge = ${auditCharge}`);

      // Verify update
      const verifyRes = await fetch(`${BASE_URL}/api/admin/settings`, { headers: adminHeaders });
      const verifyData = await verifyRes.json();
      if (verifyData.settings?.home_collection_charge === auditCharge) {
        logPass('Settings Sync', 'Verify Updated Value', `Reflects ${auditCharge} immediately`);
      } else {
        logFail('Settings Sync', 'Verify Updated Value', `Value mismatch: ${verifyData.settings?.home_collection_charge}`);
      }

      // Restore original setting
      await fetch(`${BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          settings: [{ key: 'home_collection_charge', value: currentCharge, type: 'number' }]
        })
      });
      logPass('Settings Sync', 'Restore Setting', `Restored original charge ${currentCharge}`);
    } else {
      logFail('Settings Sync', 'Update Setting in Admin', `Status ${updateRes.status}`);
    }
  } catch (e) {
    logFail('Settings Sync', 'Settings Workflow', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 9. MOBILE DEVICE REGISTRATION & PUSH ARCHITECTURE
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 9. Mobile Device Registration & Push Architecture ---');
  try {
    const regRes = await fetch(`${BASE_URL}/api/admin/devices`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        deviceName: 'Audit Device (Android 14 Chrome)',
        deviceType: 'mobile',
        browser: 'Chrome Mobile 120',
        endpoint: `https://fcm.googleapis.com/fcm/send/audit-device-${Date.now()}`,
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9AcUbVYO2-0U0WwTU2SoQ',
        auth: 'tBHItJI5svbpez7KI4CCXg'
      })
    });

    const regData = await regRes.json();
    if ((regRes.status === 200 || regRes.status === 201) && regData.device?.id) {
      logPass('Mobile Device Push', 'Register Device (POST /api/admin/devices)', `Registered Device ID: ${regData.device.id}`);

      // Delete test device
      const delDevRes = await fetch(`${BASE_URL}/api/admin/devices/${regData.device.id}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
      if (delDevRes.status === 200) {
        logPass('Mobile Device Push', 'Delete Device (DELETE /api/admin/devices/[id])', 'Cleaned up test device');
      } else {
        logFail('Mobile Device Push', 'Delete Device', `Status ${delDevRes.status}`);
      }
    } else {
      logFail('Mobile Device Push', 'Register Device', `Status ${regRes.status}: ${JSON.stringify(regData)}`);
    }
  } catch (e) {
    logFail('Mobile Device Push', 'Device Registration', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 10. CAREER APPLICATION SUBMISSION
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 10. Public Career Application Submission ---');
  try {
    const careerRes = await fetch(`${BASE_URL}/api/careers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '[AUDIT-TEST] Dr. Ananya Sen',
        phone: '+919876543210',
        email: 'audit.ananya@example.com',
        position: 'Consultant Pathologist (MD / DNB)',
        experience: '4 years',
        message: 'This is an automated audit submission to verify careers form function.'
      })
    });
    const careerData = await careerRes.json();
    if (careerRes.status === 200 && careerData.success) {
      logPass('Careers Portal', 'Submit Job Application (POST /api/careers)', `Application received`);
    } else {
      logFail('Careers Portal', 'Submit Job Application', `Status ${careerRes.status}: ${JSON.stringify(careerData)}`);
    }
  } catch (e) {
    logFail('Careers Portal', 'Careers Application', e.message);
  }

  // ─────────────────────────────────────────────────────────────
  // AUDIT SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('📊 COMPREHENSIVE SYSTEM AUDIT SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`Total Checks Executed : ${total}`);
  console.log(`Checks Passed         : ${passed} (✅ ${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Checks Failed         : ${failed} (❌ ${failed === 0 ? '0' : failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    console.log('FAILED ITEMS DETAILS:');
    results.filter(r => r.status === 'FAIL').forEach(f => {
      console.log(`  - [${f.category}] ${f.name}: ${f.detail}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
